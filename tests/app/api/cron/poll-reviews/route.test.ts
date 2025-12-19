import { GET } from "@/app/api/cron/poll-reviews/route";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => ({
  createAdminSupabaseClient: vi.fn(),
}));

describe("GET /api/cron/poll-reviews", () => {
  let originalCronSecret: string | undefined;
  let originalSupabaseUrl: string | undefined;
  let originalServiceRoleKey: string | undefined;

  beforeEach(() => {
    originalCronSecret = process.env.CRON_SECRET;
    originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
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
    vi.restoreAllMocks();
  });

  it("returns 401 when CRON_SECRET is set and authorization is invalid", async () => {
    process.env.CRON_SECRET = "secret";

    const request = makeNextRequest("http://localhost/api/cron/poll-reviews", {
      headers: {
        authorization: "Bearer wrong",
      },
    });
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

    vi.mocked(createAdminSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    } as never);

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

    vi.mocked(createAdminSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/cron/poll-reviews", {
      headers: {
        authorization: "Bearer secret",
      },
    });
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
