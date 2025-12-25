import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ReplyStack",
  description: "How ReplyStack handles your data and privacy.",
};

/**
 * Render the ReplyStack Privacy Policy page, including site header, policy content sections, and a last-updated footer note.
 *
 * @returns A React element containing the header (brand and actions), the main privacy policy content, and a footer note with the last-updated date.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="font-bold text-foreground">
            ReplyStack
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              className="text-foreground-secondary hover:text-foreground"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors"
              href="/#waitlist"
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-foreground-secondary">
          This is a plain-language summary of how ReplyStack handles data. If
          you have questions, email{" "}
          <a
            className="text-primary-700 hover:underline"
            href="mailto:support@replystack.com"
          >
            support@replystack.com
          </a>
          .
        </p>

        <div className="mt-10 space-y-8">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">What we collect</h2>
            <ul className="list-disc pl-5 text-foreground-secondary space-y-1">
              <li>Account info (email, organization details).</li>
              <li>
                Google Business Profile data you connect (reviews, locations).
              </li>
              <li>Usage data needed to operate and improve the product.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">How we use it</h2>
            <ul className="list-disc pl-5 text-foreground-secondary space-y-1">
              <li>To draft review replies in your preferred voice and tone.</li>
              <li>To sync reviews and publish replies when you choose.</li>
              <li>To provide support, billing, and account security.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Data sharing</h2>
            <p className="text-foreground-secondary">
              We use trusted service providers (for hosting, payments, email,
              and AI generation) only as needed to deliver the service. We don’t
              sell your data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="text-foreground-secondary">
              We take reasonable steps to protect your information. Sensitive
              tokens should be stored encrypted at rest and never exposed
              client-side.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-foreground-secondary">
              Questions, requests, or concerns:{" "}
              <a
                className="text-primary-700 hover:underline"
                href="mailto:support@replystack.com"
              >
                support@replystack.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 text-sm text-foreground-muted">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </main>
    </div>
  );
}
