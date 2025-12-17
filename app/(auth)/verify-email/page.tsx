import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verify Email | ReplyStack",
  description: "Check your email to verify your account",
};

/**
 * Email verification pending page displayed after signup.
 * Instructs users to check their email and click the verification link.
 */
export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
        <p className="mt-2 text-foreground-secondary">
          We&apos;ve sent a verification link to your email address.
        </p>
      </div>

      <div className="p-6 bg-surface rounded-lg border border-border">
        {/* Email icon */}
        <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-primary-100">
          <svg
            className="w-8 h-8 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-foreground-secondary">
          Click the link in the email to verify your account and access your
          dashboard.
        </p>
        <p className="mt-4 text-sm text-foreground-muted">
          The link will expire in 24 hours.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-foreground-muted">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <Link
            href="/signup"
            className="text-primary-600 hover:text-primary-700"
          >
            try again with a different email
          </Link>
        </p>

        <Link
          href="/login"
          className="inline-block text-sm text-foreground-secondary hover:text-foreground"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
