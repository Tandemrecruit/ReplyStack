/**
 * @vitest-environment node
 */

import { buildNegativeAddendum, generateResponse } from "@/lib/claude/client";
import type { Review, VoiceProfile } from "@/lib/supabase/types";

describe("lib/claude/client", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-api-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }
    global.fetch = originalFetch;
  });

  it("buildNegativeAddendum includes the contact email and guidance", () => {
    const text = buildNegativeAddendum("support@example.com");
    expect(text).toContain("support@example.com");
    expect(text).toContain("negative review");
    expect(text).toContain("Please reach out to us");
  });

  it("generateResponse calls Claude API and returns generated response", async () => {
    // Mock fetch response
    const mockResponse = {
      ok: true,
      json: async () => ({
        id: "msg-123",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: "Thank you for your review!" }],
        model: "claude-haiku-4-5-20251001",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 100,
          output_tokens: 20,
        },
      }),
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

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
      text: "Thank you for your review!",
      tokensUsed: 120,
    });
    expect(global.fetch).toHaveBeenCalled();
  });
});
