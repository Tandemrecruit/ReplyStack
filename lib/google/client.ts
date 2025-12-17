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
const GOOGLE_API_BASE =
  "https://mybusinessbusinessinformation.googleapis.com/v1";

/**
 * Google Business Profile OAuth configuration
 */
export const GOOGLE_OAUTH_CONFIG = {
  scope: "https://www.googleapis.com/auth/business.manage",
  accessType: "offline",
  prompt: "consent",
} as const;

/**
 * Obtain a new OAuth2 access token using the provided refresh token.
 *
 * @param _refreshToken - A valid OAuth2 refresh token issued by Google
 * @returns The new access token string
 */
export async function refreshAccessToken(
  _refreshToken: string,
): Promise<string> {
  // TODO: Implement token refresh
  // POST to https://oauth2.googleapis.com/token
  throw new Error("Not implemented");
}

/**
 * Retrieve Google Business Profile accounts accessible to the authenticated user.
 *
 * @param _accessToken - OAuth 2.0 access token with the `https://www.googleapis.com/auth/business.manage` scope
 * @returns A list of objects each containing `accountId` and `name` for an account
 */
export async function fetchAccounts(
  _accessToken: string,
): Promise<{ accountId: string; name: string }[]> {
  // TODO: Implement account fetching
  // GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
  console.warn("fetchAccounts not implemented", { api: GOOGLE_API_BASE });
  return [];
}

/**
 * Fetches all locations for an account.
 *
 * @returns An array of `Partial<Location>` objects representing locations belonging to the specified account.
 */
export async function fetchLocations(
  _accessToken: string,
  _accountId: string,
): Promise<Partial<Location>[]> {
  // TODO: Implement location fetching
  // GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations
  return [];
}

/**
 * Retrieve reviews for a specific Google Business Profile location, with optional pagination.
 *
 * @param _accessToken - OAuth access token used to authenticate the request
 * @param _accountId - Google account identifier that owns the location
 * @param _locationId - Identifier of the location to fetch reviews for
 * @param _pageToken - Optional token to retrieve the next page of results
 * @returns An object containing `reviews`, an array of partial `Review` objects, and an optional `nextPageToken` to fetch subsequent pages
 */
export async function fetchReviews(
  _accessToken: string,
  _accountId: string,
  _locationId: string,
  _pageToken?: string,
): Promise<{ reviews: Partial<Review>[]; nextPageToken?: string }> {
  // TODO: Implement review fetching
  // GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews
  return { reviews: [] };
}

/**
 * Publishes a reply message for a specific Google Business Profile review.
 *
 * @param accessToken - OAuth2 access token with permission to manage the business
 * @param reviewId - The identifier of the review to reply to
 * @param responseText - The reply text to publish
 * @returns `true` if the reply was successfully published, `false` otherwise
 */
export async function publishResponse(
  _accessToken: string,
  _reviewId: string,
  _responseText: string,
): Promise<boolean> {
  // TODO: Implement response publishing
  // PUT https://mybusiness.googleapis.com/v4/{reviewId}/reply
  return false;
}
