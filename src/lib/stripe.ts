import Stripe from 'stripe';

// Initialize the Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export interface CreateCheckoutSessionParams {
  customerId?: string;
  customerEmail?: string;
  organizationId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Creates a Stripe Checkout session configured for a subscription purchase.
 *
 * @param params - Parameters for session creation; if `params.customerId` is provided it will be attached to the session, otherwise `params.customerEmail` will be used to prefill the customer. The created subscription includes a 14-day trial and `organizationId` is recorded in both session and subscription metadata.
 * @returns The created Stripe Checkout Session
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const { customerId, customerEmail, organizationId, priceId, successUrl, cancelUrl } = params;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    ...(customerId ? { customer: customerId } : { customer_email: customerEmail }),
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        organizationId,
      },
    },
    metadata: {
      organizationId,
    },
  });

  return session;
}

/**
 * Creates a Stripe Billing Portal session that directs a customer to manage billing.
 *
 * @param customerId - The Stripe customer ID to create the portal session for.
 * @param returnUrl - URL the customer is redirected to after leaving the portal.
 * @returns The created Stripe Billing Portal session.
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get or create a Stripe customer for an organization
 */
export async function getOrCreateCustomer(
  email: string,
  organizationId: string,
  organizationName: string
): Promise<Stripe.Customer> {
  // Check if customer already exists
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: organizationName,
    metadata: {
      organizationId,
    },
  });

  return customer;
}

/**
 * Retrieve a Stripe subscription by its ID.
 *
 * @returns The Stripe subscription matching `subscriptionId`, or `null` if it cannot be retrieved (for example, not found or an error occurs)
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

/**
 * Cancel a subscription at the end of its current billing period.
 *
 * @param subscriptionId - The ID of the subscription to cancel at period end
 * @returns The updated Stripe Subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export default stripe;