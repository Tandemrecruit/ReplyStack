"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  getPasswordRequirementsList,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/validation/auth";

/**
 * Signup form component with email/password registration and Google OAuth.
 *
 * Features:
 * - Email/password registration via Supabase Auth
 * - Password confirmation field
 * - Password requirements display
 * - Google OAuth sign-up
 * - Redirect to verify-email page on success
 */
export function SignupForm() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const passwordRequirements = useMemo(() => getPasswordRequirementsList(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous errors
      setFieldErrors({});
      setGeneralError(null);

      // Validate fields
      const errors: {
        email?: string;
        password?: string;
        confirmPassword?: string;
      } = {};

      const emailError = validateEmail(email);
      if (emailError) {
        errors.email = emailError;
      }

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
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/callback?next=/dashboard`,
          },
        });

        if (error) {
          // Handle specific Supabase auth errors
          if (error.message.includes("already registered")) {
            setGeneralError(
              "An account with this email already exists. Try signing in instead.",
            );
          } else {
            setGeneralError(error.message);
          }
          return;
        }

        // Success - redirect to verify-email page
        router.push("/verify-email");
      } catch {
        setGeneralError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, confirmPassword, supabase, router],
  );

  const handleGoogleSignUp = useCallback(async () => {
    setIsGoogleLoading(true);
    setGeneralError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback?next=/dashboard`,
        },
      });

      if (error) {
        setGeneralError(error.message);
        setIsGoogleLoading(false);
      }
      // If successful, browser will redirect to Google OAuth
    } catch {
      setGeneralError("Failed to initiate Google sign-up. Please try again.");
      setIsGoogleLoading(false);
    }
  }, [supabase]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* General error banner */}
      {generalError && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
        >
          {generalError}
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
        disabled={isLoading || isGoogleLoading}
      />

      {/* Password field */}
      <div>
        <Input
          type="password"
          name="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
          autoComplete="new-password"
          disabled={isLoading || isGoogleLoading}
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
        label="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={fieldErrors.confirmPassword}
        required
        autoComplete="new-password"
        disabled={isLoading || isGoogleLoading}
      />

      {/* Submit button */}
      <Button
        type="submit"
        isLoading={isLoading}
        disabled={isLoading || isGoogleLoading}
        className="w-full"
      >
        Create account
      </Button>

      <AuthDivider />

      {/* Google OAuth button */}
      <GoogleOAuthButton
        onClick={handleGoogleSignUp}
        isLoading={isGoogleLoading}
        disabled={isLoading || isGoogleLoading}
      />

      {/* Terms notice */}
      <p className="text-center text-xs text-foreground-muted">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-primary-600 hover:text-primary-700">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-primary-600 hover:text-primary-700"
        >
          Privacy Policy
        </Link>
      </p>

      {/* Sign in link */}
      <p className="text-center text-sm text-foreground-secondary">
        Already have an account?{" "}
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
