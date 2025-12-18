/**
 * Google Business Profile API Client
 *
 * Implements Google Business Profile API integration for:
 * - OAuth token refresh
 * - Fetch accounts and locations
 * - Fetch reviews for a location
 * - Publish responses to reviews
 *
 * @see https://developers.google.com/my-business/reference/rest
 */

import type { Location, Review } from "@/lib/supabase/types";

// API endpoints
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ACCOUNTS_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const LOCATIONS_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const REVIEWS_API = "https://mybusiness.googleapis.com/v4";

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Google Business Profile OAuth configuration
 */
export const GOOGLE_OAUTH_CONFIG = {
  scope: "https://www.googleapis.com/auth/business.manage",
  accessType: "offline",
  prompt: "consent",
} as const;

/**
 * Custom error class for Google API errors with status code
 */
export class GoogleAPIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "GoogleAPIError";
  }
}

/**
 * Response shape from Google's token endpoint
 */
interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Response shape from Google's accounts endpoint
 */
interface AccountsResponse {
  accounts?: Array<{
    name: string;
    accountName?: string;
    type?: string;
    role?: string;
  }>;
}

/**
 * Address shape from Google's locations endpoint
 */
interface GoogleAddress {
  addressLines?: string[];
  locality?: string;
  administrativeArea?: string;
  postalCode?: string;
}

/**
 * Response shape from Google's locations endpoint
 */
interface LocationsResponse {
  locations?: Array<{
    name: string;
    title: string;
    storefrontAddress?: GoogleAddress;
  }>;
}

/**
 * Response shape from Google's reviews endpoint
 */
interface ReviewsResponse {
  reviews?: Array<{
    reviewId: string;
    reviewer?: {
      displayName?: string;
      profilePhotoUrl?: string;
    };
    starRating?: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
    comment?: string;
    createTime?: string;
    reviewReply?: {
      comment: string;
      updateTime: string;
    };
  }>;
  nextPageToken?: string;
  totalReviewCount?: number;
}

/**
 * Convert a Google star rating enum into its numeric value.
 *
 * @param starRating - Google star rating enum value
 * @returns The numeric rating 1–5 for recognized enums; `null` if `starRating` is undefined or unrecognized
 */
function parseStarRating(
  starRating?: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE",
): number | null {
  const ratings: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return starRating ? (ratings[starRating] ?? null) : null;
}

/**
 * Convert a GoogleAddress into a single, comma-separated address string.
 *
 * @param address - The GoogleAddress to format; may be undefined.
 * @returns A comma-separated address composed of available address lines, locality, administrative area, and postal code, or an empty string if no address is provided.
 */
function formatAddress(address?: GoogleAddress): string {
  if (!address) return "";
  const parts = [
    ...(address.addressLines ?? []),
    address.locality,
    address.administrativeArea,
    address.postalCode,
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Extract and validate a Google location ID from a location name.
 *
 * Expected format: `accounts/{accountId}/locations/{locationId}`
 *
 * @param name - The location name from Google API
 * @returns The extracted location ID, or null if the format is invalid or the ID is empty
 */
function extractLocationId(name: string): string | null {
  // Match the expected format: accounts/{accountId}/locations/{locationId}
  const match = name.match(/^accounts\/[^/]+\/locations\/(.+)$/);
  if (!match || !match[1]) {
    return null;
  }

  const locationId = match[1].trim();
  // Ensure the location ID is not empty after trimming
  return locationId.length > 0 ? locationId : null;
}

/**
 * Execute a fetch request with a configurable timeout.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (if signal is provided, it will be composed with timeout signal)
 * @param timeoutMs - Timeout in milliseconds (defaults to REQUEST_TIMEOUT_MS)
 * @returns The fetch Response
 * @throws GoogleAPIError with status 408 (Request Timeout) if the request times out, or rethrows other network errors
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;
  let isTimeoutAbort = false;

  // Set up timeout
  timeoutId = setTimeout(() => {
    isTimeoutAbort = true;
    controller.abort();
  }, timeoutMs);

  // Compose with existing signal if provided
  const existingSignal = options.signal;
  if (existingSignal) {
    if (existingSignal.aborted) {
      // Signal already aborted, abort immediately
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      controller.abort();
    } else {
      existingSignal.addEventListener("abort", () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        controller.abort();
      });
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    return response;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (error instanceof Error && error.name === "AbortError") {
      // Only throw timeout error if it was our timeout, not a user-provided signal
      if (isTimeoutAbort) {
        throw new GoogleAPIError(
          408,
          `Request timeout: ${url} did not respond within ${timeoutMs}ms`,
        );
      }
      // If aborted by user signal, rethrow as-is
      throw error;
    }
    throw error;
  }
}

/**
 * Exchange a Google OAuth2 refresh token for a new access token.
 *
 * @param refreshToken - A valid OAuth2 refresh token issued by Google.
 * @returns The refreshed access token string.
 * @throws GoogleAPIError when OAuth client credentials are not configured (status 500), when the refresh fails due to expired/invalid credentials (status 401), or when the token endpoint returns another error status.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new GoogleAPIError(500, "Google OAuth credentials not configured");
  }

  const response = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      (errorData as { error_description?: string; error?: string })
        .error_description ??
      (errorData as { error?: string }).error ??
      "Token refresh failed";

    if (response.status === 401) {
      throw new GoogleAPIError(
        401,
        "Google authentication expired. Please reconnect your account.",
      );
    }
    if (response.status === 400) {
      throw new GoogleAPIError(response.status, errorMessage);
    }
    throw new GoogleAPIError(response.status, errorMessage);
  }

  const data = (await response.json()) as TokenResponse;
  return data.access_token;
}

/**
 * Retrieve Google Business Profile accounts accessible to the authenticated user.
 *
 * @param accessToken - OAuth 2.0 access token with the business.manage scope
 * @returns A list of objects each containing `accountId` and `name` for an account
 * @throws GoogleAPIError if the API request fails
 */
export async function fetchAccounts(
  accessToken: string,
): Promise<Array<{ accountId: string; name: string }>> {
  const response = await fetchWithTimeout(`${ACCOUNTS_API}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new GoogleAPIError(
      response.status,
      `Failed to fetch accounts: ${response.statusText}`,
    );
  }

  const data = (await response.json()) as AccountsResponse;

  return (data.accounts ?? []).map((account) => ({
    accountId: account.name.replace("accounts/", ""),
    name: account.accountName ?? account.name,
  }));
}

/**
 * Fetches all locations for an account.
 *
 * @param accessToken - OAuth 2.0 access token
 * @param accountId - The Google account ID (without "accounts/" prefix)
 * @returns An array of partial Location objects
 * @throws GoogleAPIError if the API request fails
 */
export async function fetchLocations(
  accessToken: string,
  accountId: string,
): Promise<Array<Partial<Location>>> {
  const url = `${LOCATIONS_API}/accounts/${accountId}/locations?readMask=name,title,storefrontAddress`;

  const response = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new GoogleAPIError(
      response.status,
      `Failed to fetch locations: ${response.statusText}`,
    );
  }

  const data = (await response.json()) as LocationsResponse;

  const validLocations: Array<Partial<Location>> = [];
  let skippedCount = 0;

  for (const location of data.locations ?? []) {
    const locationId = extractLocationId(location.name);
    if (!locationId) {
      skippedCount++;
      console.warn(
        `Skipped location with invalid name format: "${location.name}" (expected format: accounts/{accountId}/locations/{locationId})`,
      );
      continue;
    }

    validLocations.push({
      google_account_id: accountId,
      google_location_id: locationId,
      name: location.title,
      address: formatAddress(location.storefrontAddress),
    });
  }

  if (skippedCount > 0) {
    console.warn(
      `Skipped ${skippedCount} location(s) with invalid or missing location IDs`,
    );
  }

  return validLocations;
}

/**
 * Retrieve reviews for a specific Google Business Profile location, with optional pagination.
 *
 * @param accessToken - OAuth access token used to authenticate the request
 * @param accountId - Google account identifier that owns the location
 * @param locationId - Identifier of the location to fetch reviews for
 * @param pageToken - Optional token to retrieve the next page of results
 * @returns An object containing reviews array and optional nextPageToken
 * @throws GoogleAPIError if the API request fails
 */
export async function fetchReviews(
  accessToken: string,
  accountId: string,
  locationId: string,
  pageToken?: string,
): Promise<{ reviews: Array<Partial<Review>>; nextPageToken?: string }> {
  const url = new URL(
    `${REVIEWS_API}/accounts/${accountId}/locations/${locationId}/reviews`,
  );
  url.searchParams.set("pageSize", "50");
  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const response = await fetchWithTimeout(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new GoogleAPIError(
      response.status,
      `Failed to fetch reviews: ${response.statusText}`,
    );
  }

  const data = (await response.json()) as ReviewsResponse;

  const result: { reviews: Array<Partial<Review>>; nextPageToken?: string } = {
    reviews: (data.reviews ?? []).map((review) => ({
      external_review_id: review.reviewId,
      reviewer_name: review.reviewer?.displayName ?? null,
      reviewer_photo_url: review.reviewer?.profilePhotoUrl ?? null,
      rating: parseStarRating(review.starRating),
      review_text: review.comment ?? null,
      review_date: review.createTime ?? null,
      has_response: !!review.reviewReply,
      platform: "google",
      status: review.reviewReply ? "responded" : "pending",
    })),
  };

  if (data.nextPageToken) {
    result.nextPageToken = data.nextPageToken;
  }

  return result;
}

/**
 * Publishes a reply message for a specific Google Business Profile review.
 *
 * @param accessToken - OAuth2 access token with permission to manage the business
 * @param accountId - The Google account ID
 * @param locationId - The Google location ID
 * @param reviewId - The review ID to reply to
 * @param responseText - The reply text to publish
 * @returns `true` if the reply was successfully published
 * @throws GoogleAPIError if the API request fails
 */
export async function publishResponse(
  accessToken: string,
  accountId: string,
  locationId: string,
  reviewId: string,
  responseText: string,
): Promise<boolean> {
  const url = `${REVIEWS_API}/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`;

  const response = await fetchWithTimeout(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment: responseText }),
  });

  if (!response.ok) {
    throw new GoogleAPIError(
      response.status,
      `Failed to publish response: ${response.statusText}`,
    );
  }

  return true;
}
