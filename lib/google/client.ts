/**
 * Google Business Profile API Client
 *
 * TODO: Implement Google Business Profile API integration
 * - OAuth authentication flow
 * - Fetch accounts and locations
 * - Fetch reviews for a location
 * - Publish responses to reviews
 *
 * @see https://developers.google.com/my-business/reference/rest
 */

import type { Location, Review } from "@/lib/supabase/types";

// API constants
const GOOGLE_API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";

/**
 * Google Business Profile OAuth configuration
 */
export const GOOGLE_OAUTH_CONFIG = {
  scope: "https://www.googleapis.com/auth/business.manage",
  accessType: "offline",
  prompt: "consent",
} as const;

/**
 * Fetches a new access token using a refresh token
 */
export async function refreshAccessToken(
  _refreshToken: string
): Promise<string> {
  // TODO: Implement token refresh
  // POST to https://oauth2.googleapis.com/token
  throw new Error("Not implemented");
}

/**
 * Fetches all accounts for the authenticated user
 */
export async function fetchAccounts(
  _accessToken: string
): Promise<{ accountId: string; name: string }[]> {
  // TODO: Implement account fetching
  // GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
  console.warn("fetchAccounts not implemented", { api: GOOGLE_API_BASE });
  return [];
}

/**
 * Fetches all locations for an account
 */
export async function fetchLocations(
  _accessToken: string,
  _accountId: string
): Promise<Partial<Location>[]> {
  // TODO: Implement location fetching
  // GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations
  return [];
}

/**
 * Fetches reviews for a location
 */
export async function fetchReviews(
  _accessToken: string,
  _accountId: string,
  _locationId: string,
  _pageToken?: string
): Promise<{ reviews: Partial<Review>[]; nextPageToken?: string }> {
  // TODO: Implement review fetching
  // GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews
  return { reviews: [] };
}

/**
 * Publishes a response to a review
 */
export async function publishResponse(
  _accessToken: string,
  _reviewId: string,
  _responseText: string
): Promise<boolean> {
  // TODO: Implement response publishing
  // PUT https://mybusiness.googleapis.com/v4/{reviewId}/reply
  return false;
}

