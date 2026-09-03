/**
 * Seed a handful of members, referrals, and reservations for local development.
 *
 *   npm run db:seed
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * Safe to re-run: seeded rows are keyed by email and upserted.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

type Seed = {
  email: string;
  first: string;
  last: string;
  code: string;
  tier: "waitlist" | "reserved";
  referredBy?: string; // email
  daysAgo: number;
  optIn?: boolean;
};

const seeds: Seed[] = [
  { email: "ada@example.com", first: "Ada", last: "Lovelace", code: "ADA234", tier: "reserved", daysAgo: 30 },
  { email: "grace@example.com", first: "Grace", last: "Hopper", code: "GRC567", tier: "reserved", daysAgo: 28 },
  { email: "linus@example.com", first: "Linus", last: "Torvalds", code: "LNS789", tier: "waitlist", daysAgo: 27, referredBy: "ada@example.com" },
  { email: "margaret@example.com", first: "Margaret", last: "Hamilton", code: "MGH345", tier: "reserved", daysAgo: 25, referredBy: "ada@example.com" },
  { email: "ken@example.com", first: "Ken", last: "Thompson", code: "KEN456", tier: "waitlist", daysAgo: 20, referredBy: "grace@example.com" },
  { email: "dennis@example.com", first: "Dennis", last: "Ritchie", code: "DMR678", tier: "waitlist", daysAgo: 18 },
  { email: "barbara@example.com", first: "Barbara", last: "Liskov", code: "BLK789", tier: "reserved", daysAgo: 12, referredBy: "ada@example.com", optIn: false },
  { email: "alan@example.com", first: "Alan", last: "Kay", code: "ALK234", tier: "waitlist", daysAgo: 10, referredBy: "linus@example.com" },
  { email: "radia@example.com", first: "Radia", last: "Perlman", code: "RDP345", tier: "waitlist", daysAgo: 6 },
  { email: "frances@example.com", first: "Frances", last: "Allen", code: "FRA567", tier: "waitlist", daysAgo: 3, referredBy: "grace@example.com" },
  { email: "anon@example.com", first: "", last: "", code: "ANN678", tier: "waitlist", daysAgo: 1 },
];

async function main() {
  const ids = new Map<string, string>();

  for (const s of seeds) {
    const { data, error } = await db
      .from("members")
      .upsert(
        {
          email: s.email,
          first_name: s.first || null,
          last_initial: s.last ? s.last[0] : null,
          referral_code: s.code,
          tier: s.tier,
          leaderboard_opt_in: s.optIn ?? true,
          created_at: daysAgo(s.daysAgo),
        },
        { onConflict: "email" },
      )
      .select("id")
      .single();
    if (error) throw error;
    ids.set(s.email, data.id);
  }

  for (const s of seeds) {
    const id = ids.get(s.email)!;
    if (s.referredBy) {
      const referrer = ids.get(s.referredBy)!;
      await db.from("members").update({ referred_by: referrer }).eq("id", id);
      const { error } = await db
        .from("referrals")
        .upsert(
          { referrer_id: referrer, referred_id: id, confirmed_at: daysAgo(s.daysAgo), revoked_at: null },
          { onConflict: "referred_id" },
        );
      if (error) throw error;
    }
    if (s.tier === "reserved") {
      const { data: existing } = await db.from("reservations").select("id").eq("member_id", id).maybeSingle();
      if (!existing) {
        const { error } = await db.from("reservations").insert({
          member_id: id,
          stripe_checkout_session_id: `cs_test_seed_${s.code}`,
          stripe_payment_intent_id: `pi_test_seed_${s.code}`,
          party_size: 2 + (s.code.charCodeAt(0) % 4),
          preferred_season: ["winter", "spring", "summer", "fall"][s.code.charCodeAt(1) % 4],
          status: "paid",
          amount_cents: Number(process.env.NEXT_PUBLIC_DEPOSIT_USD ?? 250) * 100,
          created_at: daysAgo(s.daysAgo),
          paid_at: daysAgo(s.daysAgo),
        });
        if (error) throw error;
      }
    }
  }

  await db.from("events").insert([
    { type: "page_view", payload: { path: "/", ref: "ADA234" } },
    { type: "page_view", payload: { path: "/" } },
    { type: "cta_click", payload: { cta: "reserve" } },
    { type: "share_click", payload: { channel: "sms" }, member_id: ids.get("ada@example.com") },
  ]);

  console.log(`Seeded ${seeds.length} members. Try /welcome?ref=ADA234 or /r/ADA234.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
