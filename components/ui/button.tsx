import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
  secondary:
    "bg-surface border border-border text-foreground hover:bg-background-secondary focus:ring-primary-500",
  ghost:
    "text-foreground-secondary hover:text-foreground hover:bg-background-secondary focus:ring-primary-500",
  danger: "bg-error text-white hover:bg-red-600 focus:ring-red-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

/**
 * Renders a styled HTML button with configurable visual variant, size, and loading state.
 *
 * When `isLoading` is true the component displays an inline spinner and disables interaction.
 *
 * @param children - Button label or content
 * @param variant - Visual style to apply; one of `"primary" | "secondary" | "ghost" | "danger"`
 * @param size - Size preset to apply; one of `"sm" | "md" | "lg"`
 * @param isLoading - If true, shows a loading spinner and prevents user interaction
 * @param className - Additional Tailwind CSS classes to merge with the component styles
 * @param disabled - If true, disables the button (also disabled while `isLoading` is true)
 * @returns The rendered `<button>` element styled according to the provided props
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
