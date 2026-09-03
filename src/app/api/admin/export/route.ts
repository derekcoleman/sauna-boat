import type { NextRequest } from "next/server";
import { db } from "@/lib/supabase";
import { getAllStandings } from "@/lib/members";

function csv(rows: (string | number | null | boolean)[][]): string {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = v == null ? "" : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

/** Protected by basic auth in src/proxy.ts. */
export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("type") === "reservations" ? "reservations" : "members";
  const client = db();
  const standings = await getAllStandings();

  if (kind === "reservations") {
    const { data } = await client
      .from("reservations")
      .select("*, members(email, first_name, last_initial, referral_code)")
      .order("created_at", { ascending: false });
    const rows: (string | number | null)[][] = [
      ["reservation_id", "email", "name", "referral_code", "status", "amount_usd", "party_size", "preferred_season", "created_at", "paid_at", "refunded_at", "stripe_checkout_session_id", "stripe_payment_intent_id"],
    ];
    for (const r of data ?? []) {
      const m = r.members as unknown as { email: string; first_name: string | null; last_initial: string | null; referral_code: string } | null;
      rows.push([
        r.id,
        m?.email ?? "",
        [m?.first_name, m?.last_initial].filter(Boolean).join(" "),
        m?.referral_code ?? "",
        r.status,
        (r.amount_cents / 100).toFixed(2),
        r.party_size,
        r.preferred_season,
        r.created_at,
        r.paid_at,
        r.refunded_at,
        r.stripe_checkout_session_id,
        r.stripe_payment_intent_id,
      ]);
    }
    return csvResponse(csv(rows), "reservations.csv");
  }

  const [{ data: members }, { data: counts }] = await Promise.all([
    client.from("members").select("*").order("created_at", { ascending: true }),
    client.from("member_referral_counts").select("*"),
  ]);
  const countMap = new Map((counts ?? []).map((c) => [c.referrer_id, c]));
  const rows: (string | number | null | boolean)[][] = [
    ["member_id", "email", "first_name", "last_initial", "tier", "position", "referral_code", "referred_by", "referrals_total", "referrals_deposit", "referrals_free", "leaderboard_opt_in", "created_at"],
  ];
  for (const m of members ?? []) {
    const c = countMap.get(m.id);
    rows.push([
      m.id,
      m.email,
      m.first_name,
      m.last_initial,
      m.tier,
      standings.get(m.id)?.position ?? null,
      m.referral_code,
      m.referred_by,
      c?.total ?? 0,
      c?.deposit_count ?? 0,
      c?.free_count ?? 0,
      m.leaderboard_opt_in,
      m.created_at,
    ]);
  }
  return csvResponse(csv(rows), "members.csv");
}

function csvResponse(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
