import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Route handler for Supabase OAuth callback.
 * Exchanges the code param for a session cookie and redirects user.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('Error exchanging OAuth code for session:', error);
  }

  // Redirect to login page if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=Authentication failed`);
}
