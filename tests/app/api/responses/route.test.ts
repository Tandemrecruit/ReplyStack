import {
  createMockCustomTone,
  createMockLocation,
  createMockReview,
  createMockUser,
  createMockVoiceProfile,
} from "@/tests/helpers/fixtures";
import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

vi.mock("@/lib/claude/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/claude/client")>(
    "@/lib/claude/client",
  );
  return {
    ...actual,
    generateResponse: vi.fn(),
  };
});

import { POST } from "@/app/api/responses/route";
import { ClaudeAPIError, generateResponse } from "@/lib/claude/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Default fixtures
const defaultUser = createMockUser();
const defaultReview = createMockReview();
const defaultLocation = createMockLocation();
const defaultVoiceProfile = createMockVoiceProfile();

describe("POST /api/responses", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a standard authenticated mock client
  function mockAuthenticatedClient(
    tableOverrides: {
      user?: typeof defaultUser | null;
      userError?: { message: string } | null;
      review?:
        | (typeof defaultReview & { locations: typeof defaultLocation })
        | null;
      reviewError?: { message: string } | null;
      existingResponse?: {
        id: string;
        generated_text: string;
        status: string;
        tokens_used: number;
      } | null;
      existingResponseError?: { message: string } | null;
      voiceProfile?: typeof defaultVoiceProfile | null;
      voiceProfileError?: { message: string } | null;
      orgVoiceProfile?: typeof defaultVoiceProfile | null;
      orgVoiceProfileError?: { message: string } | null;
      insertResponse?: { id: string } | null;
      insertResponseError?: { message: string } | null;
      customTone?: ReturnType<typeof createMockCustomTone> | null;
    } = {},
  ) {
    const mockFrom = vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: tableOverrides.user ?? defaultUser,
                error: tableOverrides.userError ?? null,
              }),
            }),
          }),
        };
      }

      if (table === "reviews") {
        const reviewData = tableOverrides.review ?? {
          ...defaultReview,
          locations: defaultLocation,
        };
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: reviewData,
                error: tableOverrides.reviewError ?? null,
              }),
            }),
          }),
        };
      }

      if (table === "responses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: tableOverrides.existingResponse ?? null,
                error: tableOverrides.existingResponseError ?? null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: tableOverrides.insertResponse ?? { id: "resp-1" },
                error: tableOverrides.insertResponseError ?? null,
              }),
            }),
          }),
        };
      }

      if (table === "voice_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: tableOverrides.voiceProfile ?? null,
                error: tableOverrides.voiceProfileError ?? null,
              }),
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: tableOverrides.orgVoiceProfile ?? null,
                  error: tableOverrides.orgVoiceProfileError ?? null,
                }),
              }),
            }),
          }),
        };
      }

      if (table === "custom_tones") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: tableOverrides.customTone ?? null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      return {};
    });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: defaultUser.id } },
        }),
      },
      from: mockFrom,
    } as never);
  }

  describe("authentication and validation", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as never);

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    });

    it.each([
      { body: {}, desc: "missing" },
      { body: { reviewId: null }, desc: "null" },
      { body: { reviewId: "" }, desc: "empty string" },
    ])("returns 400 when reviewId is $desc", async ({ body }) => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
        },
      } as never);

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "reviewId is required",
      });
    });
  });

  describe("user and organization validation", () => {
    it("returns 404 when user not found", async () => {
      mockAuthenticatedClient({
        user: null,
        userError: { message: "User not found" },
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "User not found",
      });
    });

    it("returns 400 when user has no organization", async () => {
      mockAuthenticatedClient({
        user: createMockUser({ organization_id: null }),
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Organization not found",
      });
    });
  });

  describe("review validation", () => {
    it("returns 404 when review not found", async () => {
      mockAuthenticatedClient({
        review: null,
        reviewError: { message: "Review not found" },
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "Review not found",
      });
    });

    it("returns 404 when review belongs to different organization", async () => {
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ organization_id: "other-org" }),
        },
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "Review not found",
      });
    });

    it.each([
      { reviewText: "", desc: "empty" },
      { reviewText: "   \n\t  ", desc: "whitespace-only" },
    ])("returns 400 when review text is $desc", async ({ reviewText }) => {
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          review_text: reviewText,
          locations: defaultLocation,
        },
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Cannot generate response for review without text",
      });
    });
  });

  describe("existing response handling", () => {
    it("returns existing response when one already exists", async () => {
      mockAuthenticatedClient({
        existingResponse: {
          id: "resp-1",
          generated_text: "Thank you for your review!",
          status: "draft",
          tokens_used: 120,
        },
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        id: "resp-1",
        reviewId: "r1",
        generatedText: "Thank you for your review!",
        status: "draft",
        tokensUsed: 120,
      });
      expect(generateResponse).not.toHaveBeenCalled();
    });

    it("returns 500 when checking existing response fails", async () => {
      mockAuthenticatedClient({
        existingResponseError: { message: "Database error" },
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to check for existing response",
        code: "DB_ERROR",
      });
    });
  });

  describe("response generation with voice profiles", () => {
    beforeEach(() => {
      vi.mocked(generateResponse).mockResolvedValue({
        text: "Thank you for your feedback!",
        tokensUsed: 100,
      });
    });

    it("generates response with location voice profile", async () => {
      const locationVoiceProfile = createMockVoiceProfile({
        id: "vp-loc",
        tone: "professional",
      });
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: "vp-loc" }),
        },
        voiceProfile: locationVoiceProfile,
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({ id: "review-1" }),
        expect.objectContaining({ id: "vp-loc", tone: "professional" }),
        "Test Location",
        "user@example.com",
        undefined,
      );
    });

    it("falls back to organization voice profile when location has none", async () => {
      const orgVoiceProfile = createMockVoiceProfile({
        id: "vp-org",
        tone: "casual",
      });
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: null }),
        },
        orgVoiceProfile,
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(generateResponse).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: "vp-org", tone: "casual" }),
        "Test Location",
        "user@example.com",
        undefined,
      );
    });

    it("uses default voice profile when none found", async () => {
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: null }),
        },
        orgVoiceProfile: null,
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(generateResponse).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: "Default", tone: "warm" }),
        "Test Location",
        "user@example.com",
        undefined,
      );
    });

    it("handles location voice profile fetch error gracefully", async () => {
      const orgVoiceProfile = createMockVoiceProfile({ id: "vp-org" });
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: "vp-loc" }),
        },
        voiceProfileError: { message: "Profile not found" },
        orgVoiceProfile,
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(
        "Failed to fetch location voice profile, using fallback:",
        expect.objectContaining({ message: "Profile not found" }),
      );
    });

    it("handles organization voice profile fetch error gracefully", async () => {
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: null }),
        },
        orgVoiceProfileError: { message: "Database error" },
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(
        "Failed to fetch organization voice profile, using fallback:",
        expect.objectContaining({ message: "Database error" }),
      );
    });
  });

  describe("custom tone handling", () => {
    beforeEach(() => {
      vi.mocked(generateResponse).mockResolvedValue({
        text: "Thank you!",
        tokensUsed: 50,
      });
    });

    it("passes enhanced context from custom tone", async () => {
      const customToneVoiceProfile = createMockVoiceProfile({
        id: "vp-1",
        tone: "custom:custom-tone-id",
      });
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: "vp-1" }),
        },
        voiceProfile: customToneVoiceProfile,
        customTone: createMockCustomTone({
          id: "custom-tone-id",
          enhanced_context: "Custom enhanced context for responses.",
        }),
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(generateResponse).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tone: "custom:custom-tone-id" }),
        "Test Location",
        "user@example.com",
        "Custom enhanced context for responses.",
      );
    });

    it("passes undefined when custom tone has no enhanced context", async () => {
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: "vp-1" }),
        },
        voiceProfile: createMockVoiceProfile({ tone: "custom:custom-tone-id" }),
        customTone: createMockCustomTone({ enhanced_context: null }),
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      await POST(request);

      expect(generateResponse).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        undefined,
      );
    });

    it("passes undefined when custom tone doesn't exist", async () => {
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: "vp-1" }),
        },
        voiceProfile: createMockVoiceProfile({ tone: "custom:nonexistent" }),
        customTone: null,
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      await POST(request);

      expect(generateResponse).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        undefined,
      );
    });
  });

  describe("Claude API error handling", () => {
    it.each([
      {
        status: 408,
        message: "Request timeout",
        expectedStatus: 504,
        expectedError: "AI response generation timed out",
        expectedCode: "AI_TIMEOUT",
      },
      {
        status: 429,
        message: "Rate limit exceeded",
        expectedStatus: 429,
        expectedError: "Rate limit exceeded. Please try again later.",
        expectedCode: "RATE_LIMITED",
      },
      {
        status: 401,
        message: "Invalid API key",
        expectedStatus: 500,
        expectedError: "AI service configuration error",
        expectedCode: "INTERNAL_ERROR",
      },
      {
        status: 403,
        message: "Forbidden",
        expectedStatus: 500,
        expectedError: "AI service configuration error",
        expectedCode: "INTERNAL_ERROR",
      },
      {
        status: 503,
        message: "Service unavailable",
        expectedStatus: 502,
        expectedError: "AI service unavailable",
        expectedCode: "AI_SERVICE_ERROR",
      },
    ])("handles Claude API $status error correctly", async ({
      status,
      message,
      expectedStatus,
      expectedError,
      expectedCode,
    }) => {
      vi.mocked(generateResponse).mockRejectedValue(
        new ClaudeAPIError(status, message),
      );
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: null }),
        },
        orgVoiceProfile: null,
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(expectedStatus);
      await expect(response.json()).resolves.toEqual({
        error: expectedError,
        code: expectedCode,
      });
    });
  });

  describe("database errors", () => {
    it("handles database error when saving response", async () => {
      vi.mocked(generateResponse).mockResolvedValue({
        text: "Thank you!",
        tokensUsed: 50,
      });
      mockAuthenticatedClient({
        review: {
          ...defaultReview,
          locations: createMockLocation({ voice_profile_id: null }),
        },
        orgVoiceProfile: null,
        insertResponseError: { message: "Database error" },
      });

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to save response",
        code: "DB_ERROR",
      });
    });

    it("returns 500 when JSON parsing fails", async () => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
        },
      } as never);

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "invalid json",
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to generate response",
        code: "INTERNAL_ERROR",
      });
    });

    it("returns 500 when Supabase client creation fails", async () => {
      vi.mocked(createServerSupabaseClient).mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      const request = makeNextRequest("http://localhost/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewId: "r1" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to generate response",
        code: "INTERNAL_ERROR",
      });
    });
  });
});
