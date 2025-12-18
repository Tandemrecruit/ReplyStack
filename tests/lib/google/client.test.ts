import {
  fetchAccounts,
  fetchLocations,
  fetchReviews,
  GoogleAPIError,
  publishResponse,
  refreshAccessToken,
} from "@/lib/google/client";

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
    it("returns access token on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "new-access-token",
          expires_in: 3600,
          token_type: "Bearer",
          scope: "https://www.googleapis.com/auth/business.manage",
        }),
      });

      const token = await refreshAccessToken("refresh-token");
      expect(token).toBe("new-access-token");

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe("https://oauth2.googleapis.com/token");
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual({
        "Content-Type": "application/x-www-form-urlencoded",
      });
      const bodyParams = new URLSearchParams(options.body as string);
      expect(bodyParams.get("grant_type")).toBe("refresh_token");
      expect(bodyParams.get("refresh_token")).toBe("refresh-token");
      expect(bodyParams.get("client_id")).toBe("test-client-id");
      expect(bodyParams.get("client_secret")).toBe("test-client-secret");
    });

    it("throws GoogleAPIError on 401", async () => {
      const errorResponse = { error: "invalid_grant" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      // Verify fetch was called once with correct parameters and error details
      let caughtError: GoogleAPIError | null = null;
      try {
        await refreshAccessToken("bad-token");
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe("https://oauth2.googleapis.com/token");
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual({
        "Content-Type": "application/x-www-form-urlencoded",
      });
      const bodyParams = new URLSearchParams(options.body as string);
      expect(bodyParams.get("grant_type")).toBe("refresh_token");
      expect(bodyParams.get("refresh_token")).toBe("bad-token");
      expect(bodyParams.get("client_id")).toBe("test-client-id");
      expect(bodyParams.get("client_secret")).toBe("test-client-secret");

      // Verify the error details
      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(401);
      expect(caughtError?.message).toBe(
        "Google authentication expired. Please reconnect your account.",
      );
    });

    it("throws GoogleAPIError on 400 with error details", async () => {
      const errorResponse = {
        error: "invalid_grant",
        error_description: "Token has been expired or revoked.",
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      // Verify fetch was called once with correct parameters and error details
      let caughtError: GoogleAPIError | null = null;
      try {
        await refreshAccessToken("invalid-token");
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe("https://oauth2.googleapis.com/token");
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual({
        "Content-Type": "application/x-www-form-urlencoded",
      });
      const bodyParams = new URLSearchParams(options.body as string);
      expect(bodyParams.get("grant_type")).toBe("refresh_token");
      expect(bodyParams.get("refresh_token")).toBe("invalid-token");
      expect(bodyParams.get("client_id")).toBe("test-client-id");
      expect(bodyParams.get("client_secret")).toBe("test-client-secret");

      // Verify the error details
      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(400);
      expect(caughtError?.message).toBe("Token has been expired or revoked.");
    });
  });

  describe("fetchAccounts", () => {
    it("returns parsed accounts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [
            { name: "accounts/123", accountName: "My Business" },
            { name: "accounts/456", accountName: "Other Business" },
          ],
        }),
      });

      const accounts = await fetchAccounts("access-token");
      expect(accounts).toEqual([
        { accountId: "123", name: "My Business" },
        { accountId: "456", name: "Other Business" },
      ]);

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });
    });

    it("returns empty array when no accounts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const accounts = await fetchAccounts("access-token");
      expect(accounts).toEqual([]);

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });
    });

    it("throws GoogleAPIError on 401 Unauthorized", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      // Verify fetch was called once with correct parameters and error details
      let caughtError: GoogleAPIError | null = null;
      try {
        await fetchAccounts("access-token");
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });

      // Verify the error details
      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(401);
      expect(caughtError?.message).toBe(
        "Failed to fetch accounts: Unauthorized",
      );
    });

    it("propagates network errors when fetch rejects", async () => {
      const networkError = new Error("network");
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(fetchAccounts("access-token")).rejects.toThrow("network");

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });
    });
  });

  describe("fetchLocations", () => {
    it("returns parsed locations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
      });

      const locations = await fetchLocations("access-token", "123");
      expect(locations).toEqual([
        {
          google_account_id: "123",
          google_location_id: "loc1",
          name: "Main Street Store",
          address: "123 Main St, City, ST, 12345",
        },
      ]);

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations?readMask=name,title,storefrontAddress",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });
    });

    it("returns empty array when locations array is empty", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          locations: [],
        }),
      });

      const locations = await fetchLocations("access-token", "123");
      expect(locations).toEqual([]);

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations?readMask=name,title,storefrontAddress",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });
    });

    it("returns empty array when locations is undefined", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const locations = await fetchLocations("access-token", "123");
      expect(locations).toEqual([]);
    });

    it("parses multiple location entries correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
            {
              name: "accounts/123/locations/loc3",
              title: "Third Location",
              storefrontAddress: {
                addressLines: ["789 Pine Rd"],
                locality: "Village",
                administrativeArea: "NY",
                postalCode: "11111",
              },
            },
          ],
        }),
      });

      const locations = await fetchLocations("access-token", "123");
      expect(locations).toEqual([
        {
          google_account_id: "123",
          google_location_id: "loc1",
          name: "Main Street Store",
          address: "123 Main St, City, ST, 12345",
        },
        {
          google_account_id: "123",
          google_location_id: "loc2",
          name: "Second Location",
          address: "456 Oak Ave, Town, CA, 67890",
        },
        {
          google_account_id: "123",
          google_location_id: "loc3",
          name: "Third Location",
          address: "789 Pine Rd, Village, NY, 11111",
        },
      ]);
    });

    it("handles partial/missing address fields without throwing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
              storefrontAddress: {
                addressLines: ["123 Main St"],
              },
            },
            {
              name: "accounts/123/locations/loc4",
              title: "Location with only locality",
              storefrontAddress: {
                locality: "City",
              },
            },
            {
              name: "accounts/123/locations/loc5",
              title: "Location missing some fields",
              storefrontAddress: {
                addressLines: ["456 Oak Ave"],
                locality: "Town",
                // missing administrativeArea and postalCode
              },
            },
            {
              name: "accounts/123/locations/loc6",
              title: "Location with empty addressLines",
              storefrontAddress: {
                addressLines: [],
                locality: "City",
                administrativeArea: "ST",
                postalCode: "12345",
              },
            },
          ],
        }),
      });

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
        {
          google_account_id: "123",
          google_location_id: "loc4",
          name: "Location with only locality",
          address: "City",
        },
        {
          google_account_id: "123",
          google_location_id: "loc5",
          name: "Location missing some fields",
          address: "456 Oak Ave, Town",
        },
        {
          google_account_id: "123",
          google_location_id: "loc6",
          name: "Location with empty addressLines",
          address: "City, ST, 12345",
        },
      ]);
    });

    it("throws GoogleAPIError when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });

      let caughtError: GoogleAPIError | null = null;
      try {
        await fetchLocations("access-token", "123");
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations?readMask=name,title,storefrontAddress",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });

      // Verify the error details
      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(403);
      expect(caughtError?.message).toBe("Failed to fetch locations: Forbidden");
    });

    it("propagates network errors when fetch rejects", async () => {
      const networkError = new Error("network");
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(fetchLocations("access-token", "123")).rejects.toThrow(
        "network",
      );

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations?readMask=name,title,storefrontAddress",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
      });

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

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toContain(
        "https://mybusiness.googleapis.com/v4/accounts/123/locations/loc1/reviews",
      );
      expect(url).toContain("pageSize=50");
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });
    });

    it("forwards pageToken and returns nextPageToken for pagination", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviews: [
            {
              reviewId: "review456",
              reviewer: {
                displayName: "Jane Smith",
              },
              starRating: "FOUR",
              comment: "Good experience",
              createTime: "2024-01-16T11:00:00Z",
            },
          ],
          nextPageToken: "page-token-2",
        }),
      });

      const result = await fetchReviews(
        "access-token",
        "123",
        "loc1",
        "page-token-1",
      );
      expect(result.reviews).toHaveLength(1);
      expect(result.nextPageToken).toBe("page-token-2");

      // Verify fetch was called with pageToken in URL
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url] = call as [string, RequestInit];
      expect(url).toContain("pageToken=page-token-1");
      expect(url).toContain("pageSize=50");
    });

    it("handles reviews with replies correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
      });

      const result = await fetchReviews("access-token", "123", "loc1");
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0]).toMatchObject({
        external_review_id: "review789",
        reviewer_name: "Bob Johnson",
        reviewer_photo_url: "https://example.com/bob.jpg",
        rating: 3,
        review_text: "Average service",
        review_date: "2024-01-17T12:00:00Z",
        has_response: true,
        platform: "google",
        status: "responded",
      });
      expect(result.nextPageToken).toBeUndefined();
    });

    it("returns empty array when reviews array is empty", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviews: [],
        }),
      });

      const result = await fetchReviews("access-token", "123", "loc1");
      expect(result.reviews).toHaveLength(0);
      expect(result.reviews).toEqual([]);
      expect(result.nextPageToken).toBeUndefined();
    });

    it("returns empty array when reviews is undefined", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await fetchReviews("access-token", "123", "loc1");
      expect(result.reviews).toHaveLength(0);
      expect(result.reviews).toEqual([]);
      expect(result.nextPageToken).toBeUndefined();
    });

    it("handles missing optional fields gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviews: [
            {
              reviewId: "review-no-photo",
              reviewer: {
                displayName: "Anonymous User",
                // no profilePhotoUrl
              },
              starRating: "FIVE",
              // no comment
              createTime: "2024-01-19T14:00:00Z",
            },
            {
              reviewId: "review-unknown-rating",
              reviewer: {
                displayName: "Test User",
              },
              starRating: "UNKNOWN_RATING" as "FIVE",
              comment: "Test comment",
              createTime: "2024-01-20T15:00:00Z",
            },
            {
              reviewId: "review-no-rating",
              reviewer: {
                displayName: "Another User",
              },
              // no starRating
              comment: "Another comment",
              createTime: "2024-01-21T16:00:00Z",
            },
            {
              reviewId: "review-minimal",
              // no reviewer
              starRating: "ONE",
              comment: "Minimal review",
              // no createTime
            },
          ],
        }),
      });

      const result = await fetchReviews("access-token", "123", "loc1");
      expect(result.reviews).toHaveLength(4);

      // Review without profilePhotoUrl
      expect(result.reviews[0]).toMatchObject({
        external_review_id: "review-no-photo",
        reviewer_name: "Anonymous User",
        reviewer_photo_url: null,
        rating: 5,
        review_text: null,
        review_date: "2024-01-19T14:00:00Z",
        has_response: false,
        platform: "google",
        status: "pending",
      });

      // Review with unknown starRating
      expect(result.reviews[1]).toMatchObject({
        external_review_id: "review-unknown-rating",
        reviewer_name: "Test User",
        rating: null, // Unknown rating maps to null
        review_text: "Test comment",
        review_date: "2024-01-20T15:00:00Z",
        has_response: false,
        platform: "google",
        status: "pending",
      });

      // Review without starRating
      expect(result.reviews[2]).toMatchObject({
        external_review_id: "review-no-rating",
        reviewer_name: "Another User",
        rating: null,
        review_text: "Another comment",
        review_date: "2024-01-21T16:00:00Z",
        has_response: false,
        platform: "google",
        status: "pending",
      });

      // Minimal review
      expect(result.reviews[3]).toMatchObject({
        external_review_id: "review-minimal",
        reviewer_name: null,
        rating: 1,
        review_text: "Minimal review",
        review_date: null,
        has_response: false,
        platform: "google",
        status: "pending",
      });
    });

    it("validates createTime parsing with different time formats", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviews: [
            {
              reviewId: "review-iso",
              reviewer: {
                displayName: "ISO User",
              },
              starRating: "FIVE",
              comment: "ISO format",
              createTime: "2024-01-22T17:00:00Z",
            },
            {
              reviewId: "review-iso-with-ms",
              reviewer: {
                displayName: "ISO MS User",
              },
              starRating: "FOUR",
              comment: "ISO with milliseconds",
              createTime: "2024-01-23T18:00:00.123Z",
            },
            {
              reviewId: "review-iso-with-offset",
              reviewer: {
                displayName: "ISO Offset User",
              },
              starRating: "THREE",
              comment: "ISO with offset",
              createTime: "2024-01-24T19:00:00+00:00",
            },
          ],
        }),
      });

      const result = await fetchReviews("access-token", "123", "loc1");
      expect(result.reviews).toHaveLength(3);

      // All createTime values should be preserved as-is
      expect(result.reviews[0]?.review_date).toBe("2024-01-22T17:00:00Z");
      expect(result.reviews[1]?.review_date).toBe("2024-01-23T18:00:00.123Z");
      expect(result.reviews[2]?.review_date).toBe("2024-01-24T19:00:00+00:00");
    });

    it("handles multiple pages with nextPageToken", async () => {
      // First page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviews: [
            {
              reviewId: "review-page1-1",
              reviewer: {
                displayName: "Page 1 User 1",
              },
              starRating: "FIVE",
              comment: "First page review 1",
              createTime: "2024-01-25T20:00:00Z",
            },
            {
              reviewId: "review-page1-2",
              reviewer: {
                displayName: "Page 1 User 2",
              },
              starRating: "FOUR",
              comment: "First page review 2",
              createTime: "2024-01-26T21:00:00Z",
            },
          ],
          nextPageToken: "token-page-2",
        }),
      });

      const page1 = await fetchReviews("access-token", "123", "loc1");
      expect(page1.reviews).toHaveLength(2);
      expect(page1.nextPageToken).toBe("token-page-2");

      // Second page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviews: [
            {
              reviewId: "review-page2-1",
              reviewer: {
                displayName: "Page 2 User 1",
              },
              starRating: "THREE",
              comment: "Second page review 1",
              createTime: "2024-01-27T22:00:00Z",
            },
          ],
          nextPageToken: "token-page-3",
        }),
      });

      const page2 = await fetchReviews(
        "access-token",
        "123",
        "loc1",
        page1.nextPageToken,
      );
      expect(page2.reviews).toHaveLength(1);
      expect(page2.nextPageToken).toBe("token-page-3");

      // Third page (last page, no nextPageToken)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviews: [
            {
              reviewId: "review-page3-1",
              reviewer: {
                displayName: "Page 3 User 1",
              },
              starRating: "TWO",
              comment: "Last page review",
              createTime: "2024-01-28T23:00:00Z",
            },
          ],
          // no nextPageToken
        }),
      });

      const page3 = await fetchReviews(
        "access-token",
        "123",
        "loc1",
        page2.nextPageToken,
      );
      expect(page3.reviews).toHaveLength(1);
      expect(page3.nextPageToken).toBeUndefined();

      // Verify all fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
      const call1 = mockFetch.mock.calls[0];
      expect(call1).toBeDefined();
      const [url1] = call1 as [string, RequestInit];
      expect(url1).toContain("pageSize=50");
      expect(url1).not.toContain("pageToken");

      const call2 = mockFetch.mock.calls[1];
      expect(call2).toBeDefined();
      const [url2] = call2 as [string, RequestInit];
      expect(url2).toContain("pageToken=token-page-2");

      const call3 = mockFetch.mock.calls[2];
      expect(call3).toBeDefined();
      const [url3] = call3 as [string, RequestInit];
      expect(url3).toContain("pageToken=token-page-3");
    });

    it("throws GoogleAPIError when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      let caughtError: GoogleAPIError | null = null;
      try {
        await fetchReviews("access-token", "123", "loc1");
      } catch (error) {
        caughtError = error as GoogleAPIError;
      }

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toContain(
        "https://mybusiness.googleapis.com/v4/accounts/123/locations/loc1/reviews",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });

      // Verify the error details
      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(404);
      expect(caughtError?.message).toBe("Failed to fetch reviews: Not Found");
    });

    it("propagates network errors when fetch rejects", async () => {
      const networkError = new Error("network");
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(fetchReviews("access-token", "123", "loc1")).rejects.toThrow(
        "network",
      );

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toContain(
        "https://mybusiness.googleapis.com/v4/accounts/123/locations/loc1/reviews",
      );
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
      });
    });

    it("maps all star rating values correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviews: [
            {
              reviewId: "review-one",
              reviewer: { displayName: "One Star" },
              starRating: "ONE",
              comment: "One star review",
              createTime: "2024-01-29T00:00:00Z",
            },
            {
              reviewId: "review-two",
              reviewer: { displayName: "Two Star" },
              starRating: "TWO",
              comment: "Two star review",
              createTime: "2024-01-29T01:00:00Z",
            },
            {
              reviewId: "review-three",
              reviewer: { displayName: "Three Star" },
              starRating: "THREE",
              comment: "Three star review",
              createTime: "2024-01-29T02:00:00Z",
            },
            {
              reviewId: "review-four",
              reviewer: { displayName: "Four Star" },
              starRating: "FOUR",
              comment: "Four star review",
              createTime: "2024-01-29T03:00:00Z",
            },
            {
              reviewId: "review-five",
              reviewer: { displayName: "Five Star" },
              starRating: "FIVE",
              comment: "Five star review",
              createTime: "2024-01-29T04:00:00Z",
            },
          ],
        }),
      });

      const result = await fetchReviews("access-token", "123", "loc1");
      expect(result.reviews).toHaveLength(5);
      expect(result.reviews[0]?.rating).toBe(1);
      expect(result.reviews[1]?.rating).toBe(2);
      expect(result.reviews[2]?.rating).toBe(3);
      expect(result.reviews[3]?.rating).toBe(4);
      expect(result.reviews[4]?.rating).toBe(5);
    });
  });

  describe("publishResponse", () => {
    it("returns true on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await publishResponse(
        "access-token",
        "123",
        "loc1",
        "review123",
        "Thank you for your review!",
      );
      expect(result).toBe(true);

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusiness.googleapis.com/v4/accounts/123/locations/loc1/reviews/review123/reply",
      );
      expect(options.method).toBe("PUT");
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
        "Content-Type": "application/json",
      });
      const body = JSON.parse(options.body as string);
      expect(body).toEqual({
        comment: "Thank you for your review!",
      });
    });

    it("throws GoogleAPIError on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });

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

      // Verify fetch was called once with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call as [string, RequestInit];
      expect(url).toBe(
        "https://mybusiness.googleapis.com/v4/accounts/123/locations/loc1/reviews/review123/reply",
      );
      expect(options.method).toBe("PUT");
      expect(options.headers).toEqual({
        Authorization: "Bearer access-token",
        "Content-Type": "application/json",
      });
      const body = JSON.parse(options.body as string);
      expect(body).toEqual({
        comment: "Response text",
      });

      // Verify the error details
      expect(caughtError).toBeInstanceOf(GoogleAPIError);
      expect(caughtError?.status).toBe(403);
      expect(caughtError?.message).toBe(
        "Failed to publish response: Forbidden",
      );
    });
  });
});
