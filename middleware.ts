import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Updates the Supabase session from the incoming Next.js request and forwards the result to Next.js middleware.
 *
 * @param request - The incoming Next.js request used to extract and refresh session state.
 * @returns The value returned by `updateSession` (typically a `NextResponse` that continues, redirects, or modifies the request).
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't need auth (webhooks, crons)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks|api/cron).*)",
  ],
};