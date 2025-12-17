vi.mock("next/headers", () => {
  return {
    cookies: async () => ({
      getAll: () => [],
      set: () => {},
    }),
  };
});

describe("lib/supabase clients", () => {
  it("createBrowserSupabaseClient throws when env vars are missing", async () => {
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

  it("createServerSupabaseClient throws when env vars are missing", async () => {
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

  it("createAdminSupabaseClient throws when service role key is missing", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

    process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createAdminSupabaseClient } = await import("@/lib/supabase/server");

    expect(() => createAdminSupabaseClient()).toThrow(
      "Missing Supabase environment variables",
    );

    if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalService)
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  });
});
