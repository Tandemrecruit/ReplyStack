import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GET } from "@/app/api/reviews/route";

describe("GET /api/reviews", () => {
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
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "u1" } } }),
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


