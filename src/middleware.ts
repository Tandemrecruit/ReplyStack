import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/api/webhooks'];

// Routes that are always accessible
const publicPrefixes = ['/api/webhooks/', '/_next/', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next();
  }

  // Update the session and check for user
  const { supabaseResponse, user } = await updateSession(request);

  // If no user and trying to access protected route, redirect to login
  if (!user && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user && pathname.startsWith('/reviews')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user && pathname.startsWith('/settings')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user && pathname.startsWith('/voice-profile')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
