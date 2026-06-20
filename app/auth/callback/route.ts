import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Route handler for Supabase OAuth callback.
 * Exchanges the code param for a session cookie and redirects user.
 * 
 * Uses a standalone server client instead of the shared createClient()
 * helper because Route Handlers need to write cookies onto the outgoing
 * NextResponse, which the shared helper's try/catch silently swallows.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Handle errors returned by OAuth provider (e.g., user denied consent)
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  if (errorParam) {
    const msg = errorDescription || errorParam;
    console.error('OAuth provider error:', msg);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`
    );
  }


  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Read cookies from the incoming request
            return request.headers
              .get('cookie')
              ?.split('; ')
              .map((c) => {
                const [name, ...rest] = c.split('=');
                return { name, value: rest.join('=') };
              }) ?? [];
          },
          setAll(cookiesToSet) {
            // Write cookies onto the outgoing redirect response
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    console.error('Error exchanging OAuth code for session:', error.message);
  }

  // Redirect to login page with error message if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=Authentication+failed`);
}
