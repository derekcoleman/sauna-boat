import type { Metadata } from "next";
import { ReserveForm } from "@/components/Forms";
import { PageView } from "@/components/PageView";
import { BRAND, DEPOSIT_USD, formatUsd } from "@/lib/config";
import { PRICING } from "@/lib/content";

export const metadata: Metadata = {
  title: "Reserve your spot",
  description: `Hold a place for the first season of ${BRAND} with a ${formatUsd(DEPOSIT_USD)} refundable deposit.`,
  alternates: { canonical: "/reserve" },
  robots: { index: false, follow: true },
};

export default async function ReservePage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_1fr]">
      <PageView path="/reserve" />
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-stone">Founding reservation</p>
        <h1 className="mt-3 text-4xl text-ink sm:text-5xl">Reserve your spot</h1>
        <p className="mt-5 max-w-md text-stone">
          A {PRICING.depositPrice} deposit holds your place for the first season and is applied to your first session.
          It is fully refundable at any time before launch, and refunds automatically if we do not launch.
        </p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-stone">Private session</dt>
            <dd className="text-ink">
              {PRICING.privatePrice}. {PRICING.privateDetail}
            </dd>
          </div>
          <div>
            <dt className="text-stone">Season</dt>
            <dd className="text-ink">Tell us when in 2027 you would like to go. Not a booking, just a preference.</dd>
          </div>
          <div>
            <dt className="text-stone">After you pay</dt>
            <dd className="text-ink">You get a referral link. Each person who joins through it moves you up ten places.</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-2xl border border-sand bg-white/60 p-6 sm:p-8">
        {cancelled ? (
          <p role="status" className="mb-5 rounded-xl bg-sand/60 px-4 py-3 text-sm text-ink">
            Checkout was cancelled. Nothing was charged. You can try again below.
          </p>
        ) : null}
        <ReserveForm depositLabel={PRICING.depositPrice} />
      </div>
    </div>
  );
}
