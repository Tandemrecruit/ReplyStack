import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

import { GET, PUT } from "@/app/api/notifications/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";

describe("GET /api/notifications", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns default emailNotifications true when no preferences exist", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      emailNotifications: true,
    });
  });

  it("returns emailNotifications from database when preferences exist", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { user_id: "user-1", email_enabled: false },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      emailNotifications: false,
    });
  });

  it("returns 500 when database query fails", async () => {
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
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to load notification preferences",
    });
  });
});

describe("PUT /api/notifications", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ emailNotifications: true }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when emailNotifications is not a boolean", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ emailNotifications: "true" }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "emailNotifications must be a boolean",
    });
  });

  it("returns 400 when emailNotifications is missing", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/notifications", {
      method: "PUT",
      body: JSON.stringify({}),
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "emailNotifications must be a boolean",
    });
  });

  it("updates notification preferences successfully", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ emailNotifications: false }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      emailNotifications: false,
    });
  });

  it("handles invalid JSON gracefully", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/notifications", {
      method: "PUT",
      body: "invalid json",
    });
    const response = await PUT(request);

    // Should default to empty object and fail validation
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "emailNotifications must be a boolean",
    });
  });

  it("returns 500 when database update fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ emailNotifications: true }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to update notification preferences",
    });
  });
});
