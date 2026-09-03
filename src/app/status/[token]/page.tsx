import type { Metadata } from "next";
import Link from "next/link";
import { Leaderboard, PositionCard, ReferralCard, RewardsProgress } from "@/components/Standing";
import { RefundButton } from "@/components/Forms";
import { PageView } from "@/components/PageView";
import { BRAND, formatUsd } from "@/lib/config";
import { SEASON_LABELS } from "@/lib/content";
import { getLatestReservation, getLeaderboard, getMemberByToken, getReferralCounts, getStanding } from "@/lib/members";

export const metadata: Metadata = {
  title: "Your status",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function StatusPage({ params }: Props) {
  const { token } = await params;
  const member = await getMemberByToken(token);

  if (!member) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
        <h1 className="text-3xl text-ink">This link is not valid</h1>
        <p className="mt-4 text-stone">
          Status links expire after six months. Join again with the same email and we will send a fresh one, or
          reply to any email from {BRAND}.
        </p>
        <Link href="/waitlist" className="mt-6 inline-block text-ink underline">
          Go to the waitlist
        </Link>
      </div>
    );
  }

  const [standing, counts, leaderboard, reservation] = await Promise.all([
    getStanding(member.id),
    getReferralCounts(member.id),
    getLeaderboard(),
    getLatestReservation(member.id),
  ]);

  const status = reservation?.status ?? "none";
  const depositLine =
    status === "paid"
      ? `${formatUsd(reservation!.amount_cents / 100)} deposit received on ${new Date(reservation!.paid_at ?? reservation!.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}.`
      : status === "refunded"
        ? "Deposit refunded. You keep a place on the free list."
        : status === "pending"
          ? "A reservation was started but the deposit has not been confirmed."
          : undefined;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <PageView path="/status" />
      <p className="text-xs uppercase tracking-[0.25em] text-stone">Status</p>
      <h1 className="mt-3 text-4xl text-ink sm:text-5xl">{member.first_name ? `${member.first_name}'s place` : "Your place"}</h1>
      <p className="mt-4 text-stone">{member.email}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <PositionCard standing={standing} tier={member.tier} depositLine={depositLine} />
        <ReferralCard code={member.referral_code} tier={member.tier} />
        <RewardsProgress counts={counts} />
        <Leaderboard rows={leaderboard} highlightId={member.id} />
      </div>

      <section className="mt-10 rounded-2xl border border-sand bg-white/60 p-6 sm:p-8">
        <h2 className="text-2xl text-ink">Deposit</h2>
        {reservation ? (
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-stone">Status</dt>
              <dd className="capitalize text-ink">{reservation.status}</dd>
            </div>
            <div>
              <dt className="text-stone">Party size</dt>
              <dd className="text-ink">{reservation.party_size}</dd>
            </div>
            <div>
              <dt className="text-stone">Preferred season</dt>
              <dd className="text-ink">{SEASON_LABELS[reservation.preferred_season]}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-stone">
            No deposit on file. You are on the free list.{" "}
            <Link href="/reserve" className="text-ink underline">
              Reserve with a refundable deposit
            </Link>{" "}
            to rank above it.
          </p>
        )}
        {status === "paid" ? (
          <div className="mt-6">
            <p className="mb-3 text-sm text-stone">
              Refunds are full and available at any time before launch. Requesting one emails us; we process it by
              hand and confirm by email.
            </p>
            <RefundButton token={token} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
