/**
 * @vitest-environment node
 */

import {
  buildNegativeAddendum,
  ClaudeAPIError,
  generateResponse,
} from "@/lib/claude/client";
import type { Review, VoiceProfile } from "@/lib/supabase/types";

describe("lib/claude/client", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-api-key";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }
    global.fetch = originalFetch;
  });

  const createMockReview = (overrides?: Partial<Review>): Review => ({
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
    ...overrides,
  });

  const createMockVoiceProfile = (
    overrides?: Partial<VoiceProfile>,
  ): VoiceProfile => ({
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
    ...overrides,
  });

  const createSuccessResponse = (
    text: string,
    inputTokens = 100,
    outputTokens = 20,
  ) => ({
    ok: true,
    json: async () => ({
      id: "msg-123",
      type: "message",
      role: "assistant",
      content: [{ type: "text", text }],
      model: "claude-haiku-4-5-20251001",
      stop_reason: "end_turn",
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      },
    }),
  });

  describe("buildNegativeAddendum", () => {
    it("includes the contact email and guidance", () => {
      const text = buildNegativeAddendum("support@example.com");
      expect(text).toContain("support@example.com");
      expect(text).toContain("negative review");
      expect(text).toContain("Please reach out to us");
      expect(text).toContain("CRITICAL");
      expect(text).toContain("structure");
    });
  });

  describe("generateResponse", () => {
    describe("success cases", () => {
      it("calls Claude API and returns generated response", async () => {
        const mockResponse = createSuccessResponse(
          "Thank you for your review!",
        );

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        const result = await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        );

        expect(result).toEqual({
          text: "Thank you for your review!",
          tokensUsed: 120,
        });
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it("includes negative review addendum when contactEmail is provided", async () => {
        const mockResponse = createSuccessResponse(
          "Thank you for your feedback.",
        );

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ rating: 1 });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
          "support@example.com",
        );

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.messages[0].content).toContain("support@example.com");
        expect(body.messages[0].content).toContain("negative review");
      });

      it("does not include negative review addendum when contactEmail is not provided", async () => {
        const mockResponse = createSuccessResponse(
          "Thank you for your feedback.",
        );

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ rating: 1 });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.messages[0].content).not.toContain("support@example.com");
      });

      it("truncates review text longer than MAX_REVIEW_TEXT_LENGTH", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const longText = "a".repeat(15000);
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ review_text: longText });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        const userPrompt = body.messages[0].content;
        expect(userPrompt.length).toBeLessThan(15000);
        expect(userPrompt).toContain("... [Review truncated due to length]");
        expect(console.warn).toHaveBeenCalledWith(
          "Review text truncated:",
          expect.objectContaining({
            reviewId: "r1",
            originalLength: 15000,
            truncatedLength: 10000,
          }),
        );
      });

      it("handles null review text", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ review_text: null });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.messages[0].content).toContain("No review text");
      });

      it("handles empty review text", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ review_text: "" });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(review, voiceProfile, "Example Biz");

        expect(global.fetch).toHaveBeenCalled();
      });

      it("uses default values for missing voice profile fields", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile({
          personality_notes: null,
          sign_off_style: null,
          example_responses: null,
          words_to_use: null,
          words_to_avoid: null,
        });

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        const systemPrompt = body.system;
        expect(systemPrompt).toContain("Professional and friendly");
      });

      it("includes all voice profile fields in system prompt", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile({
          tone: "professional",
          personality_notes: "Warm and helpful",
          sign_off_style: "Best regards",
          example_responses: ["Example 1", "Example 2"],
          words_to_use: ["appreciate", "thank you"],
          words_to_avoid: ["sorry", "inconvenience"],
          max_length: 200,
        });

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        const systemPrompt = body.system;
        expect(systemPrompt).toContain("professional");
        expect(systemPrompt).toContain("Warm and helpful");
        expect(systemPrompt).toContain("Best regards");
        expect(systemPrompt).toContain("Example 1");
        expect(systemPrompt).toContain("Example 2");
        expect(systemPrompt).toContain("appreciate");
        expect(systemPrompt).toContain("thank you");
        expect(systemPrompt).toContain("sorry");
        expect(systemPrompt).toContain("inconvenience");
        expect(systemPrompt).toContain("200 words");
      });
    });

    describe("error cases", () => {
      it("throws ClaudeAPIError when ANTHROPIC_API_KEY is missing", async () => {
        // Use real timers for this test since it throws immediately
        vi.useRealTimers();
        delete process.env.ANTHROPIC_API_KEY;

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        const error = await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        ).catch((e) => e);
        expect(error).toBeInstanceOf(ClaudeAPIError);
        expect(error.message).toBe("AI service not configured");
        expect(error.status).toBe(500);
      });

      it("throws ClaudeAPIError on 401 status without retry", async () => {
        const mockResponse = {
          ok: false,
          status: 401,
          json: async () => ({
            error: { message: "Invalid API key" },
          }),
        };

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        const error = await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        ).catch((e) => e);
        expect(error).toBeInstanceOf(ClaudeAPIError);
        expect(error.status).toBe(401);
        expect(global.fetch).toHaveBeenCalledTimes(1); // No retry
      });

      it("throws ClaudeAPIError on 403 status without retry", async () => {
        const mockResponse = {
          ok: false,
          status: 403,
          json: async () => ({
            error: { message: "Forbidden" },
          }),
        };

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        const error = await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        ).catch((e) => e);
        expect(error).toBeInstanceOf(ClaudeAPIError);
        expect(error.status).toBe(403);
        expect(global.fetch).toHaveBeenCalledTimes(1); // No retry
      });

      it("throws ClaudeAPIError on 429 status without retry", async () => {
        const mockResponse = {
          ok: false,
          status: 429,
          json: async () => ({
            error: { message: "Rate limit exceeded" },
          }),
        };

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        const error = await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        ).catch((e) => e);
        expect(error).toBeInstanceOf(ClaudeAPIError);
        expect(error.status).toBe(429);
        expect(global.fetch).toHaveBeenCalledTimes(1); // No retry
      });

      it("retries on 500 error with exponential backoff", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const mockErrorResponse = {
          ok: false,
          status: 500,
          json: async () => ({
            error: { message: "Internal server error" },
          }),
        };
        const mockSuccessResponse = createSuccessResponse(
          "Success after retry",
        );

        global.fetch = vi
          .fn()
          .mockResolvedValueOnce(mockErrorResponse)
          .mockResolvedValueOnce(mockSuccessResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        const resultPromise = generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        );

        // Advance timer by 1 second (first retry backoff)
        await vi.advanceTimersByTimeAsync(1000);

        const result = await resultPromise;

        expect(result.text).toBe("Success after retry");
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(console.warn).toHaveBeenCalledWith(
          "Claude API attempt failed:",
          expect.objectContaining({
            attempt: 1,
            maxAttempts: 2,
            status: 500,
          }),
        );
      });

      it("throws after max attempts exhausted", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const mockErrorResponse = {
          ok: false,
          status: 500,
          json: async () => ({
            error: { message: "Internal server error" },
          }),
        };

        global.fetch = vi.fn().mockResolvedValue(mockErrorResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        // Capture result/error immediately to prevent unhandled rejection
        const resultPromise = generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        ).then(
          (result) => ({ success: true as const, result }),
          (error) => ({ success: false as const, error }),
        );

        // Advance timers to complete all retry attempts
        // First attempt happens immediately, then 1s backoff, then second attempt
        await vi.advanceTimersByTimeAsync(2000);

        const outcome = await resultPromise;

        expect(outcome.success).toBe(false);
        if (!outcome.success) {
          expect(outcome.error).toBeInstanceOf(ClaudeAPIError);
          expect(outcome.error.status).toBe(500);
        }
        expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
      });

      it("throws ClaudeAPIError on timeout", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        // Mock fetch to never resolve but handle abort signal
        global.fetch = vi
          .fn()
          .mockImplementation((_url: string, options?: RequestInit) => {
            return new Promise((_, reject) => {
              if (options?.signal) {
                // Check if already aborted
                if (options.signal.aborted) {
                  const abortError = new Error("Aborted");
                  abortError.name = "AbortError";
                  reject(abortError);
                  return;
                }
                // Listen for abort
                options.signal.addEventListener(
                  "abort",
                  () => {
                    const abortError = new Error("Aborted");
                    abortError.name = "AbortError";
                    reject(abortError);
                  },
                  { once: true },
                );
              }
            });
          });

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        // Capture result/error immediately to prevent unhandled rejection
        const resultPromise = generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        ).then(
          (result) => ({ success: true as const, result }),
          (error) => ({ success: false as const, error }),
        );

        // Advance timer past both timeout attempts (30s each + 1s backoff between)
        // First timeout: 30000ms, backoff: 1000ms, second timeout: 30000ms
        await vi.advanceTimersByTimeAsync(62000);

        const outcome = await resultPromise;

        expect(outcome.success).toBe(false);
        if (!outcome.success) {
          expect(outcome.error).toBeInstanceOf(ClaudeAPIError);
          expect(outcome.error.status).toBe(408);
          expect(outcome.error.message).toBe("Request timed out");
        }
      }, 10000);

      it("handles network errors", async () => {
        const networkError = new Error("Network error");
        global.fetch = vi.fn().mockRejectedValue(networkError);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        await expect(
          generateResponse(review, voiceProfile, "Example Biz"),
        ).rejects.toThrow("Network error");
      });

      it("handles malformed JSON error response", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const mockResponse = {
          ok: false,
          status: 500,
          json: async () => {
            throw new Error("Invalid JSON");
          },
        };

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        // Capture result/error immediately to prevent unhandled rejection
        const resultPromise = generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        ).then(
          (result) => ({ success: true as const, result }),
          (error) => ({ success: false as const, error }),
        );

        // Advance timers to complete all retry attempts
        await vi.advanceTimersByTimeAsync(2000);

        const outcome = await resultPromise;

        expect(outcome.success).toBe(false);
        if (!outcome.success) {
          expect(outcome.error).toBeInstanceOf(ClaudeAPIError);
          expect(outcome.error.status).toBe(500);
          expect(outcome.error.message).toBe("Claude API request failed");
        }
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it("handles error response without error message", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const mockResponse = {
          ok: false,
          status: 500,
          json: async () => ({}),
        };

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        // Capture result/error immediately to prevent unhandled rejection
        const resultPromise = generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        ).then(
          (result) => ({ success: true as const, result }),
          (error) => ({ success: false as const, error }),
        );

        // Advance timers to complete all retry attempts
        await vi.advanceTimersByTimeAsync(2000);

        const outcome = await resultPromise;

        expect(outcome.success).toBe(false);
        if (!outcome.success) {
          expect(outcome.error).toBeInstanceOf(ClaudeAPIError);
          expect(outcome.error.status).toBe(500);
          expect(outcome.error.message).toBe("Claude API request failed");
        }
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it("handles non-AbortError in fetchWithTimeout", async () => {
        const fetchError = new Error("Network failure");
        global.fetch = vi.fn().mockRejectedValue(fetchError);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        await expect(
          generateResponse(review, voiceProfile, "Example Biz"),
        ).rejects.toThrow("Network failure");
      });
    });

    describe("API request format", () => {
      it("sends correct request format to Claude API", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        expect(fetchCall?.[0]).toBe("https://api.anthropic.com/v1/messages");
        expect(fetchCall?.[1].method).toBe("POST");
        expect(fetchCall?.[1].headers).toEqual({
          "Content-Type": "application/json",
          "x-api-key": "test-api-key",
          "anthropic-version": "2023-06-01",
        });

        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.model).toBe("claude-haiku-4-5-20251001");
        expect(body.max_tokens).toBe(500);
        expect(typeof body.system).toBe("string");
        expect(body.system.length).toBeGreaterThan(0);
        expect(body.messages).toHaveLength(1);
        expect(body.messages[0].role).toBe("user");
        expect(typeof body.messages[0].content).toBe("string");
        expect(body.messages[0].content.length).toBeGreaterThan(0);
      });
    });

    describe("response parsing", () => {
      it("handles empty content array in API response", async () => {
        const mockResponse = {
          ok: true,
          json: async () => ({
            id: "msg-123",
            type: "message",
            role: "assistant",
            content: [],
            model: "claude-haiku-4-5-20251001",
            stop_reason: "end_turn",
            usage: {
              input_tokens: 100,
              output_tokens: 20,
            },
          }),
        };

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        const result = await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        );

        expect(result.text).toBe("");
        expect(result.tokensUsed).toBe(120);
      });

      it("handles missing text in content array", async () => {
        const mockResponse = {
          ok: true,
          json: async () => ({
            id: "msg-123",
            type: "message",
            role: "assistant",
            content: [{ type: "text" }],
            model: "claude-haiku-4-5-20251001",
            stop_reason: "end_turn",
            usage: {
              input_tokens: 100,
              output_tokens: 20,
            },
          }),
        };

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile();

        const result = await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
        );

        expect(result.text).toBe("");
        expect(result.tokensUsed).toBe(120);
      });
    });

    describe("review handling", () => {
      it("handles review with null rating", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ rating: null });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.messages[0].content).toContain("Unknown");
      });

      it("handles review with rating 2 (negative)", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ rating: 2 });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
          "support@example.com",
        );

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.messages[0].content).toContain("negative review");
      });

      it("handles review with rating 3 (not negative)", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ rating: 3 });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(
          review,
          voiceProfile,
          "Example Biz",
          "support@example.com",
        );

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.messages[0].content).not.toContain("negative review");
      });

      it("handles review with null review_date", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ review_date: null });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.messages[0].content).toContain("Unknown date");
      });

      it("handles review with null reviewer_name", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({ reviewer_name: null });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.messages[0].content).toContain("Anonymous");
      });

      it("formats review date correctly", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview({
          review_date: "2025-03-15T10:30:00.000Z",
        });
        const voiceProfile = createMockVoiceProfile();

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        expect(body.messages[0].content).toContain("March");
        expect(body.messages[0].content).toContain("2025");
      });
    });

    describe("voice profile handling", () => {
      it("handles voice profile with empty arrays", async () => {
        const mockResponse = createSuccessResponse("Response");

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const review = createMockReview();
        const voiceProfile = createMockVoiceProfile({
          example_responses: [],
          words_to_use: [],
          words_to_avoid: [],
        });

        await generateResponse(review, voiceProfile, "Example Biz");

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(fetchCall).toBeDefined();
        const body = JSON.parse(fetchCall?.[1].body as string);
        const systemPrompt = body.system;
        expect(systemPrompt).toContain("EXAMPLES OF RESPONSES THEY LIKE:");
        expect(systemPrompt).toContain("Never use:");
        expect(systemPrompt).toContain("Prefer using:");
      });
    });
  });
});
