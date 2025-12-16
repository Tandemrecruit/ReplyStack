import type { HTMLAttributes, ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

/**
 * Render a rounded inline badge (pill) that displays provided content with variant and size styling.
 *
 * @param className - Additional CSS classes applied to the root span
 * @param children - Content to render inside the badge
 * @param variant - Visual style; one of `'default' | 'success' | 'warning' | 'error' | 'info'`
 * @param size - Size of the badge; either `'sm'` or `'md'`
 * @returns A span element styled as a rounded badge containing `children`
 */
export function Badge({
  className = '',
  children,
  variant = 'default',
  size = 'md',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Renders a compact warning-styled badge that displays the text "Pending".
 *
 * @returns A badge element styled for warning states containing the text "Pending".
 */
export function PendingBadge() {
  return <Badge variant="warning">Pending</Badge>;
}

/**
 * Renders a status badge labeled "Responded" using the success styling.
 *
 * @returns A badge element labeled "Responded" styled with the `success` variant.
 */
export function RespondedBadge() {
  return <Badge variant="success">Responded</Badge>;
}

/**
 * Renders a badge labeled "Ignored" with the default styling.
 *
 * @returns A Badge element displaying "Ignored" using the `default` variant.
 */
export function IgnoredBadge() {
  return <Badge variant="default">Ignored</Badge>;
}

/**
 * Render a star rating badge whose visual variant reflects the numeric rating.
 *
 * @param rating - Numeric rating used to choose the badge variant: `>= 4` maps to `success`, `>= 3` maps to `warning`, otherwise `error`
 * @returns A Badge JSX element displaying the numeric `rating` and the correctly pluralized word "star" or "stars"
 */
export function RatingBadge({ rating }: { rating: number }) {
  const variant = rating >= 4 ? 'success' : rating >= 3 ? 'warning' : 'error';

  return (
    <Badge variant={variant}>
      {rating} {rating === 1 ? 'star' : 'stars'}
    </Badge>
  );
}