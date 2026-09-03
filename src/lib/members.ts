import "server-only";
import { db } from "./supabase";
import { generateReferralCode } from "./referral";
import { computeStandings, type Standing, type Tier } from "./position";
import { isDisposableEmail } from "./disposable";
import { createToken, verifyTokenSignature } from "./tokens";
import type { MemberRow, ReservationRow, LeaderboardRow } from "./db-types";

export interface ReferralCounts {
  total: number;
  deposit: number;
  free: number;
}

export async function getMemberByEmail(email: string): Promise<MemberRow | null> {
  const { data } = await db().from("members").select("*").eq("email", email).maybeSingle();
  return data ?? null;
}

export async function getMemberByCode(code: string): Promise<MemberRow | null> {
  const { data } = await db().from("members").select("*").eq("referral_code", code).maybeSingle();
  return data ?? null;
}

export async function getMemberById(id: string): Promise<MemberRow | null> {
  const { data } = await db().from("members").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export interface CreateMemberInput {
  email: string;
  firstName?: string | null;
  lastInitial?: string | null;
  leaderboardOptIn?: boolean;
  visitorId?: string | null;
  /** Referral code from the `ref` cookie, if any. */
  refCode?: string | null;
  /** Waitlist signups confirm the referral immediately; deposits wait for the webhook. */
  confirmReferralNow: boolean;
}

export interface AttributionResult {
  referrer: MemberRow | null;
  credited: boolean;
  reason?: "self" | "same-visitor" | "disposable" | "unknown-code";
}

/**
 * Decide whether a signup should credit a referrer. Pure-ish (needs referrer row).
 */
export function evaluateAttribution(
  referrer: MemberRow | null,
  email: string,
  visitorId: string | null | undefined,
): AttributionResult {
  if (!referrer) return { referrer: null, credited: false, reason: "unknown-code" };
  if (referrer.email === email) return { referrer, credited: false, reason: "self" };
  if (visitorId && referrer.visitor_id && referrer.visitor_id === visitorId) {
    return { referrer, credited: false, reason: "same-visitor" };
  }
  if (isDisposableEmail(email)) return { referrer, credited: false, reason: "disposable" };
  return { referrer, credited: true };
}

/**
 * Create a member with a unique referral code, attribute the referral, and
 * issue a magic-link token. Returns the row and the token.
 */
export async function createMember(input: CreateMemberInput): Promise<{
  member: MemberRow;
  token: string;
  attribution: AttributionResult;
}> {
  const client = db();
  const referrer = input.refCode ? await getMemberByCode(input.refCode) : null;
  const attribution = evaluateAttribution(referrer, input.email, input.visitorId);

  let member: MemberRow | null = null;
  for (let attempt = 0; attempt < 5 && !member; attempt++) {
    const { data, error } = await client
      .from("members")
      .insert({
        email: input.email,
        first_name: input.firstName ?? null,
        last_initial: input.lastInitial ?? null,
        referral_code: generateReferralCode(),
        // Self-referrals are not recorded at all; disposable-domain signups
        // keep the pointer for reporting but earn no credit.
        referred_by:
          attribution.referrer && attribution.reason !== "self" && attribution.reason !== "same-visitor"
            ? attribution.referrer.id
            : null,
        tier: "waitlist",
        leaderboard_opt_in: input.leaderboardOptIn ?? true,
        visitor_id: input.visitorId ?? null,
      })
      .select("*")
      .single();
    if (data) member = data;
    else if (error && error.code === "23505" && /referral_code/.test(error.message)) continue;
    else throw new Error(error?.message ?? "Failed to create member");
  }
  if (!member) throw new Error("Could not allocate a unique referral code");

  if (attribution.credited && attribution.referrer) {
    await client.from("referrals").insert({
      referrer_id: attribution.referrer.id,
      referred_id: member.id,
      confirmed_at: input.confirmReferralNow ? new Date().toISOString() : null,
    });
  }

  const token = await issueToken(member.id);
  return { member, token, attribution };
}

export async function issueToken(memberId: string): Promise<string> {
  const { token, expiresAt } = createToken();
  const { error } = await db()
    .from("email_tokens")
    .insert({ token, member_id: memberId, expires_at: expiresAt.toISOString() });
  if (error) throw new Error(error.message);
  return token;
}

/** Reuse the newest unexpired token, or mint one. Used when re-sending emails. */
export async function latestToken(memberId: string): Promise<string> {
  const { data } = await db()
    .from("email_tokens")
    .select("token, expires_at")
    .eq("member_id", memberId)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.token ?? issueToken(memberId);
}

export async function getMemberByToken(token: string): Promise<MemberRow | null> {
  if (!verifyTokenSignature(token)) return null;
  const { data } = await db()
    .from("email_tokens")
    .select("member_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
  return getMemberById(data.member_id);
}

/** Confirm the pending referral for a referred member (deposit paid). No-op if none. */
export async function confirmReferralFor(referredId: string): Promise<void> {
  await db()
    .from("referrals")
    .update({ confirmed_at: new Date().toISOString(), revoked_at: null })
    .eq("referred_id", referredId)
    .is("confirmed_at", null);
}

/** Revoke referral credit when a deposit is refunded. */
export async function revokeReferralFor(referredId: string): Promise<void> {
  await db()
    .from("referrals")
    .update({ revoked_at: new Date().toISOString() })
    .eq("referred_id", referredId)
    .is("revoked_at", null);
}

async function loadStandingInputs() {
  const client = db();
  const [{ data: members, error }, { data: counts }] = await Promise.all([
    client.from("members").select("id, tier, created_at").order("created_at", { ascending: true }),
    client.from("member_referral_counts").select("*"),
  ]);
  if (error) throw new Error(error.message);
  const countMap = new Map<string, number>();
  for (const c of counts ?? []) countMap.set(c.referrer_id, c.total);
  return (members ?? []).map((m) => ({
    id: m.id,
    tier: m.tier as Tier,
    createdAt: m.created_at,
    confirmedReferrals: countMap.get(m.id) ?? 0,
  }));
}

export async function getStanding(memberId: string): Promise<Standing | null> {
  const inputs = await loadStandingInputs();
  return computeStandings(inputs).get(memberId) ?? null;
}

export async function getAllStandings(): Promise<Map<string, Standing>> {
  return computeStandings(await loadStandingInputs());
}

/** How many members ranked ahead of this one have at least one confirmed referral. */
export async function countReferredAhead(memberId: string): Promise<number> {
  const standings = await getAllStandings();
  const me = standings.get(memberId);
  if (!me) return 0;
  let n = 0;
  for (const s of standings.values()) {
    if (s.position < me.position && s.confirmedReferrals > 0) n++;
  }
  return n;
}

export async function getReferralCounts(memberId: string): Promise<ReferralCounts> {
  const { data } = await db()
    .from("member_referral_counts")
    .select("*")
    .eq("referrer_id", memberId)
    .maybeSingle();
  return {
    total: data?.total ?? 0,
    deposit: data?.deposit_count ?? 0,
    free: data?.free_count ?? 0,
  };
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardRow[]> {
  const { data } = await db().from("leaderboard").select("*").limit(limit);
  return data ?? [];
}

export async function getLatestReservation(memberId: string): Promise<ReservationRow | null> {
  const { data } = await db()
    .from("reservations")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export function displayName(m: { first_name: string | null; last_initial: string | null }): string {
  if (!m.first_name) return "Anonymous";
  return m.last_initial ? `${m.first_name} ${m.last_initial}.` : m.first_name;
}

/** Split "Ada Lovelace" into first name and last initial. */
export function splitName(name: string): { firstName: string; lastInitial: string | null } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = (parts[0] ?? "").slice(0, 40);
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const lastInitial = last ? last[0].toUpperCase() : null;
  return { firstName, lastInitial };
}
