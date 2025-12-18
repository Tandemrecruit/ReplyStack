import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

import { POST } from "@/app/api/responses/route";
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

  it("returns placeholder response when authenticated and reviewId is provided", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "r1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "placeholder",
      reviewId: "r1",
      generatedText: "AI response generation coming soon...",
      status: "draft",
    });
    expect(console.warn).toHaveBeenCalledWith(
      "Response generation not yet implemented",
      { reviewId: "r1" },
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

  it("handles reviewId with special characters", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewId: "review-123_abc" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      reviewId: "review-123_abc",
    });
  });

  it("handles additional fields in request body", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/responses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reviewId: "r1",
        extraField: "ignored",
        anotherField: 123,
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      reviewId: "r1",
    });
  });
});
