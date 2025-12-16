'use client';

import { Card, CardContent, Badge, Button } from '@/components/ui';
import type { ReviewWithResponse } from '@/types';

export interface ReviewCardProps {
  review: ReviewWithResponse;
  onGenerateResponse?: (reviewId: string) => void;
  onPublishResponse?: (reviewId: string) => void;
  isGenerating?: boolean;
  isPublishing?: boolean;
}

export function ReviewCard({
  review,
  onGenerateResponse,
  onPublishResponse,
  isGenerating = false,
  isPublishing = false,
}: ReviewCardProps) {
  const statusVariant =
    review.status === 'responded'
      ? 'success'
      : review.status === 'ignored'
      ? 'default'
      : 'warning';

  const ratingVariant =
    (review.rating ?? 0) >= 4 ? 'success' : (review.rating ?? 0) >= 3 ? 'warning' : 'error';

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            {review.reviewerPhotoUrl ? (
              <img
                src={review.reviewerPhotoUrl}
                alt={review.reviewerName || 'Reviewer'}
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">
                  {review.reviewerName?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">
                {review.reviewerName || 'Anonymous'}
              </p>
              <p className="text-sm text-gray-500">
                {review.reviewDate
                  ? new Date(review.reviewDate).toLocaleDateString()
                  : 'Unknown date'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={ratingVariant}>
              {'★'.repeat(review.rating ?? 0)}{'☆'.repeat(5 - (review.rating ?? 0))}
            </Badge>
            <Badge variant={statusVariant}>
              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Review text */}
        <p className="text-gray-700 mb-4">
          {review.reviewText || 'No comment provided'}
        </p>

        {/* Response section */}
        {review.response && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Your Response:</p>
            <p className="text-gray-600 text-sm">
              {review.response.finalText ||
                review.response.editedText ||
                review.response.generatedText}
            </p>
            {review.response.publishedAt && (
              <p className="text-xs text-gray-400 mt-2">
                Published {new Date(review.response.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {review.status === 'pending' && (
          <div className="flex gap-2">
            {!review.response ? (
              <Button
                onClick={() => onGenerateResponse?.(review.id)}
                isLoading={isGenerating}
              >
                Generate Response
              </Button>
            ) : (
              <Button
                onClick={() => onPublishResponse?.(review.id)}
                isLoading={isPublishing}
              >
                Publish Response
              </Button>
            )}
            <Button variant="ghost">Ignore</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
