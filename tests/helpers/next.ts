import { NextRequest } from "next/server";

/**
 * Create a NextRequest by wrapping a standard Request constructed from the provided URL and init.
 *
 * @returns A NextRequest created from a new Request initialized with `url` and `init`.
 */
export function makeNextRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}
