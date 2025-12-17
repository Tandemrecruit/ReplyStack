import {
  fetchAccounts,
  fetchLocations,
  fetchReviews,
  GOOGLE_API_BASE,
  publishResponse,
  refreshAccessToken,
} from "@/lib/google/client";

describe("lib/google/client", () => {
  it("refreshAccessToken throws until implemented", async () => {
    await expect(refreshAccessToken("refresh-token")).rejects.toThrow(
      "Not implemented",
    );
  });

  it("fetchAccounts returns an empty list and warns", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const accounts = await fetchAccounts("access-token");
    expect(accounts).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith("fetchAccounts not implemented", {
      api: GOOGLE_API_BASE,
    });

    warnSpy.mockRestore();
  });

  it("fetchLocations returns an empty list until implemented", async () => {
    const locations = await fetchLocations("access-token", "acc-1");
    expect(locations).toEqual([]);
  });

  it("fetchReviews returns an empty payload until implemented", async () => {
    const result = await fetchReviews("access-token", "acc-1", "loc-1");
    expect(result).toEqual({ reviews: [] });
  });

  it("publishResponse returns false until implemented", async () => {
    const ok = await publishResponse("access-token", "review-1", "Thanks!");
    expect(ok).toBe(false);
  });
});
