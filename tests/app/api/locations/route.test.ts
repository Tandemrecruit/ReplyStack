import { randomBytes } from "node:crypto";
import { makeNextRequest } from "@/tests/helpers/next";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

vi.mock("@/lib/google/client", () => {
  return {
    refreshAccessToken: vi.fn(),
    fetchAccounts: vi.fn(),
    fetchLocations: vi.fn(),
    GoogleAPIError: class GoogleAPIError extends Error {
      constructor(
        public status: number,
        message: string,
      ) {
        super(message);
        this.name = "GoogleAPIError";
      }
    },
  };
});

import { DELETE, GET, POST } from "@/app/api/locations/route";
import { encryptToken } from "@/lib/crypto/encryption";
import {
  fetchAccounts,
  fetchLocations,
  GoogleAPIError,
  refreshAccessToken,
} from "@/lib/google/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Generate a valid test encryption key (32 bytes = 64 hex chars)
const TEST_ENCRYPTION_KEY = randomBytes(32).toString("hex");

describe("GET /api/locations", () => {
  beforeEach(() => {
    // Set up encryption key for tests
    process.env.TOKEN_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TOKEN_ENCRYPTION_KEY;
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

  it("returns 404 when user not found", async () => {
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
      error: "User not found",
    });
  });

  it("returns 400 when Google account not connected", async () => {
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
              data: {
                id: "user-1",
                google_refresh_token: null,
                organization_id: "org-1",
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Google account not connected",
      code: "GOOGLE_NOT_CONNECTED",
    });
  });

  it("returns locations with sync status", async () => {
    // Encrypt the token as it would be stored in the database
    const encryptedToken = encryptToken("refresh-token");

    const mockSupabase = {
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
                  data: {
                    id: "user-1",
                    google_refresh_token: encryptedToken,
                    organization_id: "org-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { id: "db-loc-1", google_location_id: "loc-1" },
                    { id: "db-loc-3", google_location_id: "loc-3" },
                  ],
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
    vi.mocked(fetchAccounts).mockResolvedValue([
      { accountId: "acc-1", name: "Account 1" },
    ]);
    vi.mocked(fetchLocations).mockResolvedValue([
      {
        google_account_id: "acc-1",
        google_location_id: "loc-1",
        name: "Location 1",
        address: "123 Main St",
      },
      {
        google_account_id: "acc-1",
        google_location_id: "loc-2",
        name: "Location 2",
        address: "456 Oak Ave",
      },
      {
        google_account_id: "acc-1",
        google_location_id: "loc-3",
        name: "Location 3",
        address: "789 Pine Rd",
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.locations).toHaveLength(3);
    expect(data.locations[0]).toMatchObject({
      google_account_id: "acc-1",
      google_location_id: "loc-1",
      name: "Location 1",
      address: "123 Main St",
      account_name: "Account 1",
      is_synced: true, // loc-1 is in synced locations
    });
    expect(data.locations[1].is_synced).toBe(false); // loc-2 not synced
    expect(data.locations[2].is_synced).toBe(true); // loc-3 is synced
  });

  it("returns 401 when Google auth expires", async () => {
    // Encrypt the token as it would be stored in the database
    const encryptedToken = encryptToken("refresh-token");

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
              data: {
                id: "user-1",
                google_refresh_token: encryptedToken,
                organization_id: "org-1",
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    vi.mocked(refreshAccessToken).mockRejectedValue(
      new GoogleAPIError(401, "Token expired"),
    );

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Token expired",
      code: "GOOGLE_AUTH_EXPIRED",
    });
  });

  it("returns 500 on unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockRejectedValue(
      new Error("Unexpected error"),
    );

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch locations",
    });
  });
});

describe("POST /api/locations", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locations: [] }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 when user not found", async () => {
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

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locations: [] }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "User not found",
    });
  });

  it("creates organization when user has none", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@example.com" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          const usersChain = {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: null },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
          return usersChain;
        }
        if (table === "organizations") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "org-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "loc-1",
                    organization_id: "org-1",
                    google_account_id: "acc-1",
                    google_location_id: "loc-1",
                    name: "Location 1",
                    address: "123 Main St",
                    is_active: true,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
            address: "123 Main St",
          },
        ],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.saved).toBe(1);
    expect(data.locations).toHaveLength(1);
  });

  it("upserts locations for existing organization", async () => {
    const mockSupabase = {
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
        if (table === "locations") {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "loc-1",
                    organization_id: "org-1",
                    google_account_id: "acc-1",
                    google_location_id: "loc-1",
                    name: "Location 1",
                    address: "123 Main St",
                    is_active: true,
                  },
                  {
                    id: "loc-2",
                    organization_id: "org-1",
                    google_account_id: "acc-1",
                    google_location_id: "loc-2",
                    name: "Location 2",
                    address: null,
                    is_active: true,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
            address: "123 Main St",
          },
          {
            google_account_id: "acc-1",
            google_location_id: "loc-2",
            name: "Location 2",
          },
        ],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.saved).toBe(2);
    expect(data.locations).toHaveLength(2);
  });

  it("returns 400 when locations array is missing", async () => {
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

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body: locations array required",
    });
  });

  it("returns 500 when organization creation fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@example.com" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: null },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "organizations") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
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

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locations: [] }),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to create organization",
    });
  });

  it("returns 500 when location save fails", async () => {
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
        if (table === "locations") {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
          },
        ],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to save locations",
    });
  });
});

describe("DELETE /api/locations", () => {
  beforeEach(() => {
    // Set up encryption key for tests
    process.env.TOKEN_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TOKEN_ENCRYPTION_KEY;
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ location_id: "loc-1" }),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 when organization not found", async () => {
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

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ location_id: "loc-1" }),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Organization not found",
    });
  });

  it("returns 400 when location_id is missing", async () => {
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

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "location_id required",
    });
  });

  it("deactivates location successfully", async () => {
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
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "loc-1" },
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ location_id: "loc-1" }),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns 500 when deactivation fails", async () => {
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
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "loc-1" },
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: { message: "Database error" },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ location_id: "loc-1" }),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to deactivate location",
    });
  });

  it("returns 400 when JSON parsing fails in DELETE", async () => {
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

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: "invalid json",
    });
    // Mock request.json() to throw
    vi.spyOn(request, "json").mockRejectedValueOnce(
      new SyntaxError("Invalid JSON"),
    );
    const response = await DELETE(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body: JSON parsing failed",
    });
  });

  it("returns 404 when location not found in DELETE", async () => {
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
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Location not found" },
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ location_id: "loc-1" }),
    });
    const response = await DELETE(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Location not found",
    });
  });

  it("handles token decryption error in GET", async () => {
    const _encryptedToken = encryptToken("refresh-token");

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
                  data: {
                    id: "user-1",
                    google_refresh_token: "corrupted-token",
                    organization_id: "org-1",
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error:
        "Google authentication data corrupted. Please reconnect your account.",
      code: "GOOGLE_AUTH_EXPIRED",
    });
  });

  it("handles multiple accounts with some location fetch failures", async () => {
    const encryptedToken = encryptToken("refresh-token");

    const mockSupabase = {
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
                  data: {
                    id: "user-1",
                    google_refresh_token: encryptedToken,
                    organization_id: "org-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
    vi.mocked(fetchAccounts).mockResolvedValue([
      { accountId: "acc-1", name: "Account 1" },
      { accountId: "acc-2", name: "Account 2" },
    ]);
    vi.mocked(fetchLocations)
      .mockResolvedValueOnce([
        {
          google_account_id: "acc-1",
          google_location_id: "loc-1",
          name: "Location 1",
          address: "123 Main St",
        },
      ])
      .mockRejectedValueOnce(new Error("API error"));

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    // Should still return locations from successful account
    expect(data.locations).toHaveLength(1);
    expect(data.locations[0].google_location_id).toBe("loc-1");
  });

  it("handles locations with missing/null fields", async () => {
    const encryptedToken = encryptToken("refresh-token");

    const mockSupabase = {
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
                  data: {
                    id: "user-1",
                    google_refresh_token: encryptedToken,
                    organization_id: "org-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    vi.mocked(refreshAccessToken).mockResolvedValue("access-token");
    vi.mocked(fetchAccounts).mockResolvedValue([
      { accountId: "acc-1", name: "Account 1" },
    ]);
    vi.mocked(fetchLocations).mockResolvedValue([
      {
        address: null,
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.locations).toHaveLength(1);
    expect(data.locations[0]).toMatchObject({
      google_account_id: "acc-1", // Falls back to accountId
      google_location_id: "",
      name: "",
      address: "",
      account_name: "Account 1",
      is_synced: false,
    });
  });

  it("handles organization rollback when user update fails", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@example.com" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-1", organization_id: null },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: { message: "Update failed" },
              }),
            }),
          };
        }
        if (table === "organizations") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "org-1" },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as never,
    );

    vi.spyOn(console, "error").mockImplementation(() => {});

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locations: [
          {
            google_account_id: "acc-1",
            google_location_id: "loc-1",
            name: "Location 1",
          },
        ],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to link user to organization",
    });
  });

  it("returns 400 when locations is not an array in POST", async () => {
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

    const request = makeNextRequest("http://localhost/api/locations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locations: "not-an-array" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body: locations array required",
    });
  });

  it("handles user lookup error in GET", async () => {
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
              error: { message: "Database connection error" },
            }),
          }),
        }),
      }),
    } as never);

    const response = await GET();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "User not found",
    });
  });
});
