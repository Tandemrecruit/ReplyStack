import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens, fetchAccounts, fetchLocations } from '@/lib/google';

/**
 * Handle Google OAuth callback, persist the Google refresh token, sync the user's Google Business Profile locations into the database, and redirect to /settings with a status indicator.
 *
 * @returns A redirect Response to /settings whose query string contains either `success=google_connected` or an `error` key describing the failure (e.g., `missing_code`, `not_authenticated`, `token_save_failed`, `no_business_accounts`, `no_organization`, `oauth_failed`).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const redirectUrl = new URL('/settings', request.url);

  if (error) {
    redirectUrl.searchParams.set('error', 'google_auth_denied');
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirectUrl.searchParams.set('error', 'not_authenticated');
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Store refresh token securely
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_refresh_token: tokens.refreshToken,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error saving refresh token:', updateError);
      redirectUrl.searchParams.set('error', 'token_save_failed');
      return NextResponse.redirect(redirectUrl);
    }

    // Fetch user's Google Business Profile accounts
    const accounts = await fetchAccounts(tokens.accessToken);

    if (accounts.length === 0) {
      redirectUrl.searchParams.set('error', 'no_business_accounts');
      return NextResponse.redirect(redirectUrl);
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      redirectUrl.searchParams.set('error', 'no_organization');
      return NextResponse.redirect(redirectUrl);
    }

    // Fetch locations for the first account (MVP: single account support)
    const firstAccount = accounts[0];
    const locations = await fetchLocations(tokens.accessToken, firstAccount.name);

    // Save locations to database
    for (const location of locations) {
      const locationParts = location.name.split('/');
      const googleAccountId = locationParts[1];
      const googleLocationId = locationParts[3];

      await supabase.from('locations').upsert(
        {
          organization_id: userData.organization_id,
          google_account_id: googleAccountId,
          google_location_id: googleLocationId,
          name: location.locationName,
          address: location.address?.addressLines?.join(', ') || null,
          is_active: true,
        },
        {
          onConflict: 'google_account_id,google_location_id',
        }
      );
    }

    redirectUrl.searchParams.set('success', 'google_connected');
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    redirectUrl.searchParams.set('error', 'oauth_failed');
    return NextResponse.redirect(redirectUrl);
  }
}