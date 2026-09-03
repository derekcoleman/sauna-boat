import "server-only";
import type { NextRequest } from "next/server";
import { REF_COOKIE, VISITOR_COOKIE } from "./config";
import { normalizeReferralCode } from "./referral";

export function readAttributionCookies(request: NextRequest) {
  return {
    refCode: normalizeReferralCode(request.cookies.get(REF_COOKIE)?.value),
    visitorId: request.cookies.get(VISITOR_COOKIE)?.value ?? null,
  };
}

export async function readJson<T = Record<string, unknown>>(request: NextRequest): Promise<T | null> {
  try {
    const text = await request.text();
    if (text.length > 10_000) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
