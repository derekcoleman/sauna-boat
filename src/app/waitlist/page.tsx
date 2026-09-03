import type { Metadata } from "next";
import { WaitlistForm } from "@/components/Forms";
import { PageView } from "@/components/PageView";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description: `Join the free waitlist for ${BRAND}, a captained sauna boat on San Francisco Bay launching 2027.`,
  alternates: { canonical: "/waitlist" },
  robots: { index: false, follow: true },
};

export default function WaitlistPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_1fr]">
      <PageView path="/waitlist" />
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-stone">Free</p>
        <h1 className="mt-3 text-4xl text-ink sm:text-5xl">Join the waitlist</h1>
        <p className="mt-5 max-w-md text-stone">
          No deposit. You get a place in line, a referral link, and first word when bookings open. Deposit holders
          always rank ahead of the free list, so if you already know you want to go, reserve instead.
        </p>
      </div>
      <div className="rounded-2xl border border-sand bg-white/60 p-6 sm:p-8">
        <WaitlistForm />
      </div>
    </div>
  );
}
