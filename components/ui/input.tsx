"use client";

import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string | undefined;
  /** Error message to display below the input */
  error?: string | undefined;
  /** Help text displayed below the label */
  helpText?: string | undefined;
}

/**
 * Reusable input component with label, error state, and accessibility support.
 *
 * Features:
 * - Consistent styling with the design system
 * - Error state with red border and error message
 * - Accessibility via aria-invalid and aria-describedby
 * - Help text support
 *
 * @example
 * ```tsx
 * <Input
 *   type="email"
 *   name="email"
 *   label="Email address"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={fieldErrors.email}
 *   required
 * />
 * ```
 */
export function Input({
  label,
  error,
  helpText,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      {helpText && (
        <p id={helpId} className="text-sm text-foreground-muted">
          {helpText}
        </p>
      )}
      <input
        id={inputId}
        className={`
          mt-1 w-full px-3 py-2 bg-surface border rounded-md text-foreground
          placeholder:text-foreground-muted
          focus:outline-none focus:ring-2 focus:ring-offset-1
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-border focus:ring-primary-500"
          }
          ${className}
        `}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
