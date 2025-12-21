import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

vi.mock("@/lib/claude/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/claude/client")>(
    "@/lib/claude/client",
  );
  return {
    ...actual,
    generateResponse: vi.fn(),
  };
});

import { POST } from "@/app/api/responses/route";
import { ClaudeAPIError, generateResponse } from "@/lib/claude/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

describe("POST /api/responses", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when reviewId is missing", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "reviewId is required",
    });
  });

  it("returns 400 when reviewId is null", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: null }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "reviewId is required",
    });
  });

  it("returns 400 when reviewId is empty string", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "reviewId is required",
    });
  });

  it("returns 404 when user not found", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
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

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "User not found",
    });
  });

  it("returns 400 when user has no organization", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "u1",
                organization_id: null,
                email: "user@example.com",
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Organization not found",
    });
  });

  it("returns 404 when review not found", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Review not found",
    });
  });

  it("returns 404 when review belongs to different organization", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great service!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-2", // Different org
                      voice_profile_id: null,
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
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Review not found",
    });
  });

  it("returns existing response when one already exists", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great service!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "resp-1",
                    generated_text: "Thank you for your review!",
                    status: "draft",
                    tokens_used: 120,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "resp-1",
      reviewId: "r1",
      generatedText: "Thank you for your review!",
      status: "draft",
      tokensUsed: 120,
    });
    expect(generateResponse).not.toHaveBeenCalled();
  });

  it("returns 400 when review has no text", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "", // Empty text
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Cannot generate response for review without text",
    });
  });

  it("generates response successfully with location voice profile", async () => {
    vi.mocked(generateResponse).mockResolvedValue({
      text: "Thank you for your wonderful review!",
      tokensUsed: 150,
    });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great service!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: "vp-1",
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          const responsesChain = {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "resp-1" },
                  error: null,
                }),
              }),
            }),
          };
          return responsesChain;
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "vp-1",
                    organization_id: "org-1",
                    name: "Location Voice",
                    tone: "professional",
                    personality_notes: "Friendly and helpful",
                    sign_off_style: "Best regards",
                    example_responses: null,
                    words_to_use: null,
                    words_to_avoid: null,
                    max_length: 200,
                    created_at: "2025-01-01T00:00:00Z",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      id: "resp-1",
      reviewId: "r1",
      generatedText: "Thank you for your wonderful review!",
      status: "draft",
      tokensUsed: 150,
    });
    expect(generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r1",
        review_text: "Great service!",
      }),
      expect.objectContaining({
        id: "vp-1",
        tone: "professional",
      }),
      "Test Location",
      "user@example.com",
    );
  });

  it("generates response with organization voice profile when location has none", async () => {
    vi.mocked(generateResponse).mockResolvedValue({
      text: "Thank you for your feedback!",
      tokensUsed: 100,
    });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 4,
                    reviewer_name: "Jane",
                    review_text: "Good experience",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-2",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null, // No location voice profile
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "resp-2" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "vp-org-1",
                      organization_id: "org-1",
                      name: "Org Voice",
                      tone: "casual",
                      personality_notes: "Warm and welcoming",
                      sign_off_style: "Thanks!",
                      example_responses: null,
                      words_to_use: null,
                      words_to_avoid: null,
                      max_length: 150,
                      created_at: "2025-01-01T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      id: "resp-2",
      reviewId: "r1",
      generatedText: "Thank you for your feedback!",
      status: "draft",
      tokensUsed: 100,
    });
    expect(generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r1",
        review_text: "Good experience",
      }),
      expect.objectContaining({
        id: "vp-org-1",
        tone: "casual",
      }),
      "Test Location",
      "user@example.com",
    );
  });

  it("generates response with default voice profile when none found", async () => {
    vi.mocked(generateResponse).mockResolvedValue({
      text: "Thank you for your review!",
      tokensUsed: 80,
    });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 3,
                    reviewer_name: "Bob",
                    review_text: "It was okay",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-3",
                    platform: "google",
                    status: "pending",
                    sentiment: "neutral",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "resp-3" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null, // No org voice profile
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      id: "resp-3",
      reviewId: "r1",
      generatedText: "Thank you for your review!",
      status: "draft",
      tokensUsed: 80,
    });
    expect(generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r1",
        review_text: "It was okay",
      }),
      expect.objectContaining({
        name: "Default",
        tone: "friendly",
      }),
      "Test Location",
      "user@example.com",
    );
  });

  it("handles Claude API timeout error", async () => {
    vi.mocked(generateResponse).mockRejectedValue(
      new ClaudeAPIError(408, "Request timeout"),
    );

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      error: "AI response generation timed out",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Claude API error:",
      expect.objectContaining({
        status: 408,
        message: "Request timeout",
      }),
    );
  });

  it("handles Claude API rate limit error", async () => {
    vi.mocked(generateResponse).mockRejectedValue(
      new ClaudeAPIError(429, "Rate limit exceeded"),
    );

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Please try again later.",
    });
  });

  it("handles Claude API authentication error (401)", async () => {
    vi.mocked(generateResponse).mockRejectedValue(
      new ClaudeAPIError(401, "Invalid API key"),
    );

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "AI service configuration error",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Claude API error:",
      expect.objectContaining({
        status: 401,
        message: "Invalid API key",
      }),
    );
  });

  it("handles Claude API authorization error (403)", async () => {
    vi.mocked(generateResponse).mockRejectedValue(
      new ClaudeAPIError(403, "Forbidden"),
    );

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "AI service configuration error",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Claude API error:",
      expect.objectContaining({
        status: 403,
        message: "Forbidden",
      }),
    );
  });

  it("handles Claude API generic error (502)", async () => {
    vi.mocked(generateResponse).mockRejectedValue(
      new ClaudeAPIError(503, "Service unavailable"),
    );

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "AI service unavailable",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Claude API error:",
      expect.objectContaining({
        status: 503,
        message: "Service unavailable",
      }),
    );
  });

  it("handles database error when saving response", async () => {
    vi.mocked(generateResponse).mockResolvedValue({
      text: "Thank you!",
      tokensUsed: 50,
    });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Database error" },
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to save response",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Failed to save response:",
      expect.objectContaining({ message: "Database error" }),
    );
  });

  it("returns 500 when JSON parsing fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "invalid json",
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to generate response",
    });
    expect(console.error).toHaveBeenCalled();
  });

  it("returns 500 when Supabase client creation fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockRejectedValueOnce(
      new Error("Database connection failed"),
    );

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to generate response",
    });
    expect(console.error).toHaveBeenCalled();
  });

  it("returns 500 when checking existing response fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Database error" },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to check for existing response",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Failed to check for existing response:",
      expect.objectContaining({ message: "Database error" }),
    );
  });

  it("returns 400 when review text is only whitespace", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "   \n\t  ", // Only whitespace
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Cannot generate response for review without text",
    });
  });

  it("handles location voice profile fetch error gracefully", async () => {
    vi.mocked(generateResponse).mockResolvedValue({
      text: "Thank you!",
      tokensUsed: 50,
    });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: "vp-1",
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "resp-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Profile not found" },
                }),
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "vp-org-1",
                      organization_id: "org-1",
                      name: "Org Voice",
                      tone: "casual",
                      personality_notes: "Warm",
                      sign_off_style: "Thanks!",
                      example_responses: null,
                      words_to_use: null,
                      words_to_avoid: null,
                      max_length: 150,
                      created_at: "2025-01-01T00:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.spyOn(console, "warn").mockImplementation(() => {});

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    // Should fall back to org voice profile
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch location voice profile, using fallback:",
      expect.objectContaining({ message: "Profile not found" }),
    );
  });

  it("handles organization voice profile fetch error gracefully", async () => {
    vi.mocked(generateResponse).mockResolvedValue({
      text: "Thank you!",
      tokensUsed: 50,
    });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u1",
                    organization_id: "org-1",
                    email: "user@example.com",
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
                    id: "r1",
                    rating: 5,
                    reviewer_name: "John",
                    review_text: "Great!",
                    review_date: "2025-01-01T00:00:00Z",
                    reviewer_photo_url: null,
                    external_review_id: "ext-1",
                    platform: "google",
                    status: "pending",
                    sentiment: "positive",
                    has_response: false,
                    location_id: "loc-1",
                    created_at: "2025-01-01T00:00:00Z",
                    locations: {
                      id: "loc-1",
                      name: "Test Location",
                      organization_id: "org-1",
                      voice_profile_id: null,
                    },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "resp-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Database error" },
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.spyOn(console, "warn").mockImplementation(() => {});

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    // Should fall back to default voice profile
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch organization voice profile, using fallback:",
      expect.objectContaining({ message: "Database error" }),
    );
    expect(generateResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Default",
        tone: "friendly",
      }),
      "Test Location",
      "user@example.com",
    );
  });
});
