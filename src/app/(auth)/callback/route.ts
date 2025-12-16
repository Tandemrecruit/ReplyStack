import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handle the OAuth redirect callback from Google and complete Supabase sign-in.
 *
 * Exchanges the authorization `code` query parameter for a Supabase session; on success redirects the user to the `next` query parameter (defaults to `/dashboard`), otherwise redirects to `/login?error=auth_callback_error`.
 *
 * @param request - Incoming request containing `code` and optional `next` query parameters
 * @returns A redirect response to the destination on successful sign-in or to the login page with an error flag on failure
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the next page or dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If there's an error, redirect to login with error
  return NextResponse.redirect(
    new URL('/login?error=auth_callback_error', requestUrl.origin)
  );
}