import { GET } from "@/app/api/cron/poll-reviews/route";
import { makeNextRequest } from "@/tests/helpers/next";

describe("GET /api/cron/poll-reviews", () => {
  let originalCronSecret: string | undefined;

  beforeEach(() => {
    originalCronSecret = process.env.CRON_SECRET;
  });

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
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

    const request = makeNextRequest("http://localhost/api/cron/poll-reviews");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining("not yet implemented"),
        timestamp: expect.any(String),
      }),
    );
  });

  it("allows execution when CRON_SECRET matches authorization", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.CRON_SECRET = "secret";

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
