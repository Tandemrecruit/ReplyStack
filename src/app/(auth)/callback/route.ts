import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth callback handler for Supabase authentication
 * This handles the redirect from Google OAuth
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
