import { buildNegativeAddendum, generateResponse } from "@/lib/claude/client";

describe("lib/claude/client", () => {
  it("buildNegativeAddendum includes the contact email and guidance", () => {
    const text = buildNegativeAddendum("support@example.com");
    expect(text).toContain("support@example.com");
    expect(text).toContain("negative review");
    expect(text).toContain("Please reach out to us");
  });

  it("generateResponse returns a placeholder response (integration not implemented yet)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const review = {
      id: "r1",
      rating: 5,
      reviewer_name: "Sam",
      review_text: "Great service.",
      review_date: "2025-01-01T00:00:00.000Z",
    };

    const voiceProfile = {
      id: "vp1",
      tone: "friendly",
      personality_notes: null,
      example_responses: null,
      sign_off_style: null,
      words_to_use: null,
      words_to_avoid: null,
      max_length: 120,
    };

    const result = await generateResponse(
      review as never,
      voiceProfile as never,
      "Example Biz",
    );

    expect(result).toEqual({
      text: "AI response generation coming soon...",
      tokensUsed: 0,
    });
    expect(warn).toHaveBeenCalledWith(
      "Claude API not implemented",
      expect.objectContaining({
        reviewId: "r1",
      }),
    );
  });
});


