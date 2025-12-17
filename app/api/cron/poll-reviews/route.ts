import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Cron job to poll Google Business Profile for new reviews
 * Runs every 15 minutes via Vercel Cron
 *
 * vercel.json config:
 * {
 *   "crons": [{
 *     "path": "/api/cron/poll-reviews",
 *     "schedule": "* /15 * * * *"
 *   }]
 * }
 *
 * TODO: Implement review polling logic
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Implement review polling
    // 1. Get all active locations
    // 2. For each location, fetch new reviews from Google API
    // 3. Store new reviews in database
    // 4. Send notifications for new reviews

    console.warn("Cron job poll-reviews not yet implemented");

    return NextResponse.json({
      success: true,
      message: "Poll reviews cron job executed (not yet implemented)",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Poll reviews cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
