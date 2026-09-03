import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { getAllStandings } from "@/lib/members";
import { EVENT_TYPES } from "@/lib/events";
import { formatUsd } from "@/lib/config";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const client = db();
  const [{ data: members }, { data: reservations }, { data: counts }, { data: events }, standings] = await Promise.all([
    client.from("members").select("*").order("created_at", { ascending: false }),
    client.from("reservations").select("*").order("created_at", { ascending: false }),
    client.from("member_referral_counts").select("*"),
    client.from("events").select("type, payload"),
    getAllStandings(),
  ]);

  const countMap = new Map((counts ?? []).map((c) => [c.referrer_id, c]));
  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));
  const paid = (reservations ?? []).filter((r) => r.status === "paid");
  const refunded = (reservations ?? []).filter((r) => r.status === "refunded");
  const paidTotal = paid.reduce((s, r) => s + r.amount_cents, 0) / 100;

  const funnel = new Map<string, number>();
  const shareByChannel = new Map<string, number>();
  for (const e of events ?? []) {
    funnel.set(e.type, (funnel.get(e.type) ?? 0) + 1);
    if (e.type === "share_click") {
      const ch = String((e.payload as { channel?: string }).channel ?? "unknown");
      shareByChannel.set(ch, (shareByChannel.get(ch) ?? 0) + 1);
    }
  }
  const steps: [string, string][] = [
    ["Page views", "page_view"],
    ["Referral visits", "ref_visit"],
    ["CTA clicks", "cta_click"],
    ["Waitlist joins", "waitlist_joined"],
    ["Checkouts started", "checkout_started"],
    ["Checkouts completed", "checkout_completed"],
    ["Share clicks", "share_click"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-3xl text-ink">Admin</h1>
        <div className="flex gap-4 text-sm">
          <a href="/api/admin/export?type=members" className="text-ink underline">
            Export members CSV
          </a>
          <a href="/api/admin/export?type=reservations" className="text-ink underline">
            Export reservations CSV
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Members" value={(members ?? []).length} />
        <Stat label="Deposit holders" value={(members ?? []).filter((m) => m.tier === "reserved").length} />
        <Stat label="Deposits held" value={formatUsd(paidTotal)} />
        <Stat label="Refunded" value={refunded.length} />
      </div>

      <section className="mt-10">
        <h2 className="text-xl text-ink">Funnel</h2>
        <table className="mt-3 w-full max-w-lg text-sm">
          <tbody>
            {steps.map(([label, type]) => (
              <tr key={type} className="border-t border-sand">
                <td className="py-2 text-stone">{label}</td>
                <td className="py-2 text-right text-ink">{(funnel.get(type) ?? 0).toLocaleString()}</td>
              </tr>
            ))}
            {[...shareByChannel.entries()].map(([ch, n]) => (
              <tr key={ch} className="border-t border-sand">
                <td className="py-2 pl-6 text-stone">share: {ch}</td>
                <td className="py-2 text-right text-ink">{n}</td>
              </tr>
            ))}
            {EVENT_TYPES.filter((t) => !steps.some(([, s]) => s === t) && funnel.has(t)).map((t) => (
              <tr key={t} className="border-t border-sand">
                <td className="py-2 text-stone">{t}</td>
                <td className="py-2 text-right text-ink">{funnel.get(t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-10 overflow-x-auto">
        <h2 className="text-xl text-ink">Reservations ({(reservations ?? []).length})</h2>
        <table className="mt-3 w-full min-w-[800px] text-sm">
          <thead className="text-left text-stone">
            <tr>
              <th className="py-2 font-normal">Email</th>
              <th className="py-2 font-normal">Name</th>
              <th className="py-2 font-normal">Status</th>
              <th className="py-2 font-normal">Amount</th>
              <th className="py-2 font-normal">Party</th>
              <th className="py-2 font-normal">Season</th>
              <th className="py-2 font-normal">Created</th>
              <th className="py-2 font-normal">Payment intent</th>
            </tr>
          </thead>
          <tbody>
            {(reservations ?? []).map((r) => {
              const m = memberMap.get(r.member_id);
              return (
                <tr key={r.id} className="border-t border-sand">
                  <td className="py-2">{m?.email}</td>
                  <td className="py-2">{[m?.first_name, m?.last_initial].filter(Boolean).join(" ")}</td>
                  <td className="py-2 capitalize">{r.status}</td>
                  <td className="py-2">{formatUsd(r.amount_cents / 100)}</td>
                  <td className="py-2">{r.party_size}</td>
                  <td className="py-2 capitalize">{r.preferred_season}</td>
                  <td className="py-2">{new Date(r.created_at).toLocaleDateString("en-US")}</td>
                  <td className="py-2 font-mono text-xs">{r.stripe_payment_intent_id ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mt-10 overflow-x-auto">
        <h2 className="text-xl text-ink">Members ({(members ?? []).length})</h2>
        <table className="mt-3 w-full min-w-[900px] text-sm">
          <thead className="text-left text-stone">
            <tr>
              <th className="py-2 font-normal">Pos</th>
              <th className="py-2 font-normal">Email</th>
              <th className="py-2 font-normal">Name</th>
              <th className="py-2 font-normal">Tier</th>
              <th className="py-2 font-normal">Code</th>
              <th className="py-2 font-normal">Referred by</th>
              <th className="py-2 font-normal">Referrals (deposit / free)</th>
              <th className="py-2 font-normal">Leaderboard</th>
              <th className="py-2 font-normal">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(members ?? []).map((m) => {
              const c = countMap.get(m.id);
              return (
                <tr key={m.id} className="border-t border-sand">
                  <td className="py-2">{standings.get(m.id)?.position ?? ""}</td>
                  <td className="py-2">{m.email}</td>
                  <td className="py-2">{[m.first_name, m.last_initial].filter(Boolean).join(" ")}</td>
                  <td className="py-2 capitalize">{m.tier}</td>
                  <td className="py-2 font-mono text-xs">{m.referral_code}</td>
                  <td className="py-2">{m.referred_by ? memberMap.get(m.referred_by)?.email ?? m.referred_by : ""}</td>
                  <td className="py-2">
                    {c?.total ?? 0} ({c?.deposit_count ?? 0} / {c?.free_count ?? 0})
                  </td>
                  <td className="py-2">{m.leaderboard_opt_in ? "yes" : "no"}</td>
                  <td className="py-2">{new Date(m.created_at).toLocaleDateString("en-US")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-sand bg-white/60 p-5">
      <p className="text-sm text-stone">{label}</p>
      <p className="mt-1 font-display text-3xl text-ink">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}
