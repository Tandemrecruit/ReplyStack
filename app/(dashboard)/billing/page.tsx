import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing | ReplyStack",
  description: "Manage your subscription and billing",
};

export default function BillingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="mt-1 text-foreground-secondary">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <section className="p-6 bg-surface rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Current Plan
            </h2>
            <p className="mt-1 text-foreground-secondary">Free Trial</p>
          </div>
          <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm font-medium">
            Trial
          </span>
        </div>

        <div className="mt-4 p-4 bg-background-secondary rounded-md">
          <p className="text-sm text-foreground-secondary">
            Your free trial ends in{" "}
            <span className="font-medium text-foreground">14 days</span>
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="p-6 bg-surface rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Upgrade to Pro
        </h2>
        <p className="mt-1 text-foreground-secondary">
          Unlock unlimited AI responses and all features
        </p>

        <div className="mt-6 p-6 border border-primary-200 rounded-lg bg-primary-50">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">$49</span>
            <span className="text-foreground-secondary">/month</span>
          </div>

          <ul className="mt-4 space-y-3">
            <li className="flex items-center gap-2 text-foreground">
              <svg
                className="w-5 h-5 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Unlimited AI responses
            </li>
            <li className="flex items-center gap-2 text-foreground">
              <svg
                className="w-5 h-5 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              1 business location
            </li>
            <li className="flex items-center gap-2 text-foreground">
              <svg
                className="w-5 h-5 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Email notifications
            </li>
            <li className="flex items-center gap-2 text-foreground">
              <svg
                className="w-5 h-5 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Custom voice profile
            </li>
          </ul>

          <button
            type="button"
            className="mt-6 w-full px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </section>

      {/* Payment History */}
      <section className="p-6 bg-surface rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Payment History
        </h2>

        <div className="mt-4 text-center py-8">
          <p className="text-foreground-muted">No payments yet</p>
        </div>
      </section>
    </div>
  );
}
