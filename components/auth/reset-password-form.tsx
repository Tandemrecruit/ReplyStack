"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/validation/auth";

/**
 * Password reset request form.
 * Sends a password reset email to the user via Supabase Auth.
 */
export function ResetPasswordForm() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous state
      setFieldErrors({});
      setStatus({ type: "idle" });

      // Validate email
      const emailError = validateEmail(email);
      if (emailError) {
        setFieldErrors({ email: emailError });
        return;
      }

      setIsLoading(true);

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/update-password`,
          },
        );

        if (error) {
          setStatus({ type: "error", message: error.message });
          return;
        }

        // Success - show confirmation message
        setStatus({
          type: "success",
          message:
            "Check your email for a password reset link. The link will expire in 24 hours.",
        });
      } catch {
        setStatus({
          type: "error",
          message: "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [email, supabase],
  );

  // Show success state
  if (status.type === "success") {
    return (
      <div className="space-y-6 text-center">
        <div className="p-6 bg-surface rounded-lg border border-border">
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-green-100">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-foreground-secondary">{status.message}</p>
        </div>

        <Link
          href="/login"
          className="inline-block text-sm text-foreground-secondary hover:text-foreground"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Error banner */}
      {status.type === "error" && status.message && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
        >
          {status.message}
        </div>
      )}

      {/* Email field */}
      <Input
        type="email"
        name="email"
        label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        required
        autoComplete="email"
        disabled={isLoading}
      />

      {/* Submit button */}
      <Button
        type="submit"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        Send reset link
      </Button>

      {/* Back to login link */}
      <p className="text-center text-sm text-foreground-secondary">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
