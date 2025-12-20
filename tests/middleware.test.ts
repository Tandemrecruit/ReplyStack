/**
 * @vitest-environment node
 */

import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { makeNextRequest } from "@/tests/helpers/next";

// Mock updateSession before importing middleware
vi.mock("@/lib/supabase/middleware", () => {
  return {
    updateSession: vi.fn(),
  };
});

import { config, middleware } from "@/middleware";

describe("middleware", () => {
  beforeEach(() => {
    vi.mocked(updateSession).mockClear();
  });

  it("calls updateSession with the provided request", async () => {
    const request = makeNextRequest("http://localhost/dashboard");
    const mockResponse = NextResponse.next({ request });

    vi.mocked(updateSession).mockResolvedValue(mockResponse);

    await middleware(request);

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith(request);
  });

  it("returns the result from updateSession", async () => {
    const request = makeNextRequest("http://localhost/dashboard");
    const mockResponse = NextResponse.redirect(
      new URL("http://localhost/login"),
    );

    vi.mocked(updateSession).mockResolvedValue(mockResponse);

    const result = await middleware(request);

    expect(result).toBe(mockResponse);
    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toBe("http://localhost/login");
  });
});

describe("middleware config", () => {
  it("has a matcher property that is an array", () => {
    expect(config).toHaveProperty("matcher");
    expect(Array.isArray(config.matcher)).toBe(true);
  });

  it("has a matcher array with the expected regex pattern", () => {
    expect(config.matcher).toHaveLength(1);
    expect(config.matcher[0]).toBe(
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks|api/cron).*)",
    );
  });

  it("matcher regex pattern contains expected exclusion patterns", () => {
    const pattern = config.matcher[0];

    // Verify the pattern contains the expected exclusion patterns
    expect(pattern).toContain("_next/static");
    expect(pattern).toContain("_next/image");
    expect(pattern).toContain("favicon.ico");
    expect(pattern).toContain("api/webhooks");
    expect(pattern).toContain("api/cron");
    expect(pattern).toContain("svg");
    expect(pattern).toContain("png");
    expect(pattern).toContain("jpg");
    expect(pattern).toContain("jpeg");
    expect(pattern).toContain("gif");
    expect(pattern).toContain("webp");
  });
});
