import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Refreshes the Supabase session for the incoming request and enforces auth-based redirects.
 *
 * Creates a Supabase server client bound to the request cookies, updates session cookies as needed,
 * and returns a response that may redirect unauthenticated requests from protected routes to /login
 * or redirect authenticated users away from auth routes to their target (default /dashboard).
 *
 * @param request - The incoming NextRequest used to read cookies and the request URL
 * @returns A NextResponse that may be a redirect to a login or dashboard route, or the response with updated Supabase auth cookies
 * @throws Error if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not set
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route classifications
  const pathname = request.nextUrl.pathname;

  // Auth routes where unauthenticated users can visit
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth");

  // Auth routes that should remain accessible even for unverified users
  const isUnverifiedAllowedRoute =
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/update-password") ||
    pathname.startsWith("/callback");

  // Protected routes requiring authentication and email verification
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/reviews") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/billing");

  // Redirect unauthenticated users from protected routes to login
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated but unverified users to verify-email page
  // (except for routes that should remain accessible)
  if (user && !user.email_confirmed_at && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify-email";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated and verified users away from auth pages
  // (but allow access to verify-email, reset-password, update-password, callback)
  if (user?.email_confirmed_at && isAuthRoute && !isUnverifiedAllowedRoute) {
    const url = request.nextUrl.clone();
    const redirectParam = url.searchParams.get("redirect");
    // Only allow relative paths to prevent open redirect attacks
    const redirect =
      redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : "/dashboard";
    url.pathname = redirect;
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
