/**
 * Application types
 */

export * from './database';

// Review status
export type ReviewStatus = 'pending' | 'responded' | 'ignored';

// Response status
export type ResponseStatus = 'draft' | 'published' | 'failed';

// Voice profile tone options
export type VoiceProfileTone = 'friendly' | 'professional' | 'casual' | 'formal';

// Sentiment types
export type Sentiment = 'positive' | 'neutral' | 'negative';

// Plan tiers
export type PlanTier = 'starter' | 'professional' | 'enterprise';

// User roles
export type UserRole = 'owner' | 'admin' | 'member';

// Review with response included
export interface ReviewWithResponse {
  id: string;
  locationId: string;
  platform: string;
  externalReviewId: string;
  reviewerName: string | null;
  reviewerPhotoUrl: string | null;
  rating: number | null;
  reviewText: string | null;
  reviewDate: string | null;
  hasResponse: boolean;
  status: ReviewStatus;
  sentiment: Sentiment | null;
  createdAt: string;
  response?: {
    id: string;
    generatedText: string;
    editedText: string | null;
    finalText: string | null;
    status: ResponseStatus;
    publishedAt: string | null;
    tokensUsed: number | null;
    createdAt: string;
  };
}

// API error response
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Review filter params
export interface ReviewFilterParams extends PaginationParams {
  status?: ReviewStatus;
  rating?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}
