import Link from "next/link";

import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary-600">
                  ReplyStack
                </span>
              </Link>

              {/* Nav Links */}
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/reviews"
                  className="px-3 py-2 rounded-md text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
                >
                  Reviews
                </Link>
                <Link
                  href="/settings"
                  className="px-3 py-2 rounded-md text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
                >
                  Settings
                </Link>
                <Link
                  href="/billing"
                  className="px-3 py-2 rounded-md text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
                >
                  Billing
                </Link>
              </div>
            </div>

            {/* User Menu Placeholder */}
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">U</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
