import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Handle incoming Stripe webhook POST requests for subscription and invoice events.
 *
 * Validates presence of the `stripe-signature` header and responds with 400 if missing.
 * Processes Stripe events related to subscriptions and invoices and returns a JSON response indicating success.
 *
 * @param request - The incoming NextRequest containing the webhook payload and headers
 * @returns A JSON NextResponse: `{ received: true }` on successful handling; `{ error: "Missing stripe-signature header" }` with status 400 when the signature header is absent; `{ error: "Webhook handler failed" }` with status 500 on internal errors
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
