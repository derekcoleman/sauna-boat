import type { NextRequest } from "next/server";
import { logEvent, type EventType } from "@/lib/events";
import { getMemberByCode } from "@/lib/members";
import { normalizeReferralCode } from "@/lib/referral";
import { readJson } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/supabase";

const CLIENT_TYPES = new Set<EventType>(["page_view", "cta_click", "share_click"]);

interface Body {
  type?: string;
  payload?: Record<string, unknown>;
  /** Referral code identifying the acting member (share clicks on /welcome). */
  code?: string;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return Response.json({ ok: false });
  const body = await readJson<Body>(request);
  const type = body?.type as EventType;
  if (!type || !CLIENT_TYPES.has(type)) return Response.json({ ok: false }, { status: 400 });

  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body?.payload ?? {})) {
    if (typeof v === "string") payload[k] = v.slice(0, 200);
    else if (typeof v === "number" || typeof v === "boolean") payload[k] = v;
  }

  let memberId: string | null = null;
  const code = normalizeReferralCode(body?.code);
  if (code) memberId = (await getMemberByCode(code))?.id ?? null;

  await logEvent(type, payload, memberId);
  return Response.json({ ok: true });
}
