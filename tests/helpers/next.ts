import { NextRequest } from "next/server";

export function makeNextRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}


