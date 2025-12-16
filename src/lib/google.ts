/**
 * Google Business Profile API helpers
 *
 * Handles OAuth flow and Business Profile API interactions
 */

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_BUSINESS_API_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const GOOGLE_BUSINESS_PROFILE_API_URL = 'https://mybusiness.googleapis.com/v4';

// Required scopes for Google Business Profile access
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'openid',
  'email',
  'profile',
];

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface GoogleAccount {
  name: string; // accounts/{accountId}
  accountName: string;
  type: string;
}

export interface GoogleLocation {
  name: string; // accounts/{accountId}/locations/{locationId}
  locationName: string;
  address: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    regionCode: string;
  };
}

export interface GoogleReview {
  name: string; // accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

/**
 * Builds a Google OAuth 2.0 authorization URL containing required scopes and the provided state.
 *
 * @param state - Value included in the OAuth `state` query parameter to correlate authorization requests with callbacks.
 * @returns The full authorization URL to redirect users to for Google consent.
 */
export function getOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an OAuth authorization code for Google access and refresh tokens.
 *
 * @param code - The authorization code returned by Google's OAuth consent flow
 * @returns An object containing `accessToken`, `refreshToken`, and `expiresIn` (seconds until the access token expires)
 * @throws Error if the token endpoint responds with a non-OK status
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Obtain a new Google OAuth access token using a refresh token.
 *
 * @param refreshToken - The refresh token previously issued by Google
 * @returns The refreshed access token string
 * @throws If the token endpoint responds with a non-OK status; the thrown Error's message contains the endpoint response text
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Retrieve Google Business Profile accounts for the authenticated user.
 *
 * @returns An array of `GoogleAccount` objects, or an empty array if the user has no accounts.
 */
export async function fetchAccounts(accessToken: string): Promise<GoogleAccount[]> {
  const response = await fetch(`${GOOGLE_BUSINESS_API_URL}/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch accounts: ${error}`);
  }

  const data = await response.json();
  return data.accounts || [];
}

/**
 * Retrieve locations belonging to a Google Business Profile account.
 *
 * @param accessToken - OAuth2 access token with the Business Profile scopes
 * @param accountId - The account resource name (for example, `accounts/123456789`)
 * @returns An array of `GoogleLocation` objects for the account; an empty array if no locations are found
 * @throws Error if the API responds with a non-OK status (error message contains the response text)
 */
export async function fetchLocations(
  accessToken: string,
  accountId: string
): Promise<GoogleLocation[]> {
  const response = await fetch(
    `${GOOGLE_BUSINESS_PROFILE_API_URL}/${accountId}/locations`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch locations: ${error}`);
  }

  const data = await response.json();
  return data.locations || [];
}

/**
 * Retrieve reviews for a Google Business Profile location, with optional pagination.
 *
 * @param accessToken - OAuth2 access token with permissions to read Business Profile reviews
 * @param locationName - Resource name of the location (for example `accounts/{accountId}/locations/{locationId}`)
 * @param pageToken - Optional token to retrieve the next page of results
 * @returns An object containing `reviews` — an array of `GoogleReview` — and `nextPageToken` when additional pages are available
 * @throws Error if the HTTP request fails or the API responds with a non-OK status
 */
export async function fetchReviews(
  accessToken: string,
  locationName: string,
  pageToken?: string
): Promise<{ reviews: GoogleReview[]; nextPageToken?: string }> {
  const url = new URL(`${GOOGLE_BUSINESS_PROFILE_API_URL}/${locationName}/reviews`);
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }
  url.searchParams.set('pageSize', '50');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch reviews: ${error}`);
  }

  const data = await response.json();
  return {
    reviews: data.reviews || [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Publishes a reply to a Google Business Profile review.
 *
 * @param accessToken - OAuth access token used to authorize the request
 * @param reviewName - Full resource name of the review (for example: `accounts/{accountId}/locations/{locationId}/reviews/{reviewId}`)
 * @param responseText - Text of the reply to post to the review
 * @throws Error when the API responds with a non-OK status; message includes the response text
 */
export async function publishResponse(
  accessToken: string,
  reviewName: string,
  responseText: string
): Promise<void> {
  const response = await fetch(
    `${GOOGLE_BUSINESS_PROFILE_API_URL}/${reviewName}/reply`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: responseText,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to publish response: ${error}`);
  }
}

/**
 * Convert a Google star rating token into its numeric value.
 *
 * @param rating - The Google star rating token: 'ONE', 'TWO', 'THREE', 'FOUR', or 'FIVE'
 * @returns The numeric rating 1–5, or 0 if `rating` is not recognized
 */
export function starRatingToNumber(
  rating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[rating] || 0;
}