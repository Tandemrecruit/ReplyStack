import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | ReplyStack",
  description:
    "Terms and conditions for using ReplyStack, the AI-powered review response tool for local businesses.",
};

/**
 * Render the Terms of Service page for ReplyStack.
 *
 * Renders static, semantically-structured Terms of Service content (including a
 * last-updated timestamp, numbered sections 1–10 covering eligibility, account
 * use, billing, termination, disclaimers, and contact information) and a
 * mailto link to support@replystack.com.
 *
 * @returns A React element containing the Terms of Service page
 */
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-foreground-secondary">
          Last updated: December 16, 2025
        </p>

        <p>
          These Terms of Service ("Terms") govern your access to and use of
          ReplyStack's website, products, and services. By creating an account
          or using the Service, you agree to these Terms.
        </p>

        <h2>1. Eligibility</h2>
        <p>
          You must be 18 years or older and authorized to operate a business or
          act on behalf of a business entity to use our Service.
        </p>

        <h2>2. Your Account</h2>
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your
          account.
        </p>

        <h2>3. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose.</li>
          <li>
            Attempt to interfere with the proper functioning of the Service.
          </li>
          <li>Post content that is defamatory, obscene, or misleading.</li>
          <li>
            Use automated scripts to access the Service in a way that sends more
            request messages than a human can reasonably produce using a
            conventional web browser.
          </li>
        </ul>

        <h2>4. Intellectual Property</h2>
        <p>
          All content, features, and functionality of the Service are owned by
          ReplyStack and are protected by copyright, trademark, and other
          intellectual property laws. You retain ownership of content you create
          through the Service (e.g., review responses).
        </p>

        <h2>5. Billing &amp; Cancellation</h2>
        <p>
          Subscription fees are billed in advance on a monthly basis. You can
          cancel at any time from your account settings, and you will continue
          to have access until the end of your current billing cycle.
        </p>

        <h2>6. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service if you violate
          these Terms. Upon termination, your right to use the Service ceases
          immediately.
        </p>

        <h2>7. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.
          ReplyStack does not guarantee that generated responses will be
          error-free, appropriate, or meet your specific requirements.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, ReplyStack shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages.
        </p>

        <h2>9. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. If we make material
          changes, we'll notify you via email or a prominent notice on the
          Service.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions? Email us at{" "}
          <Link
            href="mailto:support@replystack.com"
            className="text-primary-700 hover:underline"
          >
            support@replystack.com
          </Link>
          .
        </p>
      </article>
    </main>
  );
}