/**
 * Test data factories for creating mock objects with sensible defaults.
 * Use overrides to customize specific fields for individual tests.
 */

import type {
  Location,
  Organization,
  Response,
  Review,
  User,
  VoiceProfile,
} from "@/lib/supabase/types";

/**
 * Create a mock Review with sensible defaults.
 */
export function createMockReview(overrides?: Partial<Review>): Review {
  return {
    id: "review-1",
    location_id: "loc-1",
    platform: "google",
    external_review_id: "ext-review-1",
    reviewer_name: "John Doe",
    reviewer_photo_url: null,
    rating: 5,
    review_text: "Great service!",
    review_date: "2025-01-01T00:00:00Z",
    has_response: false,
    status: "pending",
    sentiment: "positive",
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Create a mock Location with sensible defaults.
 */
export function createMockLocation(overrides?: Partial<Location>): Location {
  return {
    id: "loc-1",
    google_account_id: "acc-1",
    google_location_id: "gloc-1",
    name: "Test Location",
    address: "123 Main St, City, ST 12345",
    organization_id: "org-1",
    voice_profile_id: null,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Create a mock User with sensible defaults.
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    organization_id: "org-1",
    google_refresh_token: null,
    role: "member",
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Create a mock Organization with sensible defaults.
 */
export function createMockOrganization(
  overrides?: Partial<Organization>,
): Organization {
  return {
    id: "org-1",
    name: "Test Organization",
    plan_tier: "agency",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    trial_ends_at: null,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Create a mock VoiceProfile with sensible defaults.
 */
export function createMockVoiceProfile(
  overrides?: Partial<VoiceProfile>,
): VoiceProfile {
  return {
    id: "vp-1",
    organization_id: "org-1",
    name: "Default Voice",
    tone: "warm",
    personality_notes: null,
    example_responses: null,
    sign_off_style: null,
    words_to_use: null,
    words_to_avoid: null,
    max_length: 120,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Create a mock Response with sensible defaults.
 */
export function createMockResponse(overrides?: Partial<Response>): Response {
  return {
    id: "resp-1",
    review_id: "review-1",
    generated_text: "Thank you for your feedback!",
    edited_text: null,
    final_text: null,
    status: "draft",
    published_at: null,
    tokens_used: 100,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Create a mock Review with nested Location data (as returned by Supabase joins).
 */
export function createMockReviewWithLocation(
  reviewOverrides?: Partial<Review>,
  locationOverrides?: Partial<Location>,
): Review & { locations: Location } {
  return {
    ...createMockReview(reviewOverrides),
    locations: createMockLocation(locationOverrides),
  };
}

/**
 * Create a mock custom tone object.
 */
export function createMockCustomTone(overrides?: {
  id?: string;
  organization_id?: string;
  name?: string;
  description?: string;
  enhanced_context?: string | null;
}) {
  return {
    id: "custom-tone-1",
    organization_id: "org-1",
    name: "Custom Tone",
    description: "A custom tone for testing",
    enhanced_context: null,
    quiz_responses: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}
