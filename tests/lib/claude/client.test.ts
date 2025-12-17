import { buildNegativeAddendum, generateResponse } from "@/lib/claude/client";
import type { Review, VoiceProfile } from "@/lib/supabase/types";

describe("lib/claude/client", () => {
  it("buildNegativeAddendum includes the contact email and guidance", () => {
    const text = buildNegativeAddendum("support@example.com");
    expect(text).toContain("support@example.com");
    expect(text).toContain("negative review");
    expect(text).toContain("Please reach out to us");
  });

  it("generateResponse returns a placeholder response (integration not implemented yet)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const review: Review = {
      id: "r1",
      location_id: null,
      platform: "google",
      external_review_id: "ext-r1",
      reviewer_name: "Sam",
      reviewer_photo_url: null,
      rating: 5,
      review_text: "Great service.",
      review_date: "2025-01-01T00:00:00.000Z",
      has_response: false,
      status: "new",
      sentiment: null,
      created_at: "2025-01-01T00:00:00.000Z",
    };

    const voiceProfile: VoiceProfile = {
      id: "vp1",
      organization_id: null,
      name: "Default Voice",
      tone: "friendly",
      personality_notes: null,
      example_responses: null,
      sign_off_style: null,
      words_to_use: null,
      words_to_avoid: null,
      max_length: 120,
      created_at: "2025-01-01T00:00:00.000Z",
    };

    const result = await generateResponse(review, voiceProfile, "Example Biz");

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


