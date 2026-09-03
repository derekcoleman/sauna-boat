import type { NextRequest } from "next/server";
import { db, isSupabaseConfigured } from "@/lib/supabase";
import { countReferredAhead, getStanding, latestToken } from "@/lib/members";
import { sendNudge } from "@/lib/email";
import { logEvent } from "@/lib/events";

/**
 * 48-hour follow-up. Vercel Cron calls this hourly (see vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. Locally: curl it with the same header,
 * or with no CRON_SECRET set it runs unauthenticated in development only.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (secret) {
    if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return new Response("CRON_SECRET is not set", { status: 503 });
  }
  if (!isSupabaseConfigured()) return new Response("Supabase not configured", { status: 503 });

  const now = Date.now();
  const { data: due } = await db()
    .from("members")
    .select("*")
    .is("nudge_sent_at", null)
    .lt("created_at", new Date(now - 48 * 3_600_000).toISOString())
    .gt("created_at", new Date(now - 14 * 86_400_000).toISOString())
    .order("created_at", { ascending: true })
    .limit(100);

  let sent = 0;
  for (const member of due ?? []) {
    const [standing, ahead, token] = await Promise.all([
      getStanding(member.id),
      countReferredAhead(member.id),
      latestToken(member.id),
    ]);
    await sendNudge(
      { email: member.email, firstName: member.first_name, referralCode: member.referral_code, token, standing },
      ahead,
      member.tier,
    );
    await db().from("members").update({ nudge_sent_at: new Date().toISOString() }).eq("id", member.id);
    await logEvent("nudge_sent", { position: standing?.position ?? null, referred_ahead: ahead }, member.id);
    sent++;
  }
  return Response.json({ sent });
}
