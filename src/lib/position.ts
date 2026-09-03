/**
 * Position is computed, never stored.
 *
 * Rules from the brief:
 *  - base position by signup order
 *  - subtract referrals × 5 for waitlist members, referrals × 10 for deposit holders
 *  - deposit holders always rank above free members
 */

export type Tier = "waitlist" | "reserved";

export interface StandingInput {
  id: string;
  tier: Tier;
  createdAt: string | Date;
  confirmedReferrals: number;
}

export interface Standing {
  id: string;
  tier: Tier;
  position: number;
  total: number;
  confirmedReferrals: number;
  /** Signup order, 1-based, before referral boosts. */
  signupIndex: number;
  /** Positions gained purely from referrals. */
  boost: number;
}

export const WAITLIST_BOOST = 5;
export const RESERVED_BOOST = 10;

export function boostFor(tier: Tier, referrals: number): number {
  return referrals * (tier === "reserved" ? RESERVED_BOOST : WAITLIST_BOOST);
}

function ts(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/**
 * Compute standings for every member. O(n log n); fine for the scale of a
 * presale list. Returns a Map keyed by member id.
 */
export function computeStandings(members: StandingInput[]): Map<string, Standing> {
  const ordered = [...members].sort((a, b) => {
    const d = ts(a.createdAt) - ts(b.createdAt);
    return d !== 0 ? d : a.id.localeCompare(b.id);
  });

  const scored = ordered.map((m, i) => {
    const signupIndex = i + 1;
    const boost = boostFor(m.tier, m.confirmedReferrals);
    return { m, signupIndex, boost, score: signupIndex - boost };
  });

  scored.sort((a, b) => {
    // Deposit holders first, always.
    if (a.m.tier !== b.m.tier) return a.m.tier === "reserved" ? -1 : 1;
    if (a.score !== b.score) return a.score - b.score;
    return a.signupIndex - b.signupIndex;
  });

  const total = scored.length;
  const out = new Map<string, Standing>();
  scored.forEach((s, i) => {
    out.set(s.m.id, {
      id: s.m.id,
      tier: s.m.tier,
      position: i + 1,
      total,
      confirmedReferrals: s.m.confirmedReferrals,
      signupIndex: s.signupIndex,
      boost: s.boost,
    });
  });
  return out;
}

export function standingFor(members: StandingInput[], id: string): Standing | null {
  return computeStandings(members).get(id) ?? null;
}

/** Reward ladder by confirmed referrals. Order matters: ascending thresholds. */
export const REWARD_TIERS = [
  { referrals: 1, title: "Priority booking window", detail: "Book 48 hours before the public." },
  { referrals: 3, title: "Free cold plunge add-on", detail: "One add-on session for a guest." },
  { referrals: 5, title: "20% off your first session", detail: "Applied at booking." },
  { referrals: 10, title: "One free private session", detail: "Up to six guests." },
] as const;

export const FOUNDING_MEMBER = {
  title: "Founding member",
  detail: "Top 10 referrers at launch. Name on the boat, lifetime 20% off.",
};

export interface RewardProgress {
  unlocked: (typeof REWARD_TIERS)[number][];
  next: (typeof REWARD_TIERS)[number] | null;
  /** 0..1 progress from the previous tier toward the next. */
  progress: number;
  remaining: number;
}

export function rewardProgress(referrals: number): RewardProgress {
  const unlocked = REWARD_TIERS.filter((t) => referrals >= t.referrals);
  const next = REWARD_TIERS.find((t) => referrals < t.referrals) ?? null;
  if (!next) return { unlocked, next: null, progress: 1, remaining: 0 };
  const prev = unlocked.length ? unlocked[unlocked.length - 1].referrals : 0;
  const span = next.referrals - prev;
  return {
    unlocked,
    next,
    progress: Math.min(1, Math.max(0, (referrals - prev) / span)),
    remaining: next.referrals - referrals,
  };
}
