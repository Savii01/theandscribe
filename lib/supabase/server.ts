import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Cookie-aware server client — resolves user sessions from cookies.
 * Use this for auth.getUser() in Server Components and API routes.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Cookie-aware client specifically for resolving the current user in API routes.
 * Alias of createClient() — use auth.getUser() on this, never on the service client.
 */
export const createUserClient = createClient;

/**
 * Server client using the service role key — bypasses RLS entirely.
 * Has NO cookie context — auth.getUser() will ALWAYS return null on this client.
 * Only use for DB reads/writes after user identity is confirmed via createUserClient().
 */
export async function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
