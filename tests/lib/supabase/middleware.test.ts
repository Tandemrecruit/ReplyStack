import { createServerClient } from "@supabase/ssr";
import { makeNextRequest } from "@/tests/helpers/next";

type MockCookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll?: (
    cookiesToSet: Array<{
      name: string;
      value: string;
      options?: Record<string, unknown>;
    }>,
  ) => void;
};

let mockUser: { id: string } | null = null;
let lastCookiesGetAll: { name: string; value: string }[] = [];
const setAllSpy = vi.fn();

vi.mock("@supabase/ssr", () => {
  return {
    createServerClient: vi.fn(
      (
        _url: string,
        _key: string,
        { cookies }: { cookies?: MockCookieAdapter } = {},
      ) => {
        return {
          auth: {
            getUser: vi.fn(async () => {
              lastCookiesGetAll = cookies?.getAll?.() ?? [];

              if (cookies?.setAll) {
                setAllSpy.mockImplementation((cookiesToSet) =>
                  cookies.setAll?.(cookiesToSet),
                );

                setAllSpy([
                  {
                    name: "sb",
                    value: "refreshed-cookie",
                    options: { path: "/" },
                  },
                ]);
              }

              return { data: { user: mockUser } };
            }),
          },
        };
      },
    ),
  };
});

import { updateSession } from "@/lib/supabase/middleware";

describe("lib/supabase/middleware updateSession", () => {
  let originalUrl: string | undefined;
  let originalKey: string | undefined;

  beforeEach(() => {
    setAllSpy.mockClear();
    lastCookiesGetAll = [];
    originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  afterEach(() => {
    if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("redirects unauthenticated dashboard requests to /login with redirect param", async () => {
    mockUser = null;
    const request = makeNextRequest("http://localhost/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?redirect=%2Fdashboard",
    );
  });

  it("redirects authenticated users away from auth pages (uses ?redirect= when present)", async () => {
    mockUser = { id: "u1" };
    const request = makeNextRequest("http://localhost/login?redirect=/reviews");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/reviews");
  });

  it("redirects authenticated users away from auth pages to /dashboard by default", async () => {
    mockUser = { id: "u1" };
    const request = makeNextRequest("http://localhost/login");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("passes through non-protected routes when unauthenticated", async () => {
    mockUser = null;
    const request = makeNextRequest("http://localhost/pricing-faq");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("propagates cookies into Supabase client and setAll updates response", async () => {
    mockUser = null;
    const request = makeNextRequest("http://localhost/", {
      headers: {
        cookie: "sb=initial-token",
      },
    });

    const response = await updateSession(request);

    expect(createServerClient).toHaveBeenCalledTimes(1);
    expect(lastCookiesGetAll).toEqual(
      expect.arrayContaining([{ name: "sb", value: "initial-token" }]),
    );
    expect(setAllSpy).toHaveBeenCalledWith([
      { name: "sb", value: "refreshed-cookie", options: { path: "/" } },
    ]);

    const setCookieHeader = response.headers.get("set-cookie");
    expect(setCookieHeader).toContain("sb=refreshed-cookie");
    expect(setCookieHeader).toContain("Path=/");
  });
});
