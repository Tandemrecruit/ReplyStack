/**
 * Stripe Payment Integration
 *
 * TODO: Implement Stripe integration
 * - Create checkout sessions
 * - Handle webhooks
 * - Manage customer portal
 *
 * @see https://stripe.com/docs/api
 */

/**
 * Creates a Stripe Checkout Session for a subscription.
 *
 * @returns An object with `url` set to the hosted Checkout Session URL for redirecting the customer
 */
export async function createCheckoutSession(
  _customerId: string,
  _priceId: string,
  _successUrl: string,
  _cancelUrl: string,
): Promise<{ url: string }> {
  // TODO: Implement checkout session creation
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({...});
  throw new Error("Not implemented");
}

/**
 * Create a Stripe customer portal session for the specified customer.
 *
 * @param _customerId - The Stripe customer ID to open the portal for
 * @param _returnUrl - URL to redirect the customer to after they leave the portal
 * @returns An object containing the portal session `url`
 */
export async function createPortalSession(
  _customerId: string,
  _returnUrl: string,
): Promise<{ url: string }> {
  // TODO: Implement customer portal session
  throw new Error("Not implemented");
}

/**
 * Get subscription status for a customer.
 *
 * @returns An object with:
 * - `status`: one of `"active"`, `"trialing"`, `"canceled"`, `"past_due"`, or `"none"`.
 * - `trialEndsAt` (optional): the trial end date when `status` is `"trialing"`.
 * - `currentPeriodEnd` (optional): the subscription's current period end date when applicable.
 */
export async function getSubscriptionStatus(_customerId: string): Promise<{
  status: "active" | "trialing" | "canceled" | "past_due" | "none";
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
}> {
  // TODO: Implement subscription status retrieval
  return { status: "none" };
}

/**
 * Verifies Stripe webhook signature
 */
export function verifyWebhookSignature(
  _payload: string,
  _signature: string,
): boolean {
  // TODO: Implement webhook signature verification
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  return false;
}