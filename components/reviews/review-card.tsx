import type { Review } from "@/lib/supabase/types";

interface ReviewCardProps {
  review: Review;
  onGenerateResponse?: (reviewId: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  responded: "bg-green-100 text-green-700",
  ignored: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
};

/**
 * Render a compact status badge styled according to the given status.
 *
 * @param status - The status label to display; used to determine visual styling. If the label is not present in `STATUS_STYLES`, the "pending" style is applied.
 * @returns The badge element containing the provided `status` text
 */
function StatusBadge({ status }: { status: string }) {
  const styleClass = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${styleClass}`}
    >
      {status}
    </span>
  );
}

/**
 * Display a single customer review with rating, reviewer metadata, response status, and an optional "Generate Response" action.
 *
 * Renders reviewer avatar initial, name (falls back to "Anonymous"), review date (formatted or "Unknown date"), a five-star rating visual, review text (or "No review text"), and a status badge. When `review.status` is "pending" and `onGenerateResponse` is provided, shows a "Generate Response" button that invokes the callback with the review's `id`.
 *
 * @param review - The review data to display (rating, reviewer_name, review_date, review_text, status, id).
 * @param onGenerateResponse - Optional callback invoked as `onGenerateResponse(reviewId)` when the "Generate Response" button is clicked.
 */
export function ReviewCard({ review, onGenerateResponse }: ReviewCardProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i < (review.rating ?? 0));

  return (
    <div className="p-4 bg-surface rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Reviewer Avatar Placeholder */}
          <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
            <span className="text-sm font-medium text-foreground-secondary">
              {review.reviewer_name?.charAt(0) ?? "?"}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">
              {review.reviewer_name ?? "Anonymous"}
            </p>
            <p className="text-sm text-foreground-muted">
              {review.review_date
                ? new Date(review.review_date).toLocaleDateString()
                : "Unknown date"}
            </p>
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-0.5">
          <span className="sr-only">{review.rating ?? 0} out of 5 stars</span>
          {stars.map((filled, i) => (
            <svg
              key={`${review.id}-star-${i}`}
              className={`w-4 h-4 ${filled ? "text-star" : "text-star-empty"}`}
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 20 20"
              data-testid={filled ? "star-filled" : "star-empty"}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <p className="mt-3 text-foreground">
        {review.review_text ?? "No review text"}
      </p>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <StatusBadge status={review.status ?? "pending"} />

        {(review.status ?? "pending") === "pending" && onGenerateResponse && (
          <button
            onClick={() => onGenerateResponse(review.id)}
            type="button"
            className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            Generate Response
          </button>
        )}
      </div>
    </div>
  );
}
