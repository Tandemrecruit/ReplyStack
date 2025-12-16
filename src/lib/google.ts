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
 * Generate OAuth authorization URL
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
 * Exchange authorization code for tokens
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
 * Refresh access token using refresh token
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
 * Fetch user's Google Business Profile accounts
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
 * Fetch locations for a specific account
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
 * Fetch reviews for a specific location
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
 * Publish a response to a review
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
 * Convert Google star rating to number
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
