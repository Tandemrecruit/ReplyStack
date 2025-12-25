import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing FAQ | Replily",
  description:
    "Answers to common questions about Replily pricing, billing, and features.",
};

const faqs = [
  {
    q: "How long is the free trial?",
    a: "14 days—no credit card required. You get full access to all features.",
  },
  {
    q: "What happens after the trial?",
    a: "You'll be prompted to subscribe at $49/month. If you don't, your account stays active but you won't be able to generate new responses.",
  },
  {
    q: "Can I add multiple locations?",
    a: "Not yet. The current plan supports one business location. Multi-location support is on our roadmap—contact us if you need it sooner.",
  },
  {
    q: "Is there a limit on AI responses?",
    a: "No. Generate as many drafts as you need.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings and you'll keep access until the end of your billing cycle.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Not yet. We're focused on keeping pricing simple for now.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit cards via Stripe.",
  },
];

/**
 * Renders the Pricing FAQ page with a list of common billing and feature questions and a contact call-to-action.
 *
 * Displays a centered content area with a heading, subheading, a question-and-answer list sourced from the module-level `faqs` array, and a contact panel containing a mailto link to support@replily.com.
 *
 * @returns The JSX element for the pricing FAQ page.
 */
export default function PricingFAQPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-4">Pricing FAQ</h1>
        <p className="text-lg text-foreground-secondary mb-12">
          Quick answers to the most common questions about billing and features.
        </p>

        <dl className="space-y-8">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="text-lg font-semibold text-foreground">{faq.q}</dt>
              <dd className="mt-2 text-foreground-secondary">{faq.a}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 p-6 rounded-2xl bg-surface border border-border">
          <p className="text-foreground-secondary">
            Still have questions?{" "}
            <Link
              href="mailto:support@replily.com"
              className="text-primary-700 hover:underline font-medium"
            >
              Email us
            </Link>{" "}
            and we'll get back to you within a day.
          </p>
        </div>
      </div>
    </main>
  );
}
