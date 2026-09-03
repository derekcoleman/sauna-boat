import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaderboard, PositionCard, ReferralCard, RewardsProgress } from "@/components/Standing";
import { PageView } from "@/components/PageView";
import { BRAND, DEPOSIT_USD, formatUsd } from "@/lib/config";
import { getLatestReservation, getLeaderboard, getMemberByCode, getReferralCounts, getStanding } from "@/lib/members";
import { normalizeReferralCode } from "@/lib/referral";

type Search = Promise<{ ref?: string; checkout?: string; existing?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { ref } = await searchParams;
  const code = normalizeReferralCode(ref);
  return {
    title: "Welcome aboard",
    description: `Your place in line for ${BRAND}, and your referral link.`,
    robots: { index: false, follow: false },
    openGraph: { title: `${BRAND}: welcome aboard`, images: [code ? `/api/og?code=${code}` : "/api/og"] },
  };
}

export default async function WelcomePage({ searchParams }: { searchParams: Search }) {
  const { ref, checkout, existing } = await searchParams;
  const code = normalizeReferralCode(ref);
  const member = code ? await getMemberByCode(code) : null;
  if (!member) redirect("/waitlist");

  const [standing, counts, leaderboard, reservation] = await Promise.all([
    getStanding(member.id),
    getReferralCounts(member.id),
    getLeaderboard(),
    getLatestReservation(member.id),
  ]);

  let depositLine: string | undefined;
  if (member.tier === "reserved" || reservation?.status === "paid") {
    depositLine = `${formatUsd(DEPOSIT_USD)} deposit received. Fully refundable at any time before launch.`;
  } else if (checkout === "success" && reservation?.status === "pending") {
    depositLine = "Confirming your deposit. This page updates as soon as the payment is confirmed, usually within a minute.";
  }

  const greeting = member.first_name ? `${member.first_name}, you are in.` : "You are in.";

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <PageView path="/welcome" />
      <p className="text-xs uppercase tracking-[0.25em] text-stone">Welcome aboard</p>
      <h1 className="mt-3 text-4xl text-ink sm:text-5xl">{greeting}</h1>
      <p className="mt-4 max-w-2xl text-stone">
        {existing
          ? "You were already on the list, so here is your existing place and link."
          : "Your place is below. The fastest way up the list is the link: send it to the people you would bring."}
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <PositionCard standing={standing} tier={member.tier} depositLine={depositLine} />
        <ReferralCard code={member.referral_code} tier={member.tier} />
        <RewardsProgress counts={counts} />
        <Leaderboard rows={leaderboard} highlightId={member.id} />
      </div>

      <p className="mt-10 text-sm text-stone">
        We emailed a private status link to {member.email}. Use it any time to check your position, referrals, and
        deposit, or to request a refund.{" "}
        {member.tier !== "reserved" ? (
          <>
            Want to rank above the free list?{" "}
            <Link href="/reserve" className="text-ink underline">
              Reserve with a refundable deposit
            </Link>
            .
          </>
        ) : null}
      </p>
    </div>
  );
}
