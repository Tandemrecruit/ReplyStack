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
 * Create a Stripe Checkout session for subscription
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
 * Create a Stripe Customer Portal session for billing management
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
 * Retrieve subscription details
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
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export default stripe;
