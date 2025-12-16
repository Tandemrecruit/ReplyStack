'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { ReviewList } from '@/components/reviews';
import { Button, Input, Badge } from '@/components/ui';
import type { ReviewWithResponse, ReviewStatus } from '@/types';

// Mock data for development
const mockReviews: ReviewWithResponse[] = [
  {
    id: '1',
    locationId: 'loc_1',
    platform: 'google',
    externalReviewId: 'google_1',
    reviewerName: 'John D.',
    reviewerPhotoUrl: null,
    rating: 5,
    reviewText:
      'Excellent service! The team was very professional and completed the work quickly. Would highly recommend to anyone looking for quality work.',
    reviewDate: new Date().toISOString(),
    hasResponse: false,
    status: 'pending',
    sentiment: 'positive',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    locationId: 'loc_1',
    platform: 'google',
    externalReviewId: 'google_2',
    reviewerName: 'Sarah M.',
    reviewerPhotoUrl: null,
    rating: 4,
    reviewText:
      'Good experience overall. The staff was friendly and helpful. Only giving 4 stars because the wait time was a bit longer than expected.',
    reviewDate: new Date(Date.now() - 86400000).toISOString(),
    hasResponse: true,
    status: 'responded',
    sentiment: 'positive',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    response: {
      id: 'resp_1',
      generatedText:
        "Thank you so much for your kind words, Sarah! We're thrilled you had a good experience with us. We apologize for the longer wait time and are working to improve our scheduling. We hope to see you again soon!",
      editedText: null,
      finalText:
        "Thank you so much for your kind words, Sarah! We're thrilled you had a good experience with us. We apologize for the longer wait time and are working to improve our scheduling. We hope to see you again soon!",
      status: 'published',
      publishedAt: new Date(Date.now() - 80000000).toISOString(),
      tokensUsed: 150,
      createdAt: new Date(Date.now() - 82000000).toISOString(),
    },
  },
  {
    id: '3',
    locationId: 'loc_1',
    platform: 'google',
    externalReviewId: 'google_3',
    reviewerName: 'Mike R.',
    reviewerPhotoUrl: null,
    rating: 2,
    reviewText:
      "Disappointed with the service. Had to wait over an hour and the quality wasn't what I expected based on the reviews.",
    reviewDate: new Date(Date.now() - 172800000).toISOString(),
    hasResponse: false,
    status: 'pending',
    sentiment: 'negative',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

/**
 * Render the Reviews management page with search, status filters, and controls to generate or publish responses for individual reviews.
 *
 * @returns The page's React element containing a header, search input, status filter buttons, and a ReviewList wired with generate/publish callbacks and loading states.
 */
export default function ReviewsPage() {
  const [reviews] = useState<ReviewWithResponse[]>(mockReviews);
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingReviewId, setGeneratingReviewId] = useState<string | null>(null);
  const [publishingReviewId, setPublishingReviewId] = useState<string | null>(null);

  const filteredReviews = reviews.filter((review) => {
    if (filter !== 'all' && review.status !== filter) return false;
    if (
      searchQuery &&
      !review.reviewText?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !review.reviewerName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleGenerateResponse = async (reviewId: string) => {
    setGeneratingReviewId(reviewId);
    // TODO: Call API to generate response
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setGeneratingReviewId(null);
    console.log('Generate response for review:', reviewId);
  };

  const handlePublishResponse = async (reviewId: string) => {
    setPublishingReviewId(reviewId);
    // TODO: Call API to publish response
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setPublishingReviewId(null);
    console.log('Publish response for review:', reviewId);
  };

  return (
    <div>
      <Header
        title="Reviews"
        description="Manage and respond to your Google reviews"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </FilterButton>
            <FilterButton
              active={filter === 'pending'}
              onClick={() => setFilter('pending')}
            >
              Pending
            </FilterButton>
            <FilterButton
              active={filter === 'responded'}
              onClick={() => setFilter('responded')}
            >
              Responded
            </FilterButton>
            <FilterButton
              active={filter === 'ignored'}
              onClick={() => setFilter('ignored')}
            >
              Ignored
            </FilterButton>
          </div>
        </div>

        {/* Review List */}
        <ReviewList
          reviews={filteredReviews}
          onGenerateResponse={handleGenerateResponse}
          onPublishResponse={handlePublishResponse}
          generatingReviewId={generatingReviewId}
          publishingReviewId={publishingReviewId}
        />
      </div>
    </div>
  );
}

/**
 * Renders a filter button that visually indicates an active state.
 *
 * @param children - Content displayed inside the button (label or icon)
 * @param active - Whether the button is shown in its active (selected) style
 * @param onClick - Callback invoked when the button is clicked
 * @returns A button element styled for use as a filter control
 */
function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}