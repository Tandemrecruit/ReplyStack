import { makeNextRequest } from "@/tests/helpers/next";
import { GET } from "@/app/api/cron/poll-reviews/route";

describe("GET /api/cron/poll-reviews", () => {
  it("returns 401 when CRON_SECRET is set and authorization is missing/invalid", async () => {
    const original = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "secret";

    const request = makeNextRequest("http://localhost/api/cron/poll-reviews", {
      headers: {
        authorization: "Bearer wrong",
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });

    if (original) process.env.CRON_SECRET = original;
    else delete process.env.CRON_SECRET;
  });

  it("allows execution when CRON_SECRET is unset", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const original = process.env.CRON_SECRET;
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

    if (original) process.env.CRON_SECRET = original;
  });

  it("allows execution when CRON_SECRET matches authorization", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const original = process.env.CRON_SECRET;
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

    if (original) process.env.CRON_SECRET = original;
    else delete process.env.CRON_SECRET;
  });
});


