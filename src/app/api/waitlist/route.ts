import type { NextRequest } from "next/server";
import { normalizeEmail } from "@/lib/disposable";
import { createMember, getMemberByEmail, getStanding } from "@/lib/members";
import { sendWaitlistConfirmed } from "@/lib/email";
import { logEvent } from "@/lib/events";
import { bad, readAttributionCookies, readJson } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return bad("Supabase is not configured", 503);
  const body = await readJson<{ email?: string; leaderboard_opt_in?: boolean }>(request);
  const email = normalizeEmail(String(body?.email ?? ""));
  if (!email) return bad("Enter a valid email address.");

  const existing = await getMemberByEmail(email);
  if (existing) {
    // Already on the list: send them to their own welcome page, no new referral.
    return Response.json({ url: `/welcome?ref=${existing.referral_code}&existing=1` });
  }

  const { refCode, visitorId } = readAttributionCookies(request);
  const { member, token, attribution } = await createMember({
    email,
    leaderboardOptIn: body?.leaderboard_opt_in !== false,
    visitorId,
    refCode,
    confirmReferralNow: true,
  });

  await logEvent(
    "waitlist_joined",
    { ref: refCode, credited: attribution.credited, reason: attribution.reason ?? null },
    member.id,
  );

  const standing = await getStanding(member.id);
  // Fire and forget: the email must not delay the redirect.
  void sendWaitlistConfirmed({
    email: member.email,
    firstName: member.first_name,
    referralCode: member.referral_code,
    token,
    standing,
  });

  return Response.json({ url: `/welcome?ref=${member.referral_code}` });
}
