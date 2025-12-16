import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * Handle Stripe webhook POST requests and update organization records in Supabase based on the incoming event.
 *
 * Verifies the Stripe signature, constructs the event, and processes supported event types:
 * - `checkout.session.completed`: sets customer/subscription IDs and upgrades plan to `professional`
 * - `customer.subscription.updated`: sets `plan_tier` to `professional` when active, otherwise `starter`
 * - `customer.subscription.deleted`: sets `plan_tier` to `starter` and clears `stripe_subscription_id`
 * - `invoice.payment_failed`: logs the failed invoice (placeholder for notification)
 *
 * @returns `{ received: true }` on successful processing; otherwise an error object with an `error` message and an appropriate HTTP status code.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;

        if (organizationId && session.customer && session.subscription) {
          await supabase
            .from('organizations')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan_tier: 'professional',
            })
            .eq('id', organizationId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;

        if (organizationId) {
          const planTier = subscription.status === 'active' ? 'professional' : 'starter';
          await supabase
            .from('organizations')
            .update({ plan_tier: planTier })
            .eq('id', organizationId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;

        if (organizationId) {
          await supabase
            .from('organizations')
            .update({
              plan_tier: 'starter',
              stripe_subscription_id: null,
            })
            .eq('id', organizationId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // TODO: Send payment failed email notification
        console.log('Payment failed for invoice:', invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}