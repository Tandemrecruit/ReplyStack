"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

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

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface text-foreground-muted">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google OAuth button */}
      <Button
        type="button"
        variant="secondary"
        onClick={handleGoogleSignUp}
        isLoading={isGoogleLoading}
        disabled={isLoading || isGoogleLoading}
        className="w-full"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

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
