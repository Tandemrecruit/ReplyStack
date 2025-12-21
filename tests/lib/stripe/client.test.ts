/**
 * @vitest-environment node
 */

import {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  verifyWebhookSignature,
} from "@/lib/stripe/client";

describe("lib/stripe/client", () => {
  it("createCheckoutSession throws until implemented", async () => {
    await expect(
      createCheckoutSession(
        "cus_123",
        "price_123",
        "https://ok",
        "https://nope",
      ),
    ).rejects.toThrow("Not implemented");
  });

  it("createPortalSession throws until implemented", async () => {
    await expect(
      createPortalSession("cus_123", "https://return"),
    ).rejects.toThrow("Not implemented");
  });

  it("getSubscriptionStatus defaults to none until implemented", async () => {
    await expect(getSubscriptionStatus("cus_123")).resolves.toEqual({
      status: "none",
    });
  });

  it("verifyWebhookSignature returns false until implemented", () => {
    expect(verifyWebhookSignature("{}", "sig")).toBe(false);
  });
});
