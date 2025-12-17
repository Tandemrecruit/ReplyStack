import { POST } from "@/app/api/webhooks/stripe/route";
import { makeNextRequest } from "@/tests/helpers/next";

describe("POST /api/webhooks/stripe", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    const request = makeNextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ type: "event" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing stripe-signature header",
    });
  });

  it("returns received:true when stripe-signature header is present", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const request = makeNextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": "t=123,v1=sig",
      },
      body: JSON.stringify({ type: "event" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });

    warnSpy.mockRestore();
  });
});
