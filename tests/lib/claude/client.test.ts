/**
 * @vitest-environment node
 */

import {
  buildNegativeAddendum,
  ClaudeAPIError,
  generateResponse,
} from "@/lib/claude/client";
import {
  createMockReview,
  createMockVoiceProfile,
} from "@/tests/helpers/fixtures";

describe("lib/claude/client", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  let mockFetch: ReturnType<typeof vi.fn>;

  // Local helper to get parsed body from fetch mock
  function getRequestBody<T>(): T {
    if (mockFetch.mock.calls.length === 0) {
      throw new Error(
        "getRequestBody: no fetch calls recorded. Ensure the function under test has been called and mockFetch has been invoked.",
      );
    }
    const call = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const options = call?.[1] as RequestInit | undefined;
    if (!options?.body) {
      throw new Error(
        "getRequestBody: fetch call exists but request body is missing or undefined.",
      );
    }
    return JSON.parse(options.body as string) as T;
  }

  // Helper to create a successful Claude response
  function createSuccessResponse(
    text: string,
    inputTokens = 100,
    outputTokens = 20,
  ) {
    return {
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
    };
  }

  // Helper to create an error response
  function createErrorResponse(status: number, message?: string) {
    return {
      ok: false,
      status,
      json: async () => ({
        error: { message: message ?? "Error" },
      }),
    };
  }

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-api-key";
    mockFetch = vi.fn();
    global.fetch = mockFetch as typeof fetch;
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
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
        mockFetch.mockResolvedValue(
          createSuccessResponse("Thank you for your review!"),
        );

        const result = await generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
        );

        expect(result).toEqual({
          text: "Thank you for your review!",
          tokensUsed: 120,
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it("includes negative review addendum when contactEmail is provided for low rating", async () => {
        mockFetch.mockResolvedValue(createSuccessResponse("Thank you."));

        await generateResponse(
          createMockReview({ rating: 1 }),
          createMockVoiceProfile(),
          "Example Biz",
          "support@example.com",
        );

        const body = getRequestBody<{ messages: Array<{ content: string }> }>();
        expect(body.messages[0]?.content).toContain("support@example.com");
        expect(body.messages[0]?.content).toContain("negative review");
      });

      it("does not include negative addendum for rating >= 3", async () => {
        mockFetch.mockResolvedValue(createSuccessResponse("Thank you."));

        await generateResponse(
          createMockReview({ rating: 3 }),
          createMockVoiceProfile(),
          "Example Biz",
          "support@example.com",
        );

        const body = getRequestBody<{ messages: Array<{ content: string }> }>();
        expect(body.messages[0]?.content).not.toContain("negative review");
      });

      it("truncates review text longer than MAX_REVIEW_TEXT_LENGTH", async () => {
        const longText = "a".repeat(15000);
        mockFetch.mockResolvedValue(createSuccessResponse("Response"));

        await generateResponse(
          createMockReview({ review_text: longText }),
          createMockVoiceProfile(),
          "Example Biz",
        );

        const body = getRequestBody<{ messages: Array<{ content: string }> }>();
        expect(body.messages[0]?.content.length).toBeLessThan(15000);
        expect(body.messages[0]?.content).toContain(
          "... [Review truncated due to length]",
        );
      });

      it.each([
        { review_text: null, desc: "null" },
        { review_text: "", desc: "empty" },
      ])("handles $desc review text", async ({ review_text }) => {
        mockFetch.mockResolvedValue(createSuccessResponse("Response"));

        await generateResponse(
          createMockReview({ review_text }),
          createMockVoiceProfile(),
          "Example Biz",
        );

        expect(mockFetch).toHaveBeenCalled();
      });

      it("uses default values for missing voice profile fields", async () => {
        mockFetch.mockResolvedValue(createSuccessResponse("Response"));

        await generateResponse(
          createMockReview(),
          createMockVoiceProfile({
            personality_notes: null,
            sign_off_style: null,
            example_responses: null,
            words_to_use: null,
            words_to_avoid: null,
          }),
          "Example Biz",
        );

        const body = getRequestBody<{ system: string }>();
        expect(body.system).toContain("Professional and friendly");
      });

      it("includes all voice profile fields in system prompt", async () => {
        mockFetch.mockResolvedValue(createSuccessResponse("Response"));

        await generateResponse(
          createMockReview(),
          createMockVoiceProfile({
            tone: "professional",
            personality_notes: "Warm and helpful",
            sign_off_style: "Best regards",
            example_responses: ["Example 1", "Example 2"],
            words_to_use: ["appreciate", "thank you"],
            words_to_avoid: ["sorry", "inconvenience"],
            max_length: 200,
          }),
          "Example Biz",
        );

        const body = getRequestBody<{ system: string }>();
        expect(body.system).toContain("professional");
        expect(body.system).toContain("Warm and helpful");
        expect(body.system).toContain("Best regards");
        expect(body.system).toContain("Example 1");
        expect(body.system).toContain("200 words");
      });

      it("includes custom tone enhanced context when provided", async () => {
        mockFetch.mockResolvedValue(createSuccessResponse("Response"));

        await generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
          undefined,
          "This is enhanced context from custom tone quiz",
        );

        const body = getRequestBody<{ system: string }>();
        expect(body.system).toContain("CUSTOM TONE GUIDANCE:");
        expect(body.system).toContain(
          "This is enhanced context from custom tone quiz",
        );
      });
    });

    describe("error cases", () => {
      it("throws ClaudeAPIError when ANTHROPIC_API_KEY is missing", async () => {
        vi.useRealTimers();
        delete process.env.ANTHROPIC_API_KEY;

        const error = await generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
        ).catch((e) => e);

        expect(error).toBeInstanceOf(ClaudeAPIError);
        expect(error.message).toBe("AI service not configured");
        expect(error.status).toBe(500);
      });

      it.each([
        { status: 401, message: "Invalid API key" },
        { status: 403, message: "Forbidden" },
        { status: 429, message: "Rate limit exceeded" },
      ])("throws ClaudeAPIError on $status status without retry", async ({
        status,
        message,
      }) => {
        mockFetch.mockResolvedValue(createErrorResponse(status, message));

        const error = await generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
        ).catch((e) => e);

        expect(error).toBeInstanceOf(ClaudeAPIError);
        expect(error.status).toBe(status);
        expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
      });

      it("retries on 500 error with exponential backoff", async () => {
        mockFetch
          .mockResolvedValueOnce(
            createErrorResponse(500, "Internal server error"),
          )
          .mockResolvedValueOnce(createSuccessResponse("Success after retry"));

        const resultPromise = generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
        );

        // Advance timer by 1 second (first retry backoff)
        await vi.advanceTimersByTimeAsync(1000);

        const result = await resultPromise;

        expect(result.text).toBe("Success after retry");
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it("throws after max attempts exhausted", async () => {
        mockFetch.mockResolvedValue(
          createErrorResponse(500, "Internal server error"),
        );

        const resultPromise = generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
        ).then(
          (result) => ({ success: true as const, result }),
          (error) => ({ success: false as const, error }),
        );

        await vi.advanceTimersByTimeAsync(2000);

        const outcome = await resultPromise;

        expect(outcome.success).toBe(false);
        if (!outcome.success) {
          expect(outcome.error).toBeInstanceOf(ClaudeAPIError);
          expect(outcome.error.status).toBe(500);
        }
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it("throws ClaudeAPIError on timeout", async () => {
        mockFetch.mockImplementation((_url: string, options?: RequestInit) => {
          return new Promise((_, reject) => {
            if (options?.signal) {
              if (options.signal.aborted) {
                const abortError = new Error("Aborted");
                abortError.name = "AbortError";
                reject(abortError);
                return;
              }
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

        const resultPromise = generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
        ).then(
          (result) => ({ success: true as const, result }),
          (error) => ({ success: false as const, error }),
        );

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
        mockFetch.mockRejectedValue(new Error("Network error"));

        await expect(
          generateResponse(
            createMockReview(),
            createMockVoiceProfile(),
            "Example Biz",
          ),
        ).rejects.toThrow("Network error");
      });

      it("handles malformed JSON error response", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => {
            throw new Error("Invalid JSON");
          },
        });

        const resultPromise = generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
        ).then(
          (result) => ({ success: true as const, result }),
          (error) => ({ success: false as const, error }),
        );

        await vi.advanceTimersByTimeAsync(2000);

        const outcome = await resultPromise;

        expect(outcome.success).toBe(false);
        if (!outcome.success) {
          expect(outcome.error.message).toBe("Claude API request failed");
        }
      });
    });

    describe("API request format", () => {
      it("sends correct request format to Claude API", async () => {
        mockFetch.mockResolvedValue(createSuccessResponse("Response"));

        await generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
        );

        const fetchCall = mockFetch.mock.calls[0];
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
        expect(body.messages).toHaveLength(1);
        expect(body.messages[0].role).toBe("user");
      });
    });

    describe("response parsing", () => {
      it.each([
        { content: [], expectedText: "" },
        { content: [{ type: "text" }], expectedText: "" },
      ])("handles edge case content: $expectedText", async ({
        content,
        expectedText,
      }) => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "msg-123",
            content,
            usage: { input_tokens: 100, output_tokens: 20 },
          }),
        });

        const result = await generateResponse(
          createMockReview(),
          createMockVoiceProfile(),
          "Example Biz",
        );

        expect(result.text).toBe(expectedText);
      });
    });

    describe("review handling", () => {
      it.each([
        {
          rating: null,
          reviewer_name: undefined,
          review_date: undefined,
          requiresEmail: undefined,
          expectedContains: "Unknown",
        },
        {
          rating: 2,
          reviewer_name: undefined,
          review_date: undefined,
          requiresEmail: true,
          expectedContains: "negative review",
        },
        {
          rating: undefined,
          reviewer_name: null,
          review_date: undefined,
          requiresEmail: undefined,
          expectedContains: "Anonymous",
        },
        {
          rating: undefined,
          reviewer_name: undefined,
          review_date: null,
          requiresEmail: undefined,
          expectedContains: "Unknown date",
        },
      ])("handles review with $expectedContains", async ({
        rating,
        reviewer_name,
        review_date,
        expectedContains,
        requiresEmail,
      }) => {
        mockFetch.mockResolvedValue(createSuccessResponse("Response"));

        const overrides: Record<string, unknown> = {};
        if (rating !== undefined) overrides.rating = rating;
        if (reviewer_name !== undefined)
          overrides.reviewer_name = reviewer_name;
        if (review_date !== undefined) overrides.review_date = review_date;

        await generateResponse(
          createMockReview(overrides),
          createMockVoiceProfile(),
          "Example Biz",
          requiresEmail ? "support@example.com" : undefined,
        );

        const body = getRequestBody<{
          messages: Array<{ content: string }>;
          system: string;
        }>();
        const allContent = body.messages[0]?.content + body.system;
        expect(allContent).toContain(expectedContains);
      });
    });

    describe("voice profile handling", () => {
      it("handles custom tone in voice profile", async () => {
        mockFetch.mockResolvedValue(createSuccessResponse("Response"));

        await generateResponse(
          createMockReview(),
          createMockVoiceProfile({ tone: "custom:tone-123" }),
          "Example Biz",
        );

        const body = getRequestBody<{ system: string }>();
        expect(body.system).toContain("Custom Tone");
        expect(body.system).not.toContain("custom:tone-123");
      });

      it("handles voice profile with empty arrays", async () => {
        mockFetch.mockResolvedValue(createSuccessResponse("Response"));

        await generateResponse(
          createMockReview(),
          createMockVoiceProfile({
            example_responses: [],
            words_to_use: [],
            words_to_avoid: [],
          }),
          "Example Biz",
        );

        const body = getRequestBody<{ system: string }>();
        expect(body.system).toContain("EXAMPLES OF RESPONSES THEY LIKE:");
      });
    });
  });
});
