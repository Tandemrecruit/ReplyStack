import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserInsert } from "@/lib/supabase/types";

/**
 * Handle Supabase OAuth callback, exchange the authorization code for a session, and redirect the client.
 *
 * If an authorization `code` is present the handler exchanges it for a session; on exchange error it redirects
 * to `/login` with the error message as the `error` query parameter. If no error occurs (or no `code` is present)
 * the handler redirects to the `next` query parameter value or `/dashboard` when `next` is not provided.
 *
 * For Google OAuth, also captures and stores the provider_refresh_token for API access.
 *
 * @returns A redirect `NextResponse` to the post-auth destination (`next` or `/dashboard`), or to `/login` with an `error` query parameter when the code exchange fails.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error.message);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          requestUrl.origin,
        ),
      );
    }

    // After successful code exchange, capture Google provider token if present
    const { session } = data ?? {};

    if (session?.provider_refresh_token && session.user) {
      // Store the Google refresh token for API access
      // Note: Token is stored as-is; encryption should be handled at database level via Supabase Vault

      // Ensure email is non-empty: users.email is NOT NULL, so we use a provider-scoped
      // synthetic email as fallback if the OAuth provider didn't return an email.
      // This ensures we never pass an empty string to the database.
      const email =
        session.user.email?.trim() ||
        `${session.user.id}@google-noreply`;

      if (!session.user.email?.trim()) {
        console.warn(
          `Missing email in OAuth session for user ${session.user.id}, using fallback email`,
        );
      }

      const userData: UserInsert = {
        id: session.user.id,
        email,
        google_refresh_token: session.provider_refresh_token,
      };
      const { error: upsertError } = await supabase
        .from("users")
        .upsert(userData, { onConflict: "id" });

      if (upsertError) {
        console.error(
          "Failed to store Google refresh token:",
          upsertError.message,
        );
        // Continue with redirect - user can re-authenticate later if needed
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
