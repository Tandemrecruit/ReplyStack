import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Center a constrained authentication container and render its children inside.
 *
 * Applies a full-height centered layout with a background, and a padded container
 * constrained to a sensible maximum width for auth screens (forms, links, etc.).
 *
 * @param children - Content to display inside the centered auth container
 * @returns The JSX element for the centered auth layout
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">{children}</div>
    </div>
  );
}