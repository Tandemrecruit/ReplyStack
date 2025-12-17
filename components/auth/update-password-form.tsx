"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  getPasswordRequirementsList,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/validation/auth";

/**
 * Update password form for setting a new password after clicking the reset link.
 * Uses Supabase Auth updateUser to set the new password.
 */
export function UpdatePasswordForm() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const passwordRequirements = useMemo(() => getPasswordRequirementsList(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
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

      // Validate fields
      const errors: { password?: string; confirmPassword?: string } = {};

      const passwordError = validatePassword(password);
      if (passwordError) {
        errors.password = passwordError;
      }

      const confirmError = validatePasswordMatch(password, confirmPassword);
      if (confirmError) {
        errors.confirmPassword = confirmError;
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setIsLoading(true);

      try {
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          setStatus({ type: "error", message: error.message });
          return;
        }

        // Success - show message then redirect to login
        setStatus({
          type: "success",
          message: "Password updated successfully. Redirecting to login...",
        });

        // Redirect after a brief delay to show success message
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch {
        setStatus({
          type: "error",
          message: "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [password, confirmPassword, supabase, router],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

      {/* Password field */}
      <div>
        <Input
          type="password"
          name="password"
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
        {/* Password requirements */}
        <ul className="mt-2 text-xs text-foreground-muted space-y-1">
          {passwordRequirements.map((req) => (
            <li key={req} className="flex items-center gap-1">
              <span className="text-foreground-muted">-</span>
              {req}
            </li>
          ))}
        </ul>
      </div>

      {/* Confirm password field */}
      <Input
        type="password"
        name="confirmPassword"
        label="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={fieldErrors.confirmPassword}
        required
        autoComplete="new-password"
        disabled={isLoading}
      />

      {/* Submit button */}
      <Button
        type="submit"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        Update password
      </Button>

      {/* Back to login link */}
      <p className="text-center text-sm text-foreground-secondary">
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to login
        </Link>
      </p>
    </form>
  );
}
