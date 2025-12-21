import { randomBytes } from "node:crypto";

import { GET } from "@/app/api/cron/poll-reviews/route";
import { TokenDecryptionError } from "@/lib/crypto/encryption";
import { GoogleAPIError } from "@/lib/google/client";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { makeNextRequest } from "@/tests/helpers/next";

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

  const createMockSupabaseClient = (overrides?: {
    locationsData?: unknown[];
    locationsError?: unknown;
    usersData?: unknown[];
    usersError?: unknown;
  }) => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "locations") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: overrides?.locationsData ?? [],
                error: overrides?.locationsError ?? null,
              }),
            }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: overrides?.usersData ?? [],
                error: overrides?.usersError ?? null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    return {
      from: mockFrom,
    };
  };

  describe("authorization", () => {
    it("returns 401 when CRON_SECRET is set and authorization is invalid", async () => {
      process.env.CRON_SECRET = "secret";

      const request = makeNextRequest(
        "http://localhost/api/cron/poll-reviews",
        {
          headers: {
            authorization: "Bearer wrong",
          },
        },
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    });

    it("returns 401 when CRON_SECRET is set and authorization header is missing", async () => {
      process.env.CRON_SECRET = "secret";

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    });

    it("allows execution when CRON_SECRET is unset", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient() as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("No active locations"),
          duration: expect.any(Number),
        }),
      );
    });

    it("allows execution when CRON_SECRET matches authorization", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      process.env.CRON_SECRET = "secret";

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient() as never,
      );

      const request = makeNextRequest(
        "http://localhost/api/cron/poll-reviews",
        {
          headers: {
            authorization: "Bearer secret",
          },
        },
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(
        expect.objectContaining({
          success: true,
        }),
      );
    });
  });

  describe("database errors", () => {
    it("returns 500 when locations fetch fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsError: { message: "Database connection failed" },
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({ error: "Failed to fetch locations" });
      expect(console.error).toHaveBeenCalledWith(
        "Failed to fetch locations:",
        "Database connection failed",
      );
    });

    it("returns 500 when users fetch fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersError: { message: "Database query failed" },
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({ error: "Failed to fetch users" });
      expect(console.error).toHaveBeenCalledWith(
        "Failed to fetch users:",
        "Database query failed",
      );
    });
  });

  describe("token handling", () => {
    it("handles token decryption failure and clears token", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = {
        eq: mockEq,
      };

      vi.mocked(typedUpdate).mockReturnValue(mockUpdate as never);
      vi.mocked(decryptToken).mockImplementation(() => {
        throw new TokenDecryptionError("Invalid encrypted data");
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
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
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = {
        eq: mockEq,
      };

      vi.mocked(typedUpdate).mockReturnValue(mockUpdate as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockRejectedValue(
        new GoogleAPIError(401, "Token expired"),
      );

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.errors).toContain("User user-1: Token expired");
      expect(typedUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", "user-1");
    });

    it("handles token refresh other errors without clearing token", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockRejectedValue(
        new GoogleAPIError(500, "Internal server error"),
      );

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
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
    it("successfully processes reviews and upserts them", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }, { id: "review-2" }],
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
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

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.locationsProcessed).toBe(1);
      expect(json.reviewsProcessed).toBe(2);
      expect(json.errors).toHaveLength(0);
      expect(typedUpsert).toHaveBeenCalled();
    });

    it("generates synthetic ID for reviews missing external_review_id", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "log").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }],
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
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
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.reviewsProcessed).toBe(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Generated synthetic external_review_id"),
      );

      const upsertCalls = vi.mocked(typedUpsert).mock.calls;
      const lastCall = upsertCalls[upsertCalls.length - 1];
      expect(lastCall).toBeDefined();
      const reviewsToInsert = lastCall?.[2] as unknown[];
      expect(reviewsToInsert[0]).toMatchObject({
        external_review_id: expect.stringContaining("synthetic_"),
      });
    });

    it("skips reviews with missing external_review_id and insufficient data", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            reviewer_name: null, // Missing required field
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.locationsProcessed).toBe(1);
      expect(json.reviewsProcessed).toBe(0);
      expect(typedUpsert).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Skipping review"),
      );
    });

    it("handles empty reviews array", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.locationsProcessed).toBe(1);
      expect(json.reviewsProcessed).toBe(0);
      expect(typedUpsert).not.toHaveBeenCalled();
    });

    it("determines sentiment correctly from rating", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }, { id: "review-2" }, { id: "review-3" }],
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "ext-1",
            reviewer_name: "John",
            rating: 5, // positive
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
          {
            external_review_id: "ext-2",
            reviewer_name: "Jane",
            rating: 3, // neutral
            review_text: "OK",
            review_date: "2025-01-02T00:00:00.000Z",
          },
          {
            external_review_id: "ext-3",
            reviewer_name: "Bob",
            rating: 1, // negative
            review_text: "Bad",
            review_date: "2025-01-03T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
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
      expect(reviewsToInsert[0]?.sentiment).toBe("positive");
      expect(reviewsToInsert[1]?.sentiment).toBe("neutral");
      expect(reviewsToInsert[2]?.sentiment).toBe("negative");
    });

    it("handles null rating for sentiment", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }],
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "ext-1",
            reviewer_name: "John",
            rating: null,
            review_text: "No rating",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
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
      expect(reviewsToInsert[0]?.sentiment).toBeNull();
    });

    it("handles upsert error and adds to errors array", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database constraint violation" },
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
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

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.errors).toContain(
        "Location Location 1: Failed to save reviews",
      );
      expect(console.error).toHaveBeenCalledWith(
        "Failed to upsert reviews for location loc-1:",
        "Database constraint violation",
      );
    });

    it("handles fetchReviews error", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockRejectedValue(
        new GoogleAPIError(500, "Google API error"),
      );

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.errors).toContain("Location Location 1: Google API error");
    });
  });

  describe("edge cases", () => {
    it("skips locations without organization_id", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: null, // No organization
            },
          ],
          usersData: [],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.locationsProcessed).toBe(0);
      expect(json.reviewsProcessed).toBe(0);
    });

    it("skips locations without matching user", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [], // No users with tokens
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.locationsProcessed).toBe(0);
      expect(json.reviewsProcessed).toBe(0);
    });

    it("uses first user when multiple users per organization", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({ reviews: [] });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1", // First user should be used
              organization_id: "org-1",
              google_refresh_token: "encrypted-token-1",
            },
            {
              id: "user-2", // Second user should be ignored
              organization_id: "org-1",
              google_refresh_token: "encrypted-token-2",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      await GET(request);

      expect(decryptToken).toHaveBeenCalledWith("encrypted-token-1");
      expect(decryptToken).not.toHaveBeenCalledWith("encrypted-token-2");
    });

    it("refreshes token once for multiple locations per user", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({ reviews: [] });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
            {
              id: "loc-2",
              google_account_id: "acc-1",
              google_location_id: "loc-2",
              name: "Location 2",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      await GET(request);

      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      expect(fetchReviews).toHaveBeenCalledTimes(2);
    });

    it("handles top-level error and returns 500", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(createAdminSupabaseClient).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe("Cron job failed");
      expect(console.error).toHaveBeenCalledWith(
        "Poll reviews cron error:",
        expect.any(Error),
      );
    });

    it("handles empty string external_review_id and generates synthetic ID", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "log").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }],
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "", // Empty string, not null
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.reviewsProcessed).toBe(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Generated synthetic external_review_id"),
      );
    });

    it("handles whitespace-only external_review_id and generates synthetic ID", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "log").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }],
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "   ", // Whitespace only
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.reviewsProcessed).toBe(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Generated synthetic external_review_id"),
      );
    });

    it("determines sentiment correctly for boundary rating 4", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }],
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "ext-1",
            reviewer_name: "John",
            rating: 4, // Boundary: should be positive
            review_text: "Good",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
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
      expect(reviewsToInsert[0]?.sentiment).toBe("positive");
    });

    it("determines sentiment correctly for boundary rating 3", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }],
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            external_review_id: "ext-1",
            reviewer_name: "John",
            rating: 3, // Boundary: should be neutral
            review_text: "OK",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
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
      expect(reviewsToInsert[0]?.sentiment).toBe("neutral");
    });

    it("handles typedUpdate failure when clearing corrupted token", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });
      const mockUpdate = {
        eq: mockEq,
      };

      vi.mocked(typedUpdate).mockReturnValue(mockUpdate as never);
      vi.mocked(decryptToken).mockImplementation(() => {
        throw new TokenDecryptionError("Invalid encrypted data");
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.errors).toContain(
        "User user-1: Token decryption failed - data may be corrupted",
      );
      // Should still attempt to clear token even if update fails
      expect(typedUpdate).toHaveBeenCalled();
    });

    it("handles typedUpdate failure when clearing expired token", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });
      const mockUpdate = {
        eq: mockEq,
      };

      vi.mocked(typedUpdate).mockReturnValue(mockUpdate as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockRejectedValue(
        new GoogleAPIError(401, "Token expired"),
      );

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.errors).toContain("User user-1: Token expired");
      // Should still attempt to clear token even if update fails
      expect(typedUpdate).toHaveBeenCalled();
    });

    it("handles null upsertedReviews array", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null, // Null data
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
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

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      // Should handle null gracefully and count 0 reviews
      expect(json.reviewsProcessed).toBe(0);
    });

    it("skips review when external_review_id is empty and review_date is missing", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: null, // Missing review_date
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.reviewsProcessed).toBe(0);
      expect(typedUpsert).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Skipping review"),
      );
    });

    it("skips review when external_review_id is empty and location_id is missing", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
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

      // Create location without id (shouldn't happen, but test edge case)
      const mockFrom = vi.fn((table: string) => {
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      // Missing id field
                      google_account_id: "acc-1",
                      google_location_id: "loc-1",
                      name: "Location 1",
                      organization_id: "org-1",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "user-1",
                      organization_id: "org-1",
                      google_refresh_token: "encrypted-token",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue({
        from: mockFrom,
      } as never);

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.reviewsProcessed).toBe(0);
    });

    it("logs summary when reviews are skipped or have synthetic IDs", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "log").mockImplementation(() => {});
      delete process.env.CRON_SECRET;

      vi.mocked(typedUpsert).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "review-1" }],
          error: null,
        }),
      } as never);
      vi.mocked(decryptToken).mockReturnValue("decrypted-token");
      vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
      vi.mocked(fetchReviews).mockResolvedValue({
        reviews: [
          {
            // Will get synthetic ID
            reviewer_name: "John",
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
          {
            // Will be skipped (missing reviewer_name)
            reviewer_name: null,
            rating: 5,
            review_text: "Great!",
            review_date: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      vi.mocked(createAdminSupabaseClient).mockReturnValue(
        createMockSupabaseClient({
          locationsData: [
            {
              id: "loc-1",
              google_account_id: "acc-1",
              google_location_id: "loc-1",
              name: "Location 1",
              organization_id: "org-1",
            },
          ],
          usersData: [
            {
              id: "user-1",
              organization_id: "org-1",
              google_refresh_token: "encrypted-token",
            },
          ],
        }) as never,
      );

      const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
      await GET(request);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(
          "Location Location 1: 1 reviews with synthetic IDs, 1 reviews skipped",
        ),
      );
    });
  });
});
