import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Stripe webhook handler
 * Handles subscription events: checkout.session.completed, subscription.updated, etc.
 *
 * TODO: Implement webhook verification and event handling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    // TODO: Verify webhook signature
    // TODO: Parse and handle Stripe events
    // - checkout.session.completed
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_failed

    console.warn("Stripe webhook received but not yet implemented", {
      bodyLength: body.length,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
