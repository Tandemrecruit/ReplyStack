'use client';

import { ReviewCard } from './review-card';
import type { ReviewWithResponse } from '@/types';

export interface ReviewListProps {
  reviews: ReviewWithResponse[];
  isLoading?: boolean;
  onGenerateResponse?: (reviewId: string) => void;
  onPublishResponse?: (reviewId: string) => void;
  generatingReviewId?: string | null;
  publishingReviewId?: string | null;
}

export function ReviewList({
  reviews,
  isLoading = false,
  onGenerateResponse,
  onPublishResponse,
  generatingReviewId,
  publishingReviewId,
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/6" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h3>
        <p className="text-gray-500">
          Reviews from your Google Business Profile will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onGenerateResponse={onGenerateResponse}
          onPublishResponse={onPublishResponse}
          isGenerating={generatingReviewId === review.id}
          isPublishing={publishingReviewId === review.id}
        />
      ))}
    </div>
  );
}
