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
    });

    it("throws GoogleAPIError on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "invalid_grant" }),
      });

      await expect(refreshAccessToken("bad-token")).rejects.toThrow(
        GoogleAPIError,
      );
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
    });

    it("returns empty array when no accounts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const accounts = await fetchAccounts("access-token");
      expect(accounts).toEqual([]);
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
    });

    it("throws GoogleAPIError on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });

      await expect(
        publishResponse(
          "access-token",
          "123",
          "loc1",
          "review123",
          "Response text",
        ),
      ).rejects.toThrow(GoogleAPIError);
    });
  });
});
