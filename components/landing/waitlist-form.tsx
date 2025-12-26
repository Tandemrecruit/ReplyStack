"use client";

import { useCallback, useState } from "react";

/**
 * Review volume options for the waitlist form
 */
const REVIEW_VOLUME_OPTIONS = [
  { value: "less_than_10", label: "Less than 10" },
  { value: "10_to_50", label: "10-50" },
  { value: "50_to_100", label: "50-100" },
  { value: "100_plus", label: "100+" },
] as const;

/**
 * Waitlist signup form for the landing page.
 *
 * Features:
 * - Email and review volume collection
 * - Client-side validation before submit
 * - Loading states during submission
 * - Success state replaces form
 * - Error display
 */
export function WaitlistForm() {
  const [formData, setFormData] = useState({
    email: "",
    review_volume: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    review_volume?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous errors
      setFieldErrors({});
      setGeneralError(null);

      // Validate fields
      const errors: { email?: string; review_volume?: string } = {};

      if (!formData.email) {
        errors.email = "Email is required";
      } else if (
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email)
      ) {
        errors.email = "Please enter a valid email address";
      }

      if (!formData.review_volume) {
        errors.review_volume = "Please select your monthly review volume";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          setGeneralError(data.error || "An error occurred");
          return;
        }

        // Success - show success state
        setIsSuccess(true);
      } catch {
        setGeneralError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [formData],
  );

  // Success state replaces the form
  if (isSuccess) {
    return (
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-md text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent-50 border border-accent-200 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-accent-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
        <h3 className="text-xl font-semibold text-foreground mb-2">
          You&apos;re on the list!
        </h3>
        <p className="text-foreground-secondary">
          We&apos;ll reach out soon with early access details.
        </p>
        <span className="inline-block mt-4 px-2 py-1 rounded-full text-xs font-semibold bg-accent-50 text-accent-700 border border-accent-200">
          Early access confirmed
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl bg-surface border border-border shadow-md"
      noValidate
    >
      <div className="space-y-4">
        {/* General error banner */}
        {generalError && (
          <div
            role="alert"
            className="p-3 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm text-center"
          >
            {generalError}
          </div>
        )}

        {/* Email field */}
        <div>
          <label
            htmlFor="waitlist-email"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            Email address
          </label>
          <input
            type="email"
            id="waitlist-email"
            name="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="you@yourbusiness.com"
            disabled={isLoading}
            className={`w-full rounded-full border bg-surface text-foreground px-4 py-3 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors disabled:opacity-50 ${
              fieldErrors.email ? "border-red-500" : "border-border"
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Review volume field */}
        <div>
          <label
            htmlFor="waitlist-review-volume"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            How many Google reviews does your business get per month?
          </label>
          <select
            id="waitlist-review-volume"
            name="review_volume"
            value={formData.review_volume}
            onChange={(e) =>
              setFormData({ ...formData, review_volume: e.target.value })
            }
            disabled={isLoading}
            className={`w-full rounded-full border bg-surface text-foreground px-4 py-3 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors disabled:opacity-50 appearance-none cursor-pointer ${
              fieldErrors.review_volume ? "border-red-500" : "border-border"
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 1rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
              paddingRight: "2.5rem",
            }}
          >
            <option value="">Select volume...</option>
            {REVIEW_VOLUME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.review_volume && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.review_volume}
            </p>
          )}
          <p className="mt-1 text-sm text-foreground-muted">
            This helps us prioritize your access
          </p>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-8 py-4 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Joining..." : "Join the Waitlist"}
        </button>
      </div>
    </form>
  );
}
