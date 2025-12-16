import type { HTMLAttributes, ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

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

// Convenience components for review statuses
export function PendingBadge() {
  return <Badge variant="warning">Pending</Badge>;
}

export function RespondedBadge() {
  return <Badge variant="success">Responded</Badge>;
}

export function IgnoredBadge() {
  return <Badge variant="default">Ignored</Badge>;
}

// Star rating badge
export function RatingBadge({ rating }: { rating: number }) {
  const variant = rating >= 4 ? 'success' : rating >= 3 ? 'warning' : 'error';

  return (
    <Badge variant={variant}>
      {rating} {rating === 1 ? 'star' : 'stars'}
    </Badge>
  );
}
