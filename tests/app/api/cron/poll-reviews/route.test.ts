import { randomBytes } from "node:crypto";

import { GET } from "@/app/api/cron/poll-reviews/route";
import { TokenDecryptionError } from "@/lib/crypto/encryption";
import { GoogleAPIError } from "@/lib/google/client";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { createMockLocation, createMockUser } from "@/tests/helpers/fixtures";
import { makeNextRequest } from "@/tests/helpers/next";
import { createMockPollReviewsSupabaseClient } from "@/tests/helpers/supabase-mocks";

vi.mock("@/lib/supabase/server", () => ({
  createAdminSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/crypto/encryption", () => ({
  decryptToken: vi.fn(),
  TokenDecryptionError: class TokenDecryptionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TokenDecryptionError";
    }
  },
}));

vi.mock("@/lib/google/client", () => ({
  refreshAccessToken: vi.fn(),
  fetchReviews: vi.fn(),
  GoogleAPIError: class GoogleAPIError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = "GoogleAPIError";
    }
  },
}));

vi.mock("@/lib/supabase/typed-helpers", () => ({
  typedUpdate: vi.fn(),
  typedUpsert: vi.fn(),
}));

import { decryptToken } from "@/lib/crypto/encryption";
import { fetchReviews, refreshAccessToken } from "@/lib/google/client";
import { typedUpdate, typedUpsert } from "@/lib/supabase/typed-helpers";

// Generate a valid test encryption key
const TEST_ENCRYPTION_KEY = randomBytes(32).toString("hex");

// Default fixtures
const defaultLocation = createMockLocation({
  id: "loc-1",
  google_account_id: "acc-1",
  google_location_id: "loc-1",
  name: "Location 1",
  organization_id: "org-1",
});

const defaultUser = createMockUser({
  id: "user-1",
  organization_id: "org-1",
  google_refresh_token: "encrypted-token",
});

// Default organization configured in createMockPollReviewsSupabaseClient

describe("GET /api/cron/poll-reviews", () => {
  let originalCronSecret: string | undefined;
  let originalSupabaseUrl: string | undefined;
  let originalServiceRoleKey: string | undefined;
  let originalTokenKey: string | undefined;

  beforeEach(() => {
    originalCronSecret = process.env.CRON_SECRET;
    originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    originalTokenKey = process.env.TOKEN_ENCRYPTION_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    process.env.TOKEN_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
    if (originalSupabaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    }
    if (originalServiceRoleKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    }
    if (originalTokenKey === undefined) {
      delete process.env.TOKEN_ENCRYPTION_KEY;
    } else {
      process.env.TOKEN_ENCRYPTION_KEY = originalTokenKey;
    }
    vi.restoreAllMocks();
  });

  // Helper to set up standard successful mocks
  function setupSuccessfulMocks() {
    vi.mocked(decryptToken).mockReturnValue("decrypted-token");
    vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
    vi.mocked(fetchReviews).mockResolvedValue({ reviews: [] });
    vi.mocked(typedUpsert).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: "review-1" }],
        error: null,
      }),
    } as never);
  }

  describe("authorization", () => {
    it.each([
      { header: "Bearer wrong", desc: "invalid authorization" },
      { header: undefined, desc: "missing authorization header" },
    ])("returns 401 when $desc", async ({ header }) => {
      process.env.CRON_SECRET = "secret";

      const headers: Record<string, string> = {};
      if (header) headers.authorization = header;

      const request = makeNextRequest(
        "http://localhost/api/cron/poll-reviews",
        { headers },
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    });

    it("allows execution when CRON_SECRET is unset", async () => {
      delete process.env.CRON_SECRET;
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient() as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("allows execution when CRON_SECRET matches authorization", async () => {
      process.env.CRON_SECRET = "secret";
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient() as never,
      );

      const request = makeNextRequest(
        "http://localhost/api/cron/poll-reviews",
        { headers: { authorization: "Bearer secret" } },
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("database errors", () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
    });

    it("returns 500 when locations fetch fails", async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsError: { message: "Database connection failed" },
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to fetch locations",
      });
    });

    it("returns 500 when users fetch fails", async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersError: { message: "Database query failed" },
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to fetch users",
      });
    });
  });

  describe("token handling", () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
    });

    it("handles token decryption failure and clears token", async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(typedUpdate).mockReturnValue({ eq: mockEq } as never);
      vi.mocked(decryptToken).mockImplementation(() => {
        throw new TokenDecryptionError("Invalid encrypted data");
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.errors).toContain(
        "User user-1: Token decryption failed - data may be corrupted",
      );
      expect(typedUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", "user-1");
    });

    it("handles token refresh 401 and clears token", async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(typedUpdate).mockReturnValue({ eq: mockEq } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockRejectedValue(
        new GoogleAPIError(401, "Token expired"),
      );

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.errors).toContain("User user-1: Token expired");
      expect(typedUpdate).toHaveBeenCalled();
    });

    it("handles token refresh other errors without clearing token", async () => {
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockRejectedValue(
        new GoogleAPIError(500, "Internal server error"),
      );

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.errors).toContain("User user-1: Internal server error");
      expect(typedUpdate).not.toHaveBeenCalled();
    });
  });

  describe("review processing", () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
      setupSuccessfulMocks();
    });

    it("successfully processes reviews and upserts them", async () => {
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "ext-1",
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
          {
            external_review_id: "ext-2",
            reviewer_name: "Jane",
            rating: 4,
            review_text: "Good service",
            review_date: "2025-01-02T00:00:00.000Z",
          },
        ],
      });
      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }, { id: "review-2" }],
          error: null,
        }),
      } as never);

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.locationsProcessed).toBe(1);
      expect(json.reviewsProcessed).toBe(2);
      expect(json.errors).toHaveLength(0);
      expect(typedUpsert).toHaveBeenCalled();
    });

    it("generates synthetic ID for reviews missing external_review_id", async () => {
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Generated synthetic external_review_id"),
      );
    });

    it("skips reviews with missing external_review_id and insufficient data", async () => {
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            reviewer_name: null,
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(json.reviewsProcessed).toBe(0);
      expect(typedUpsert).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Skipping review"),
      );
    });

    it("handles empty reviews array", async () => {
      vi.mocked(fetchReviews).mockResolvedValue({ reviews: [] });
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(json.locationsProcessed).toBe(1);
      expect(json.reviewsProcessed).toBe(0);
      expect(typedUpsert).not.toHaveBeenCalled();
    });

    it.each([
      { rating: 5, expectedSentiment: "positive" },
      { rating: 4, expectedSentiment: "positive" },
      { rating: 3, expectedSentiment: "neutral" },
      { rating: 2, expectedSentiment: "negative" },
      { rating: 1, expectedSentiment: "negative" },
      { rating: null, expectedSentiment: null },
    ])("determines sentiment correctly for rating $rating", async ({
      rating,
      expectedSentiment,
    }) => {
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "ext-1",
            reviewer_name: "John",
            rating,
            review_text: "Review",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      await GET(request);

      const upsertCalls = vi.mocked(typedUpsert).mock.calls;
      const lastCall = upsertCalls[upsertCalls.length - 1];
      expect(lastCall).toBeDefined();
      const reviewsToInsert = lastCall?.[2] as Array<{
        sentiment: string | null;
      }>;
      expect(reviewsToInsert[0]?.sentiment).toBe(expectedSentiment);
    });

    it("handles upsert error and adds to errors array", async () => {
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "ext-1",
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });
      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database constraint violation" },
        }),
      } as never);

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(json.errors).toContain(
        "Location Location 1: Failed to save reviews",
      );
    });

    it("handles fetchReviews error", async () => {
      vi.mocked(fetchReviews).mockRejectedValue(
        new GoogleAPIError(500, "Google API error"),
      );

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(json.errors).toContain("Location Location 1: Google API error");
    });
  });

  describe("tier-based processing", () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
      setupSuccessfulMocks();
    });

    // Test tier processing at different minutes
    it.each([
      { tier: "starter", minute: 7, shouldProcess: false },
      { tier: "starter", minute: 15, shouldProcess: true },
      { tier: "starter", minute: 30, shouldProcess: true },
      { tier: "starter", minute: 0, shouldProcess: true },
      { tier: "growth", minute: 7, shouldProcess: false },
      { tier: "growth", minute: 10, shouldProcess: true },
      { tier: "growth", minute: 20, shouldProcess: true },
      { tier: "growth", minute: 0, shouldProcess: true },
      { tier: "agency", minute: 7, shouldProcess: true },
      { tier: "agency", minute: 0, shouldProcess: true },
      { tier: null, minute: 7, shouldProcess: false }, // null tier treated as starter
    ])("$tier tier at minute $minute: shouldProcess=$shouldProcess", async ({
      tier,
      minute,
      shouldProcess,
    }) => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(
          new Date(`2025-01-01T00:${String(minute).padStart(2, "0")}:00Z`),
        );

        vi.mocked(createAdminSupabaseClient).mockReturnValue(
          createMockPollReviewsSupabaseClient({
            locationsData: [defaultLocation],
            usersData: [defaultUser],
            organizationsData: [{ id: "org-1", plan_tier: tier }],
          }) as never,
        );

        const request = makeNextRequest(
          "http://localhost/api/cron/poll-reviews",
        );
        const response = await GET(request);
        const json = await response.json();

        if (shouldProcess) {
          expect(json.locationsProcessed).toBe(1);
          expect(fetchReviews).toHaveBeenCalled();
        } else {
          expect(json.locationsProcessed).toBe(0);
          expect(fetchReviews).not.toHaveBeenCalled();
        }
      } finally {
        vi.useRealTimers();
      }
    });

    it("filters locations correctly when multiple tiers are present", async () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date("2025-01-01T00:15:00Z")); // minute 15

        vi.mocked(createAdminSupabaseClient).mockReturnValue(
          createMockPollReviewsSupabaseClient({
            locationsData: [
              createMockLocation({
                id: "loc-1",
                name: "Location 1 (starter)",
                organization_id: "org-1",
              }),
              createMockLocation({
                id: "loc-2",
                name: "Location 2 (growth)",
                organization_id: "org-2",
              }),
              createMockLocation({
                id: "loc-3",
                name: "Location 3 (agency)",
                organization_id: "org-3",
              }),
            ],
            usersData: [
              createMockUser({
                id: "user-1",
                organization_id: "org-1",
                google_refresh_token: "token-1",
              }),
              createMockUser({
                id: "user-2",
                organization_id: "org-2",
                google_refresh_token: "token-2",
              }),
              createMockUser({
                id: "user-3",
                organization_id: "org-3",
                google_refresh_token: "token-3",
              }),
            ],
            organizationsData: [
              { id: "org-1", plan_tier: "starter" },
              { id: "org-2", plan_tier: "growth" },
              { id: "org-3", plan_tier: "agency" },
            ],
          }) as never,
        );

        const request = makeNextRequest(
          "http://localhost/api/cron/poll-reviews",
        );
        const response = await GET(request);
        const json = await response.json();

        // Minute 15: processes starter (15 % 15 = 0) and agency (always), skips growth (15 % 10 = 5)
        expect(json.locationsProcessed).toBe(2);
        expect(fetchReviews).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
      setupSuccessfulMocks();
    });

    it("skips locations without organization_id", async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [createMockLocation({ organization_id: null })],
          usersData: [],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(json.locationsProcessed).toBe(0);
      expect(json.reviewsProcessed).toBe(0);
    });

    it("skips locations without matching user", async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [], // No users with tokens
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(json.locationsProcessed).toBe(0);
      expect(json.reviewsProcessed).toBe(0);
    });

    it("uses first user when multiple users per organization", async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [
            createMockUser({
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token-1",
            }),
            createMockUser({
              id: "user-2",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token-2",
            }),
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      await GET(request);

      expect(decryptToken).toHaveBeenCalledWith("encrypted-token-1");
      expect(decryptToken).not.toHaveBeenCalledWith("encrypted-token-2");
    });

    it("refreshes token once for multiple locations per user", async () => {
      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [
            createMockLocation({ id: "loc-1", organization_id: "org-1" }),
            createMockLocation({ id: "loc-2", organization_id: "org-1" }),
          ],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      await GET(request);

      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      expect(fetchReviews).toHaveBeenCalledTimes(2);
    });

    it("handles top-level error and returns 500", async () => {
      vi.mocked(createAdminSupabaseClient).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("Cron job failed");
    });

    it.each([
      { externalReviewId: "", desc: "empty string" },
      { externalReviewId: "   ", desc: "whitespace-only" },
    ])("handles $desc external_review_id and generates synthetic ID", async ({
      externalReviewId,
    }) => {
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: externalReviewId,
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      await GET(request);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Generated synthetic external_review_id"),
      );
    });

    it("handles typedUpdate failure when clearing corrupted token", async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });
      vi.mocked(typedUpdate).mockReturnValue({ eq: mockEq } as never);
      vi.mocked(decryptToken).mockImplementation(() => {
        throw new TokenDecryptionError("Invalid encrypted data");
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.errors).toContain(
        "User user-1: Token decryption failed - data may be corrupted",
      );
      expect(typedUpdate).toHaveBeenCalled();
    });

    it("handles null upsertedReviews array", async () => {
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "ext-1",
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });
      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as never);

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.reviewsProcessed).toBe(0);
    });

    it("skips review when external_review_id is empty and review_date is missing", async () => {
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: null,
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(json.reviewsProcessed).toBe(0);
      expect(typedUpsert).not.toHaveBeenCalled();
    });
  });

  describe("error handling with agency tier", () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
    });

    it.each([
      {
        name: "token decryption errors",
        setupMocks: () => {
          vi.mocked(decryptToken).mockImplementation(() => {
            throw new Error("Decryption failed");
          });
        },
        expectedLocationsProcessed: 0,
        expectedReviewsProcessed: 0,
      },
      {
        name: "token refresh errors",
        setupMocks: () => {
          vi.mocked(decryptToken).mockReturnValue("decrypted-token");
          vi.mocked(refreshAccessToken).mockRejectedValue(
            new Error("Token refresh failed"),
          );
        },
        expectedLocationsProcessed: 0,
        expectedReviewsProcessed: 0,
      },
      {
        name: "fetchReviews errors",
        setupMocks: () => {
          vi.mocked(decryptToken).mockReturnValue("decrypted-token");
          vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
          vi.mocked(fetchReviews).mockRejectedValue(new Error("API error"));
        },
        expectedLocationsProcessed: 0,
        expectedReviewsProcessed: 0,
      },
    ])("handles $name gracefully with agency tier", async ({
      setupMocks,
      expectedLocationsProcessed,
      expectedReviewsProcessed,
    }) => {
      setupMocks();

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockPollReviewsSupabaseClient({
          locationsData: [defaultLocation],
          usersData: [defaultUser],
          organizationsData: [{ id: "org-1", plan_tier: "agency" }],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.locationsProcessed).toBe(expectedLocationsProcessed);
      expect(json.reviewsProcessed).toBe(expectedReviewsProcessed);
    });
  });
});
