import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

import { GET } from "@/app/api/reviews/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";

describe("GET /api/reviews", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 500 when Supabase client creation fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockRejectedValueOnce(
      new Error("Database connection failed"),
    );

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch reviews",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns empty results when user has no organization", async () => {
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
              data: { id: "user-1", organization_id: null },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviews: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  });

  it("returns empty results when user has no locations", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
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

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviews: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  });

  it("returns reviews with default pagination", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "rev-1",
                        external_review_id: "ext-1",
                        reviewer_name: "John",
                        reviewer_photo_url: null,
                        rating: 5,
                        review_text: "Great!",
                        review_date: "2025-01-15T10:00:00Z",
                        has_response: false,
                        status: "pending",
                        sentiment: "positive",
                        created_at: "2025-01-15T10:00:00Z",
                        location_id: "loc-1",
                        locations: {
                          id: "loc-1",
                          name: "Location 1",
                          google_location_id: "loc-1",
                        },
                      },
                    ],
                    count: 1,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({
      reviews: [
        {
          id: "rev-1",
          reviewer_name: "John",
          rating: 5,
          review_text: "Great!",
          location_name: "Location 1",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
  });

  it("applies status filter", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      count: 0,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews?status=pending",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reviews).toEqual([]);
  });

  it("applies rating filter", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      count: 0,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews?rating=5");
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("applies sentiment filter", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      count: 0,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews?sentiment=positive",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("applies location_id filter", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      count: 0,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews?location_id=loc-1",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("applies pagination with custom page and limit", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews?page=2&limit=10",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.page).toBe(2);
    expect(data.limit).toBe(10);
  });

  it("enforces max limit of 100", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews?limit=200");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.limit).toBe(100); // Max limit enforced
  });

  it("returns 500 when locations query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
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

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch reviews",
    });
  });

  it("returns 500 when reviews query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: null,
                    count: null,
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

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch reviews",
    });
  });

  it("transforms reviews with location names", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "rev-1",
                        external_review_id: "ext-1",
                        reviewer_name: "Jane",
                        reviewer_photo_url: null,
                        rating: 4,
                        review_text: "Good service",
                        review_date: "2025-01-15T10:00:00Z",
                        has_response: true,
                        status: "responded",
                        sentiment: "positive",
                        created_at: "2025-01-15T10:00:00Z",
                        location_id: "loc-1",
                        locations: {
                          id: "loc-1",
                          name: "Downtown Location",
                          google_location_id: "loc-1",
                        },
                      },
                    ],
                    count: 1,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reviews[0]).toMatchObject({
      id: "rev-1",
      reviewer_name: "Jane",
      location_name: "Downtown Location",
    });
  });

  it("ignores invalid status filter values", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews?status=invalid",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    // Invalid status should be ignored, no filter applied
  });

  it("ignores invalid rating filter values", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews?rating=10");
    const response = await GET(request);

    expect(response.status).toBe(200);
    // Rating 10 is out of range, should be ignored
  });

  it("ignores rating filter when not a number", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews?rating=abc");
    const response = await GET(request);

    expect(response.status).toBe(200);
    // Non-numeric rating should be ignored
  });

  it("ignores invalid sentiment filter values", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews?sentiment=invalid",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    // Invalid sentiment should be ignored
  });

  it("ignores location_id filter when location doesn't belong to org", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }], // Only loc-1 belongs to org
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/api/reviews?location_id=loc-2",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    // loc-2 doesn't belong to org, filter should be ignored
  });

  it("handles pagination with page 0", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews?page=0");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.page).toBe(1); // Should default to 1
  });

  it("handles pagination with negative page", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews?page=-5");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.page).toBe(1); // Should default to 1
  });

  it("handles limit with 0 or negative values", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    count: 0,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews?limit=0");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.limit).toBe(20); // Should default to 20
  });

  it("handles reviews with null location names", async () => {
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
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "loc-1" }],
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          const queryChain = {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "rev-1",
                        external_review_id: "ext-1",
                        reviewer_name: "John",
                        reviewer_photo_url: null,
                        rating: 5,
                        review_text: "Great!",
                        review_date: "2025-01-15T10:00:00Z",
                        has_response: false,
                        status: "pending",
                        sentiment: "positive",
                        created_at: "2025-01-15T10:00:00Z",
                        location_id: "loc-1",
                        locations: null, // Null location
                      },
                    ],
                    count: 1,
                    error: null,
                  }),
                }),
              }),
            }),
          };
          return queryChain;
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reviews[0].location_name).toBe("Unknown Location");
  });

  it("handles user lookup error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
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
              error: { message: "Database error" },
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/reviews");
    const response = await GET(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "User not found",
    });
  });
});
