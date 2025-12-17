"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/validation/auth";

/**
 * Login form component with email/password authentication and Google OAuth.
 *
 * Features:
 * - Email/password login via Supabase Auth
 * - Google OAuth sign-in
 * - Field-level validation and error display
 * - Loading states during submission
 * - Redirect to dashboard (or custom redirect param) on success
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  // Only allow relative paths to prevent open redirect attacks
  const redirectTo =
    redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/dashboard";

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous errors
      setFieldErrors({});
      setGeneralError(null);

      // Validate fields
      const errors: { email?: string; password?: string } = {};

      const emailError = validateEmail(email);
      if (emailError) {
        errors.email = emailError;
      }

      if (!password) {
        errors.password = "Password is required";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setIsLoading(true);

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          // Handle specific Supabase auth errors
          if (error.message.includes("Invalid login credentials")) {
            setGeneralError("Invalid email or password");
          } else if (error.message.includes("Email not confirmed")) {
            setGeneralError(
              "Please verify your email address before signing in",
            );
          } else {
            setGeneralError(error.message);
          }
          return;
        }

        // Success - redirect to dashboard or specified redirect
        router.push(redirectTo);
        router.refresh();
      } catch {
        setGeneralError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, supabase, router, redirectTo],
  );

  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    setGeneralError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setGeneralError(error.message);
        setIsGoogleLoading(false);
      }
      // If successful, browser will redirect to Google OAuth
    } catch {
      setGeneralError("Failed to initiate Google sign-in. Please try again.");
      setIsGoogleLoading(false);
    }
  }, [supabase, redirectTo]);

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
      <Input
        type="password"
        name="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        required
        autoComplete="current-password"
        disabled={isLoading || isGoogleLoading}
      />

      {/* Forgot password link */}
      <div className="text-right">
        <Link
          href="/reset-password"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        isLoading={isLoading}
        disabled={isLoading || isGoogleLoading}
        className="w-full"
      >
        Sign in
      </Button>

      <AuthDivider />

      {/* Google OAuth button */}
      <GoogleOAuthButton
        onClick={handleGoogleSignIn}
        isLoading={isGoogleLoading}
        disabled={isLoading || isGoogleLoading}
      />

      {/* Sign up link */}
      <p className="text-center text-sm text-foreground-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
