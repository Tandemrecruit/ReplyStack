import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Update Password | ReplyStack",
  description: "Set your new password",
};

/**
 * Update password page for setting a new password after clicking the reset link.
 */
export default function UpdatePasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
        <p className="mt-2 text-foreground-secondary">
          Enter your new password below
        </p>
      </div>

      <UpdatePasswordForm />
    </div>
  );
}
