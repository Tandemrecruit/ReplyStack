import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Handle Supabase OAuth callback, exchange the authorization code for a session, and redirect the client.
 *
 * If an authorization `code` is present the handler exchanges it for a session; on exchange error it redirects
 * to `/login` with the error message as the `error` query parameter. If no error occurs (or no `code` is present)
 * the handler redirects to the `next` query parameter value or `/dashboard` when `next` is not provided.
 *
 * @returns A redirect `NextResponse` to the post-auth destination (`next` or `/dashboard`), or to `/login` with an `error` query parameter when the code exchange fails.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error.message);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          requestUrl.origin,
        ),
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
