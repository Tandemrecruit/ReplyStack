import { randomBytes } from "node:crypto";
import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

vi.mock("@/lib/google/client", () => {
  return {
    refreshAccessToken: vi.fn(),
    publishResponse: vi.fn(),
    GoogleAPIError: class GoogleAPIError extends Error {
      constructor(
        public status: number,
        message: string,
      ) {
        super(message);
        this.name = "GoogleAPIError";
      }
    },
  };
});

import { POST } from "@/app/api/reviews/[reviewId]/publish/route";
import { encryptToken } from "@/lib/crypto/encryption";
import {
  GoogleAPIError,
  publishResponse,
  refreshAccessToken,
} from "@/lib/google/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Generate a valid test encryption key (32 bytes = 64 hex chars)
const TEST_ENCRYPTION_KEY = randomBytes(32).toString("hex");

describe("POST /api/reviews/[reviewId]/publish", () => {
  beforeEach(() => {
    // Set up encryption key for tests
    process.env.TOKEN_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TOKEN_ENCRYPTION_KEY;
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 when user not found", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "User not found" },
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "User not found",
    });
  });

  it("returns 400 when Google account not connected", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-1",
                organization_id: "org-1",
                google_refresh_token: null,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Google account not connected",
      code: "GOOGLE_NOT_CONNECTED",
    });
  });

  it("returns 400 when organization not found", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-1",
                organization_id: null,
                google_refresh_token: "refresh-token",
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No organization found",
    });
  });

  it("returns 404 when review not found", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    organization_id: "org-1",
                    google_refresh_token: "refresh-token",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Review not found" },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Review not found",
    });
  });

  it("returns 404 when review belongs to different organization", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    organization_id: "org-1",
                    google_refresh_token: "refresh-token",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "review-1",
                    external_review_id: "ext-1",
                    location_id: "loc-1",
                    has_response: false,
                    locations: {
                      id: "loc-1",
                      google_account_id: "acc-1",
                      google_location_id: "loc-1",
                      organization_id: "org-2", // Different org
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Review not found",
    });
  });

  it("returns 400 when response_text is missing", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    organization_id: "org-1",
                    google_refresh_token: "refresh-token",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "review-1",
                    external_review_id: "ext-1",
                    location_id: "loc-1",
                    has_response: false,
                    locations: {
                      id: "loc-1",
                      google_account_id: "acc-1",
                      google_location_id: "loc-1",
                      organization_id: "org-1",
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "response_text is required",
    });
  });

  it("returns 400 when response_text is empty", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    organization_id: "org-1",
                    google_refresh_token: "refresh-token",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "review-1",
                    external_review_id: "ext-1",
                    location_id: "loc-1",
                    has_response: false,
                    locations: {
                      id: "loc-1",
                      google_account_id: "acc-1",
                      google_location_id: "loc-1",
                      organization_id: "org-1",
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "   " }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "response_text cannot be empty",
    });
  });

  it("returns 401 and clears token when Google auth expires", async () => {
    // Encrypt the token as it would be stored in the database
    const encryptedToken = encryptToken("refresh-token");

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          const usersChain = {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    organization_id: "org-1",
                    google_refresh_token: encryptedToken,
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
          return usersChain;
        }
        if (table === "reviews") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "review-1",
                    external_review_id: "ext-1",
                    location_id: "loc-1",
                    has_response: false,
                    locations: {
                      id: "loc-1",
                      google_account_id: "acc-1",
                      google_location_id: "loc-1",
                      organization_id: "org-1",
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    vi.mocked(refreshAccessToken).mockRejectedValue(
      new GoogleAPIError(401, "Token expired"),
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Google authentication expired. Please reconnect your account.",
      code: "GOOGLE_AUTH_EXPIRED",
    });
  });

  it("publishes response successfully", async () => {
    // Encrypt the token as it would be stored in the database
    const encryptedToken = encryptToken("refresh-token");

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    organization_id: "org-1",
                    google_refresh_token: encryptedToken,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "review-1",
                    external_review_id: "ext-1",
                    location_id: "loc-1",
                    has_response: false,
                    locations: {
                      id: "loc-1",
                      google_account_id: "acc-1",
                      google_location_id: "loc-1",
                      organization_id: "org-1",
                    },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "responses") {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "resp-1",
                    review_id: "review-1",
                    generated_text: "Thank you!",
                    final_text: "Thank you!",
                    status: "published",
                    published_at: "2025-01-15T10:00:00Z",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
    vi.mocked(publishResponse).mockResolvedValue(true);

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      message: "Response published successfully",
      response_id: "resp-1",
      published_at: "2025-01-15T10:00:00Z",
    });

    expect(publishResponse).toHaveBeenCalledWith(
      "access-token",
      "acc-1",
      "loc-1",
      "ext-1",
      "Thank you!",
    );
  });

  it("returns error when Google API publish fails", async () => {
    // Encrypt the token as it would be stored in the database
    const encryptedToken = encryptToken("refresh-token");

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    organization_id: "org-1",
                    google_refresh_token: encryptedToken,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "review-1",
                    external_review_id: "ext-1",
                    location_id: "loc-1",
                    has_response: false,
                    locations: {
                      id: "loc-1",
                      google_account_id: "acc-1",
                      google_location_id: "loc-1",
                      organization_id: "org-1",
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
    vi.mocked(publishResponse).mockRejectedValue(
      new GoogleAPIError(403, "Forbidden"),
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Forbidden",
    });
  });

  it("returns 500 on unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockRejectedValue(
      new Error("Unexpected error"),
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews/review-1/publish",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response_text: "Thank you!" }),
      },
    );
    const response = await POST(request, {
      params: Promise.resolve({ reviewId: "review-1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to publish response",
    });
  });
});
