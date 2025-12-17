import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | ReplyStack",
  description: "Manage your Google Business reviews",
};

/**
 * Renders the Dashboard page for ReplyStack, showing a header, quick-stats placeholders, and a "Get Started" card with onboarding steps and a settings CTA.
 *
 * @returns The JSX content for the dashboard page.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-foreground-secondary">
          Welcome to ReplyStack. Get started by connecting your Google Business
          Profile.
        </p>
      </div>

      {/* Quick Stats Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-surface rounded-lg border border-border">
          <p className="text-sm font-medium text-foreground-secondary">
            Pending Reviews
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">—</p>
        </div>
        <div className="p-6 bg-surface rounded-lg border border-border">
          <p className="text-sm font-medium text-foreground-secondary">
            Responded This Week
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">—</p>
        </div>
        <div className="p-6 bg-surface rounded-lg border border-border">
          <p className="text-sm font-medium text-foreground-secondary">
            Average Rating
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">—</p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="p-6 bg-surface rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground">Get Started</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-700">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground">
                Connect Google Business Profile
              </p>
              <p className="text-sm text-foreground-secondary">
                Link your Google account to start fetching reviews
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-foreground-muted">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground-secondary">
                Set up your voice profile
              </p>
              <p className="text-sm text-foreground-muted">
                Configure how AI responses should sound
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-foreground-muted">3</span>
            </div>
            <div>
              <p className="font-medium text-foreground-secondary">
                Start responding to reviews
              </p>
              <p className="text-sm text-foreground-muted">
                Generate AI responses and publish them
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/settings"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Connect Google Account
          </Link>
        </div>
      </div>
    </div>
  );
}