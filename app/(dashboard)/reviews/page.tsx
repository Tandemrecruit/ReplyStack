import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews | ReplyStack",
  description: "View and respond to your Google Business reviews",
};

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="mt-1 text-foreground-secondary">
            View and respond to your Google Business reviews
          </p>
        </div>

        {/* Filters Placeholder */}
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 bg-surface border border-border rounded-md text-sm text-foreground">
            <option>All Ratings</option>
            <option>5 Stars</option>
            <option>4 Stars</option>
            <option>3 Stars</option>
            <option>2 Stars</option>
            <option>1 Star</option>
          </select>
          <select className="px-3 py-2 bg-surface border border-border rounded-md text-sm text-foreground">
            <option>All Status</option>
            <option>Pending</option>
            <option>Responded</option>
            <option>Ignored</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      <div className="p-12 bg-surface rounded-lg border border-border text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-background-secondary flex items-center justify-center">
          <svg
            className="w-6 h-6 text-foreground-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-foreground">
          No reviews yet
        </h3>
        <p className="mt-2 text-foreground-secondary">
          Connect your Google Business Profile to start seeing reviews here.
        </p>
      </div>
    </div>
  );
}
