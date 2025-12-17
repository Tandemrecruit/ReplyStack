import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | ReplyStack",
  description: "Sign in to your ReplyStack account",
};

function LoginFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-16 bg-surface rounded-md" />
      <div className="h-16 bg-surface rounded-md" />
      <div className="h-10 bg-surface rounded-md" />
    </div>
  );
}

/**
 * Login page with email/password and Google OAuth authentication.
 */
export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-foreground-secondary">
          Sign in to manage your reviews
        </p>
      </div>

      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
