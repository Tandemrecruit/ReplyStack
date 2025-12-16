import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * A container that renders content styled as a card.
 *
 * @param className - Additional CSS class names appended to the card container
 * @param children - Content to render inside the card
 * @returns A div element styled as a card containing the provided children
 */
export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card header container with default horizontal padding and a bottom border.
 *
 * @param className - Additional CSS classes to append to the header's default padding and border styles
 * @param children - Content rendered inside the header
 * @returns The header element (`div`) containing `children` with header-specific styling
 */
export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

/**
 * Render a styled card title as an `h3` element.
 *
 * @param className - Additional CSS class names to merge with the component's base title styles
 * @param children - Content to render inside the title element
 * @returns An `h3` element containing `children` with base title styles and any provided `className`
 */
export function CardTitle({ className = '', children, ...props }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

/**
 * Renders the card's descriptive text as a small, muted paragraph.
 *
 * @returns A <p> element containing `children` with top margin, small font size, and muted gray color.
 */
export function CardDescription({
  className = '',
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p className={`mt-1 text-sm text-gray-500 ${className}`} {...props}>
      {children}
    </p>
  );
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Renders the card's content area with default horizontal and vertical padding and optional additional classes.
 *
 * @returns A div element that wraps `children`, applies default padding, and merges any provided `className`
 */
export function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Renders a card footer container with footer-specific spacing, border, background, and rounded bottom corners.
 *
 * @param className - Additional CSS class names appended to the default footer classes.
 * @param children - Content to render inside the footer.
 * @returns A div element styled as a card footer containing `children`.
 */
export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}