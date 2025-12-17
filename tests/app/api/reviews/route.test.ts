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

  it("returns placeholder payload when authenticated", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const request = makeNextRequest(
      "http://localhost/api/reviews?status=pending&rating=5",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviews: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  });
});
