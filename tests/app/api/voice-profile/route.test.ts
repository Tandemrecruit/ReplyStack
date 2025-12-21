import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

import { GET, PUT } from "@/app/api/voice-profile/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";

describe("GET /api/voice-profile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 when user has no organization", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "User not found" },
            }),
          }),
        }),
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Organization not found",
    });
  });

  it("returns null when no voice profile exists", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toBeNull();
  });

  it("returns voice profile when it exists", async () => {
    const mockProfile = {
      id: "profile-1",
      organization_id: "org-1",
      name: "Default",
      tone: "friendly",
      personality_notes: "Professional and friendly",
      sign_off_style: "The Team",
      max_length: 150,
      words_to_use: ["thank you", "appreciate"],
      words_to_avoid: ["sorry", "unfortunately"],
      example_responses: ["Example 1", "Example 2"],
      created_at: "2025-01-01T00:00:00Z",
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(mockProfile);
  });

  it("returns 500 when database query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Database error" },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch voice profile",
    });
  });

  it("returns 404 when organization not found in GET", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "user-1", organization_id: null },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Organization not found",
    });
  });

  it("returns 404 when database error occurs during user lookup in GET", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Organization not found",
    });
  });
});

describe("PUT /api/voice-profile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({ tone: "professional" }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when request body is invalid JSON", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "user-1", organization_id: "org-1" },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: "invalid json",
      headers: { "Content-Type": "application/json" },
    });

    // Mock request.json() to throw an error
    vi.spyOn(request, "json").mockRejectedValueOnce(
      new SyntaxError(
        "Unexpected token 'i', \"invalid json\" is not valid JSON",
      ),
    );

    const response = await PUT(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body: JSON parsing failed",
    });
  });

  it("returns 400 when request body fails validation", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "user-1", organization_id: "org-1" },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({ max_length: -1 }), // Invalid: must be positive
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    });
  });

  it("creates new voice profile when none exists", async () => {
    const newProfile = {
      id: "profile-1",
      organization_id: "org-1",
      name: "Default",
      tone: "professional",
      personality_notes: "Friendly and helpful",
      sign_off_style: "Best regards",
      max_length: 200,
      words_to_use: ["thank you"],
      words_to_avoid: ["sorry"],
      example_responses: ["Example"],
      created_at: "2025-01-01T00:00:00Z",
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: newProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({
        tone: "professional",
        personality_notes: "Friendly and helpful",
        sign_off_style: "Best regards",
        max_length: 200,
        words_to_use: ["thank you"],
        words_to_avoid: ["sorry"],
        example_responses: ["Example"],
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(newProfile);
  });

  it("updates existing voice profile", async () => {
    const updatedProfile = {
      id: "profile-1",
      organization_id: "org-1",
      name: "Default",
      tone: "casual",
      personality_notes: "Friendly",
      sign_off_style: "Thanks",
      max_length: 100,
      words_to_use: null,
      words_to_avoid: null,
      example_responses: null,
      created_at: "2025-01-01T00:00:00Z",
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "profile-1" },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: updatedProfile,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({
        tone: "casual",
        personality_notes: "Friendly",
        sign_off_style: "Thanks",
        max_length: 100,
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(updatedProfile);
  });

  it("returns 500 when update fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "profile-1" },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { message: "Update failed" },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({ tone: "professional" }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to update voice profile",
    });
  });

  it("returns 500 when create fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Create failed" },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({ tone: "professional" }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to create voice profile",
    });
  });

  it("returns 404 when user not found in PUT", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "User not found" },
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({ tone: "professional" }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "User not found",
    });
  });

  it("filters out undefined values from update data", async () => {
    const updatedProfile = {
      id: "profile-1",
      organization_id: "org-1",
      name: "Default",
      tone: "casual",
      personality_notes: "Friendly",
      sign_off_style: "Thanks",
      max_length: 100,
      words_to_use: null,
      words_to_avoid: null,
      example_responses: null,
      created_at: "2025-01-01T00:00:00Z",
    };

    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updatedProfile,
              error: null,
            }),
          }),
        }),
      }),
    });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "profile-1" },
                  error: null,
                }),
              }),
            }),
            update: updateSpy,
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({
        tone: "casual",
        personality_notes: "Friendly",
        sign_off_style: "Thanks",
        max_length: 100,
        words_to_use: undefined, // Should be filtered out
        words_to_avoid: undefined, // Should be filtered out
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    // Verify update was called with only defined values
    expect(updateSpy).toHaveBeenCalledWith({
      tone: "casual",
      personality_notes: "Friendly",
      sign_off_style: "Thanks",
      max_length: 100,
    });
  });

  it("returns 400 when max_length is 0", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "user-1", organization_id: "org-1" },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({ max_length: 0 }), // Invalid: must be positive
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    });
  });

  it("returns 400 when max_length is negative", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "user-1", organization_id: "org-1" },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({ max_length: -5 }), // Invalid: must be positive
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    });
  });

  it("returns 400 when max_length is not an integer", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "user-1", organization_id: "org-1" },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({ max_length: 100.5 }), // Invalid: must be integer
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    });
  });

  it("handles empty arrays in validation", async () => {
    const newProfile = {
      id: "profile-1",
      organization_id: "org-1",
      name: "Default",
      tone: "professional",
      personality_notes: null,
      sign_off_style: null,
      max_length: 200,
      words_to_use: [],
      words_to_avoid: [],
      example_responses: [],
      created_at: "2025-01-01T00:00:00Z",
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "voice_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: newProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/voice-profile", {
      method: "PUT",
      body: JSON.stringify({
        tone: "professional",
        words_to_use: [],
        words_to_avoid: [],
        example_responses: [],
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(newProfile);
  });
});
