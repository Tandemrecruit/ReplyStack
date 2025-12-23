/**
 * Custom test assertions and helpers to reduce boilerplate in tests.
 */

import { expect, type Mock } from "vitest";

interface FetchExpectation {
  /** Expected URL (string for exact match, RegExp for pattern) */
  url?: string | RegExp;
  /** Expected HTTP method */
  method?: string;
  /** Expected headers (partial match) */
  headers?: Record<string, string>;
  /** Expected body (will be compared after JSON.parse if string) */
  body?: unknown;
  /** Expected number of times fetch was called (default: 1) */
  times?: number;
  /** Which call to check (0-indexed, default: last call) */
  callIndex?: number;
}

/**
 * Assert that fetch was called with expected parameters.
 * Reduces boilerplate from repeated fetch mock assertions.
 *
 * @example
 * ```ts
 * expectFetchCalled(mockFetch, {
 *   url: "https://api.example.com/endpoint",
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: { key: "value" },
 * });
 * ```
 */
export function expectFetchCalled(
  mock: Mock,
  expected: FetchExpectation = {},
): void {
  const { times = 1, callIndex } = expected;

  expect(mock).toHaveBeenCalledTimes(times);

  const idx = callIndex ?? mock.mock.calls.length - 1;
  const call = mock.mock.calls[idx];
  expect(call).toBeDefined();

  const [url, options] = call as [string, RequestInit | undefined];

  if (expected.url) {
    if (typeof expected.url === "string") {
      expect(url).toBe(expected.url);
    } else {
      expect(url).toMatch(expected.url);
    }
  }

  if (expected.method && options) {
    expect(options.method).toBe(expected.method);
  }

  if (expected.headers && options?.headers) {
    expect(options.headers).toEqual(expect.objectContaining(expected.headers));
  }

  if (expected.body !== undefined && options?.body) {
    const actualBody =
      typeof options.body === "string"
        ? JSON.parse(options.body)
        : options.body;
    expect(actualBody).toEqual(expected.body);
  }
}

/**
 * Assert that fetch URL contains specific parameters.
 *
 * @example
 * ```ts
 * expectFetchUrlContains(mockFetch, ["pageToken=abc", "pageSize=50"]);
 * ```
 */
export function expectFetchUrlContains(mock: Mock, params: string[]): void {
  expect(mock).toHaveBeenCalled();
  const lastCall = mock.mock.calls[mock.mock.calls.length - 1];
  expect(lastCall).toBeDefined();
  const [url] = lastCall as [string];

  for (const param of params) {
    expect(url).toContain(param);
  }
}

/**
 * Assert that fetch URL does not contain specific parameters.
 */
export function expectFetchUrlNotContains(mock: Mock, params: string[]): void {
  expect(mock).toHaveBeenCalled();
  const lastCall = mock.mock.calls[mock.mock.calls.length - 1];
  expect(lastCall).toBeDefined();
  const [url] = lastCall as [string];

  for (const param of params) {
    expect(url).not.toContain(param);
  }
}

/**
 * Get the parsed body from a fetch mock call.
 */
export function getFetchBody<T = unknown>(
  mock: { mock: { calls: unknown[][] } },
  callIndex = -1,
): T {
  const idx = callIndex < 0 ? mock.mock.calls.length + callIndex : callIndex;
  const call = mock.mock.calls[idx];
  expect(call).toBeDefined();
  const options = call?.[1] as RequestInit | undefined;
  expect(options?.body).toBeDefined();
  return JSON.parse(options?.body as string) as T;
}

/**
 * Create a mock successful fetch response.
 */
export function createMockFetchResponse<T>(
  data: T,
  options: { ok?: boolean; status?: number } = {},
) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: async () => data,
  };
}

/**
 * Create a mock error fetch response.
 */
export function createMockFetchError(
  status: number,
  error?: { message?: string; error?: string },
) {
  return {
    ok: false,
    status,
    statusText: getStatusText(status),
    json: async () => error ?? { error: "Error" },
  };
}

function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return statusTexts[status] ?? "Error";
}

/**
 * Assert that an API response has the expected status and body.
 */
export async function expectApiResponse(
  response: Response,
  expected: {
    status: number;
    body?: unknown;
    bodyContains?: Record<string, unknown>;
  },
): Promise<void> {
  expect(response.status).toBe(expected.status);

  if (expected.body !== undefined) {
    await expect(response.json()).resolves.toEqual(expected.body);
  } else if (expected.bodyContains !== undefined) {
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining(expected.bodyContains),
    );
  }
}
