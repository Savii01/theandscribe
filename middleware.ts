import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/reset-password', '/auth/callback'];
const AUTH_REDIRECT = '/login';
const POST_AUTH_REDIRECT = '/dashboard';

function isPublicRoute(pathname: string): boolean {
  return pathname === '/' || PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isAuthPage(pathname: string): boolean {
  return ['/login', '/register', '/reset-password'].some((route) =>
    pathname.startsWith(route)
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove this call
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // If authenticated user visits auth page → redirect to dashboard
  if (user && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = POST_AUTH_REDIRECT;
    return NextResponse.redirect(url);
  }

  // If unauthenticated user visits protected route → redirect to login
  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_REDIRECT;
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public files like robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
