import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up | ReplyStack",
  description: "Create your ReplyStack account",
};

/**
 * Signup page with email/password registration and Google OAuth.
 */
export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Create account</h1>
        <p className="mt-2 text-foreground-secondary">
          Start responding to reviews in seconds
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
