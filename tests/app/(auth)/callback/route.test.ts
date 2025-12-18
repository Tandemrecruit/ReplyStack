import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

import { GET } from "@/app/(auth)/callback/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";

describe("GET /auth/callback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects to /dashboard when no code is present", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn(),
        getSession: vi.fn(),
      },
    } as never);

    const request = makeNextRequest("http://localhost/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307); // Redirect
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects to /dashboard with next parameter when no code", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn(),
        getSession: vi.fn(),
      },
    } as never);

    const request = makeNextRequest(
      "http://localhost/auth/callback?next=/settings",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/settings");
  });

  it("redirects to /login with error when code exchange fails", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: { message: "Invalid code" },
        }),
        getSession: vi.fn(),
      },
    } as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = makeNextRequest(
      "http://localhost/auth/callback?code=invalid-code",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login?error=");
    expect(location).toContain("Invalid%20code");
  });

  it("redirects to /dashboard after successful code exchange", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
        }),
      },
    } as never);

    const request = makeNextRequest(
      "http://localhost/auth/callback?code=valid-code",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("stores Google refresh token when provider_refresh_token is present", async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: "user-1",
                email: "user@example.com",
              },
              provider_refresh_token: "google-refresh-token",
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/auth/callback?code=valid-code",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");

    // Verify upsert was called with correct data
    expect(mockSupabase.from).toHaveBeenCalledWith("users");
    const upsertCall = vi.mocked(mockSupabase.from).mock.results[0].value
      .upsert as ReturnType<typeof vi.fn>;
    expect(upsertCall).toHaveBeenCalledWith(
      {
        id: "user-1",
        email: "user@example.com",
        google_refresh_token: "google-refresh-token",
      },
      { onConflict: "id" },
    );
  });

  it("continues redirect even if token storage fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: "user-1",
                email: "user@example.com",
              },
              provider_refresh_token: "google-refresh-token",
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          error: { message: "Database error" },
        }),
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest(
      "http://localhost/auth/callback?code=valid-code",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
    expect(console.error).toHaveBeenCalledWith(
      "Failed to store Google refresh token:",
      "Database error",
    );
  });

  it("redirects to custom next path after successful exchange", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
        }),
      },
    } as never);

    const request = makeNextRequest(
      "http://localhost/auth/callback?code=valid-code&next=/reviews",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/reviews");
  });

  it("handles session without provider_refresh_token", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: "user-1",
                email: "user@example.com",
              },
            },
          },
        }),
      },
    } as never);

    const request = makeNextRequest(
      "http://localhost/auth/callback?code=valid-code",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("handles null session", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
        }),
      },
    } as never);

    const request = makeNextRequest(
      "http://localhost/auth/callback?code=valid-code",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });
});
