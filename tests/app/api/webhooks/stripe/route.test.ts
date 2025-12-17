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

  it("returns 500 and logs when request processing fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const request = makeNextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": "t=123,v1=sig",
      },
      body: JSON.stringify({ type: "event" }),
    });
    (request as unknown as { text: () => Promise<string> }).text = vi
      .fn()
      .mockRejectedValue(new Error("test failure"));

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Webhook handler failed",
    });

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
