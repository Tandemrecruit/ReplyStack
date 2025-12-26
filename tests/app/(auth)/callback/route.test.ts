import { randomBytes } from "node:crypto";
import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

import { GET } from "@/app/(auth)/callback/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Generate a valid test encryption key (32 bytes = 64 hex chars)
const TEST_ENCRYPTION_KEY = randomBytes(32).toString("hex");

describe("GET /auth/callback", () => {
  beforeEach(() => {
    // Set up encryption key for tests that store tokens
    process.env.TOKEN_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TOKEN_ENCRYPTION_KEY;
  });

  it("redirects to /dashboard when no code is present", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn(),
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
          data: { session: null },
          error: null,
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

  it("stores Google refresh token encrypted when provider_refresh_token is present", async () => {
    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: "mock-access-token",
              user: {
                id: "user-1",
                email: "user@example.com",
              },
              provider_refresh_token: "google-refresh-token",
            },
          },
          error: null,
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

    // Verify upsert was called with encrypted token
    expect(mockSupabase.from).toHaveBeenCalledWith("users");
    const fromCallResult = vi.mocked(mockSupabase.from).mock.results[0];
    if (!fromCallResult?.value) {
      throw new Error("Expected from() to return a value");
    }
    const upsertCall = fromCallResult.value.upsert as ReturnType<typeof vi.fn>;
    expect(upsertCall).toHaveBeenCalled();

    // Get the actual call arguments
    const callArgs = upsertCall.mock.calls[0];
    if (!callArgs) {
      throw new Error("Expected upsert() to be called with arguments");
    }
    const userData = callArgs[0] as {
      id: string;
      email: string;
      google_refresh_token: string;
    };

    expect(userData.id).toBe("user-1");
    expect(userData.email).toBe("user@example.com");

    // Token should be encrypted (base64 encoded, not plaintext)
    expect(userData.google_refresh_token).not.toBe("google-refresh-token");
    // Should be valid base64
    expect(userData.google_refresh_token).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("continues redirect even if token storage fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: "mock-access-token",
              user: {
                id: "user-1",
                email: "user@example.com",
              },
              provider_refresh_token: "google-refresh-token",
            },
          },
          error: null,
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
          data: { session: null },
          error: null,
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
          data: {
            session: {
              access_token: "mock-access-token",
              user: {
                id: "user-1",
                email: "user@example.com",
              },
            },
          },
          error: null,
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
          data: { session: null },
          error: null,
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
