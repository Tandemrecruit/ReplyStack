/**
 * @vitest-environment node
 */

const mockCreateServerClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock("next/headers", () => {
  const mockCookieStore = {
    getAll: vi.fn(() => [
      { name: "test-cookie", value: "test-value" },
      { name: "another-cookie", value: "another-value" },
    ]),
    set: vi.fn(),
  };

  return {
    cookies: async () => mockCookieStore,
  };
});

describe("lib/supabase clients", () => {
  beforeEach(() => {
    mockCreateServerClient.mockReset();
  });

  describe("createBrowserSupabaseClient", () => {
    it("throws when env vars are missing", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { createBrowserSupabaseClient } = await import(
        "@/lib/supabase/client"
      );

      expect(() => createBrowserSupabaseClient()).toThrow(
        "Missing Supabase environment variables",
      );

      if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });
  });

  describe("createServerSupabaseClient", () => {
    it("throws when env vars are missing", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { createServerSupabaseClient } = await import(
        "@/lib/supabase/server"
      );

      await expect(createServerSupabaseClient()).rejects.toThrow(
        "Missing Supabase environment variables",
      );

      if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });

    it("creates client successfully with correct configuration", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const mockClient = { auth: {}, from: vi.fn() };
      mockCreateServerClient.mockReturnValue(mockClient);

      const { createServerSupabaseClient } = await import(
        "@/lib/supabase/server"
      );

      const client = await createServerSupabaseClient();

      expect(client).toBe(mockClient);
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        }),
      );

      if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });

    it("cookie getAll returns all cookies from cookie store", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      let cookieAdapter: { getAll: () => unknown[] } | null = null;
      mockCreateServerClient.mockImplementation((_url, _key, options) => {
        cookieAdapter = options.cookies as { getAll: () => unknown[] };
        return { auth: {}, from: vi.fn() };
      });

      const { createServerSupabaseClient } = await import(
        "@/lib/supabase/server"
      );

      await createServerSupabaseClient();

      expect(cookieAdapter).not.toBeNull();
      const cookies = (
        cookieAdapter as unknown as { getAll: () => unknown[] }
      ).getAll();
      expect(cookies).toEqual([
        { name: "test-cookie", value: "test-value" },
        { name: "another-cookie", value: "another-value" },
      ]);
    });

    it("cookie setAll sets cookies via cookie store", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const setSpy = vi.spyOn(cookieStore, "set");

      let cookieAdapter: { setAll: (cookies: unknown[]) => void } | null = null;
      mockCreateServerClient.mockImplementation((_url, _key, options) => {
        cookieAdapter = options.cookies as {
          setAll: (cookies: unknown[]) => void;
        };
        return { auth: {}, from: vi.fn() };
      });

      const { createServerSupabaseClient } = await import(
        "@/lib/supabase/server"
      );

      await createServerSupabaseClient();

      expect(cookieAdapter).not.toBeNull();
      (
        cookieAdapter as unknown as { setAll: (cookies: unknown[]) => void }
      ).setAll([
        { name: "new-cookie", value: "new-value", options: { httpOnly: true } },
      ]);

      expect(setSpy).toHaveBeenCalledWith("new-cookie", "new-value", {
        httpOnly: true,
      });
    });

    it("cookie setAll handles errors gracefully (Server Component case)", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      vi.spyOn(cookieStore, "set").mockImplementation(() => {
        throw new Error("Cannot set cookies in Server Component");
      });

      let cookieAdapter: { setAll: (cookies: unknown[]) => void } | null = null;
      mockCreateServerClient.mockImplementation((_url, _key, options) => {
        cookieAdapter = options.cookies;
        return { auth: {}, from: vi.fn() };
      });

      const { createServerSupabaseClient } = await import(
        "@/lib/supabase/server"
      );

      await createServerSupabaseClient();

      expect(cookieAdapter).not.toBeNull();
      // Should not throw
      expect(() => {
        cookieAdapter?.setAll([{ name: "test", value: "value", options: {} }]);
      }).not.toThrow();
    });
  });

  describe("createAdminSupabaseClient", () => {
    it("throws when service role key is missing", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

      process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { createAdminSupabaseClient } = await import(
        "@/lib/supabase/server"
      );

      expect(() => createAdminSupabaseClient()).toThrow(
        "Missing Supabase environment variables",
      );

      if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      if (originalService)
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
    });

    it("creates admin client successfully with correct configuration", async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

      const mockClient = { auth: {}, from: vi.fn() };
      mockCreateServerClient.mockReturnValue(mockClient);

      const { createAdminSupabaseClient } = await import(
        "@/lib/supabase/server"
      );

      const client = createAdminSupabaseClient();

      expect(client).toBe(mockClient);
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-service-role-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        }),
      );

      if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      if (originalService)
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
    });

    it("admin client cookie getAll returns empty array", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

      let cookieAdapter: { getAll: () => unknown[] } | null = null;
      mockCreateServerClient.mockImplementation((_url, _key, options) => {
        cookieAdapter = options.cookies as { getAll: () => unknown[] };
        return { auth: {}, from: vi.fn() };
      });

      const { createAdminSupabaseClient } = await import(
        "@/lib/supabase/server"
      );

      createAdminSupabaseClient();

      expect(cookieAdapter).not.toBeNull();
      const cookies = (
        cookieAdapter as unknown as { getAll: () => unknown[] }
      ).getAll();
      expect(cookies).toEqual([]);
    });

    it("admin client cookie setAll is no-op", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

      let cookieAdapter: { setAll: (cookies: unknown[]) => void } | null = null;
      mockCreateServerClient.mockImplementation((_url, _key, options) => {
        cookieAdapter = options.cookies;
        return { auth: {}, from: vi.fn() };
      });

      const { createAdminSupabaseClient } = await import(
        "@/lib/supabase/server"
      );

      createAdminSupabaseClient();

      expect(cookieAdapter).not.toBeNull();
      // Should not throw and should be a no-op
      expect(() => {
        cookieAdapter?.setAll([{ name: "test", value: "value", options: {} }]);
      }).not.toThrow();
    });
  });
});
