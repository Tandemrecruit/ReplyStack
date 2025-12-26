/**
 * @vitest-environment node
 */

import {
  fetchAccounts,
  fetchLocations,
  fetchReviews,
  GoogleAPIError,
  publishResponse,
  refreshAccessToken,
} from "@/lib/google/client";
import {
  createMockFetchError,
  createMockFetchResponse,
  expectFetchCalled,
} from "@/tests/helpers/assertions";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");

describe("lib/google/client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("refreshAccessToken", () => {
    const TOKEN_URL = "https://oauth2.googleapis.com/token";

    it("returns access token on success", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          access_token: "new-access-token",
          expires_in: 3600,
          token_type: "Bearer",
          scope: "https://www.googleapis.com/auth/business.manage",
        }),
      );

      const token = await refreshAccessToken("refresh-token");

      expect(token).toBe("new-access-token");
      expectFetchCalled(mockFetch, {
        url: TOKEN_URL,
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    });

    it.each([
      {
        status: 401,
        errorResponse: { error: "invalid_grant" },
        expectedMessage:
          "Google authentication expired. Please reconnect your account.",
      },
      {
        status: 400,
        errorResponse: {
          error: "invalid_grant",
          error_description: "Token has been expired or revoked.",
        },
        expectedMessage: "Token has been expired or revoked.",
      },
    ])("throws GoogleAPIError on $status", async ({
      status,
      errorResponse,
      expectedMessage,
    }) => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status,
        json: async () => errorResponse,
      });

      let caughtError: GoogleAPIError | null = null;
      try {
        await refreshAccessToken("bad-token");
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(status);
      expect(caughtError?.message).toBe(expectedMessage);
    });
  });

  describe("fetchAccounts", () => {
    const ACCOUNTS_URL =
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";

    it("returns parsed accounts", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          accounts: [
            { name: "accounts/123", accountName: "My Business" },
            { name: "accounts/456", accountName: "Other Business" },
          ],
        }),
      );

      const accounts = await fetchAccounts("access-token");

      expect(accounts).toEqual([
        { accountId: "123", name: "My Business" },
        { accountId: "456", name: "Other Business" },
      ]);
      expectFetchCalled(mockFetch, {
        url: ACCOUNTS_URL,
        headers: { Authorization: "Bearer access-token" },
      });
    });

    it("returns empty array when no accounts", async () => {
      mockFetch.mockResolvedValueOnce(createMockFetchResponse({}));

      const accounts = await fetchAccounts("access-token");

      expect(accounts).toEqual([]);
    });

    it("throws GoogleAPIError on 401 Unauthorized", async () => {
      mockFetch.mockResolvedValueOnce(createMockFetchError(401));

      let caughtError: GoogleAPIError | null = null;
      try {
        await fetchAccounts("access-token");
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(401);
      expect(caughtError?.message).toBe(
        "Failed to fetch accounts: Unauthorized",
      );
    });

    it("propagates network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("network"));

      await expect(fetchAccounts("access-token")).rejects.toThrow("network");
    });
  });

  describe("fetchLocations", () => {
    const getLocationsUrl = (accountId: string) =>
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title,storefrontAddress`;

    it("returns parsed locations", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          locations: [
            {
              name: "accounts/123/locations/loc1",
              title: "Main Street Store",
              storefrontAddress: {
                addressLines: ["123 Main St"],
                locality: "City",
                administrativeArea: "ST",
                postalCode: "12345",
              },
            },
          ],
        }),
      );

      const locations = await fetchLocations("access-token", "123");

      expect(locations).toEqual([
        {
          google_account_id: "123",
          google_location_id: "loc1",
          name: "Main Street Store",
          address: "123 Main St, City, ST, 12345",
        },
      ]);
      expectFetchCalled(mockFetch, {
        url: getLocationsUrl("123"),
        headers: { Authorization: "Bearer access-token" },
      });
    });

    it.each([
      { response: { locations: [] }, desc: "empty array" },
      { response: {}, desc: "undefined" },
    ])("returns empty array when locations is $desc", async ({ response }) => {
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(response));

      const locations = await fetchLocations("access-token", "123");

      expect(locations).toEqual([]);
    });

    it("parses multiple location entries correctly", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          locations: [
            {
              name: "accounts/123/locations/loc1",
              title: "Main Street Store",
              storefrontAddress: {
                addressLines: ["123 Main St"],
                locality: "City",
                administrativeArea: "ST",
                postalCode: "12345",
              },
            },
            {
              name: "accounts/123/locations/loc2",
              title: "Second Location",
              storefrontAddress: {
                addressLines: ["456 Oak Ave"],
                locality: "Town",
                administrativeArea: "CA",
                postalCode: "67890",
              },
            },
          ],
        }),
      );

      const locations = await fetchLocations("access-token", "123");

      expect(locations).toHaveLength(2);
      expect(locations[0]?.google_location_id).toBe("loc1");
      expect(locations[1]?.google_location_id).toBe("loc2");
    });

    it("handles partial/missing address fields without throwing", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          locations: [
            {
              name: "accounts/123/locations/loc1",
              title: "Location with no address",
              storefrontAddress: undefined,
            },
            {
              name: "accounts/123/locations/loc2",
              title: "Location with empty address",
              storefrontAddress: {},
            },
            {
              name: "accounts/123/locations/loc3",
              title: "Location with only addressLines",
              storefrontAddress: { addressLines: ["123 Main St"] },
            },
          ],
        }),
      );

      const locations = await fetchLocations("access-token", "123");

      expect(locations).toEqual([
        {
          google_account_id: "123",
          google_location_id: "loc1",
          name: "Location with no address",
          address: "",
        },
        {
          google_account_id: "123",
          google_location_id: "loc2",
          name: "Location with empty address",
          address: "",
        },
        {
          google_account_id: "123",
          google_location_id: "loc3",
          name: "Location with only addressLines",
          address: "123 Main St",
        },
      ]);
    });

    it("throws GoogleAPIError when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce(createMockFetchError(403));

      let caughtError: GoogleAPIError | null = null;
      try {
        await fetchLocations("access-token", "123");
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(403);
      expect(caughtError?.message).toBe("Failed to fetch locations: Forbidden");
    });

    it("propagates network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("network"));

      await expect(fetchLocations("access-token", "123")).rejects.toThrow(
        "network",
      );
    });

    it("handles malformed JSON gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Unexpected token");
        },
      });

      await expect(fetchLocations("access-token", "123")).rejects.toThrow(
        "Unexpected token",
      );
    });
  });

  describe("fetchReviews", () => {
    it("returns parsed reviews", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          reviews: [
            {
              reviewId: "review123",
              reviewer: {
                displayName: "John Doe",
                profilePhotoUrl: "https://example.com/photo.jpg",
              },
              starRating: "FIVE",
              comment: "Great service!",
              createTime: "2024-01-15T10:00:00Z",
            },
          ],
          nextPageToken: "next-page",
        }),
      );

      const result = await fetchReviews("access-token", "123", "loc1");

      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0]).toMatchObject({
        external_review_id: "review123",
        reviewer_name: "John Doe",
        rating: 5,
        review_text: "Great service!",
        has_response: false,
        platform: "google",
        status: "pending",
      });
      expect(result.nextPageToken).toBe("next-page");
    });

    it("forwards pageToken and returns nextPageToken for pagination", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          reviews: [
            {
              reviewId: "review456",
              reviewer: { displayName: "Jane Smith" },
              starRating: "FOUR",
              comment: "Good experience",
              createTime: "2024-01-16T11:00:00Z",
            },
          ],
          nextPageToken: "page-token-2",
        }),
      );

      const result = await fetchReviews(
        "access-token",
        "123",
        "loc1",
        "page-token-1",
      );

      expect(result.reviews).toHaveLength(1);
      expect(result.nextPageToken).toBe("page-token-2");

      // Verify pageToken was included in URL
      const call = mockFetch.mock.calls[0];
      const url = call?.[0] as string;
      expect(url).toContain("pageToken=page-token-1");
    });

    it("handles reviews with replies correctly", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          reviews: [
            {
              reviewId: "review789",
              reviewer: {
                displayName: "Bob Johnson",
                profilePhotoUrl: "https://example.com/bob.jpg",
              },
              starRating: "THREE",
              comment: "Average service",
              createTime: "2024-01-17T12:00:00Z",
              reviewReply: {
                comment: "Thank you for your feedback!",
                updateTime: "2024-01-18T13:00:00Z",
              },
            },
          ],
        }),
      );

      const result = await fetchReviews("access-token", "123", "loc1");

      expect(result.reviews[0]).toMatchObject({
        has_response: true,
        status: "responded",
      });
    });

    it.each([
      { response: { reviews: [] }, desc: "empty array" },
      { response: {}, desc: "undefined" },
    ])("returns empty array when reviews is $desc", async ({ response }) => {
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(response));

      const result = await fetchReviews("access-token", "123", "loc1");

      expect(result.reviews).toEqual([]);
      expect(result.nextPageToken).toBeUndefined();
    });

    it("handles missing optional fields gracefully", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          reviews: [
            {
              reviewId: "review-no-photo",
              reviewer: { displayName: "Anonymous User" },
              starRating: "FIVE",
              createTime: "2024-01-19T14:00:00Z",
            },
            {
              reviewId: "review-minimal",
              starRating: "ONE",
              comment: "Minimal review",
            },
          ],
        }),
      );

      const result = await fetchReviews("access-token", "123", "loc1");

      expect(result.reviews).toHaveLength(2);
      expect(result.reviews[0]?.reviewer_photo_url).toBeNull();
      expect(result.reviews[0]?.review_text).toBeNull();
      expect(result.reviews[1]?.reviewer_name).toBeNull();
      expect(result.reviews[1]?.review_date).toBeNull();
    });

    it.each([
      { starRating: "ONE", expected: 1 },
      { starRating: "TWO", expected: 2 },
      { starRating: "THREE", expected: 3 },
      { starRating: "FOUR", expected: 4 },
      { starRating: "FIVE", expected: 5 },
      { starRating: "UNKNOWN_RATING", expected: null },
      { starRating: undefined, expected: null },
    ])("maps $starRating to rating $expected", async ({
      starRating,
      expected,
    }) => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          reviews: [
            {
              reviewId: "review-rating",
              reviewer: { displayName: "Test" },
              starRating,
              comment: "Test",
              createTime: "2024-01-29T00:00:00Z",
            },
          ],
        }),
      );

      const result = await fetchReviews("access-token", "123", "loc1");

      expect(result.reviews[0]?.rating).toBe(expected);
    });

    it("throws GoogleAPIError when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce(createMockFetchError(404));

      let caughtError: GoogleAPIError | null = null;
      try {
        await fetchReviews("access-token", "123", "loc1");
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(404);
      expect(caughtError?.message).toBe("Failed to fetch reviews: Not Found");
    });

    it("propagates network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("network"));

      await expect(fetchReviews("access-token", "123", "loc1")).rejects.toThrow(
        "network",
      );
    });
  });

  describe("publishResponse", () => {
    it("returns true on success", async () => {
      mockFetch.mockResolvedValueOnce(createMockFetchResponse({}));

      const result = await publishResponse(
        "access-token",
        "123",
        "loc1",
        "review123",
        "Thank you for your review!",
      );

      expect(result).toBe(true);
      expectFetchCalled(mockFetch, {
        url: "https://mybusiness.googleapis.com/v4/accounts/123/locations/loc1/reviews/review123/reply",
        method: "PUT",
        headers: {
          Authorization: "Bearer access-token",
          "Content-Type": "application/json",
        },
        body: { comment: "Thank you for your review!" },
      });
    });

    it("throws GoogleAPIError on failure", async () => {
      mockFetch.mockResolvedValueOnce(createMockFetchError(403));

      let caughtError: GoogleAPIError | null = null;
      try {
        await publishResponse(
          "access-token",
          "123",
          "loc1",
          "review123",
          "Response text",
        );
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(403);
      expect(caughtError?.message).toBe(
        "Failed to publish response: Forbidden",
      );
    });
  });
});
