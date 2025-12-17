import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password | ReplyStack",
  description: "Reset your ReplyStack password",
};

/**
 * Password reset request page.
 * Users enter their email to receive a password reset link.
 */
export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
        <p className="mt-2 text-foreground-secondary">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
