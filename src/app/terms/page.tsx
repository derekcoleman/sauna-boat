import type { Metadata } from "next";
import { BRAND, DEPOSIT_USD, LAUNCH_YEAR, REF_COOKIE_DAYS, formatUsd } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms, refunds, referrals, and privacy",
  description: `Deposit terms, refund policy, referral program rules, and privacy policy for ${BRAND}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <h1 className="text-4xl text-ink">Terms</h1>
      <p className="mt-4 text-stone">Last updated September 2026. Plain language on purpose.</p>

      <section id="deposit" className="mt-10">
        <h2 className="text-2xl text-ink">Deposit terms</h2>
        <div className="mt-3 space-y-3 text-stone">
          <p>
            A founding reservation is a {formatUsd(DEPOSIT_USD)} deposit paid by card. It holds a place in line for
            bookings during the first season and is applied to the price of your first session with {BRAND}.
          </p>
          <p>
            The vessel is under development. We are targeting {LAUNCH_YEAR} and do not guarantee a launch date, a
            specific marina, or a specific vessel configuration. A deposit is not a booking for a date.
          </p>
          <p>Private session pricing shown on this site is a preview and may change before launch.</p>
        </div>
      </section>

      <section id="refunds" className="mt-10">
        <h2 className="text-2xl text-ink">Refund policy</h2>
        <div className="mt-3 space-y-3 text-stone">
          <p>
            Deposits are fully refundable at any time before launch, for any reason. Request a refund from your status
            page or by replying to any email from us. We refund to the original card within ten business days.
          </p>
          <p>If we do not launch, every outstanding deposit is refunded automatically without a request.</p>
          <p>
            Refunding a deposit ends your founding reservation and any referral credit earned by the person who referred
            you. You keep a place on the free waitlist.
          </p>
        </div>
      </section>

      <section id="referrals" className="mt-10">
        <h2 className="text-2xl text-ink">Referral program rules</h2>
        <div className="mt-3 space-y-3 text-stone">
          <p>
            Every member gets a referral link. A referral is confirmed when the referred person completes a signup
            (free waitlist or paid deposit) within {REF_COOKIE_DAYS} days of opening your link. Referring yourself, using
            the same device, or using disposable email addresses does not count.
          </p>
          <p>
            Rewards are earned by confirmed referrals: one referral for a 48-hour priority booking window, three for a
            free cold plunge add-on for a guest, five for 20 percent off your first session, ten for one free private
            session for up to six guests. The top ten referrers at launch receive founding member status: a name on the
            boat and a lifetime 20 percent discount.
          </p>
          <p>
            Rewards are non-transferable, have no cash value, and are subject to change before launch. Referral credit
            is revoked if the referred deposit is refunded. Position on the list is recalculated continuously and is
            not a guarantee of a booking date.
          </p>
        </div>
      </section>

      <section id="privacy" className="mt-10">
        <h2 className="text-2xl text-ink">Privacy policy</h2>
        <div className="mt-3 space-y-3 text-stone">
          <p>
            We collect your email, and for reservations your name, party size, and season preference. We use them to
            manage your place in line, send the emails described on this site, and contact you about launch. We do not
            sell or share your data with third parties for their marketing.
          </p>
          <p>
            Payments are processed by Stripe. We never see or store your card number. Email is delivered through
            Resend. Site analytics are collected by Vercel Analytics and our own event log, which records page views,
            button clicks, and share clicks without third-party ad tracking.
          </p>
          <p>
            Cookies: a referral cookie ({REF_COOKIE_DAYS} days) attributes signups to the person who shared a link, and a
            first-party visitor id (one year) prevents self-referral. Neither is shared with anyone.
          </p>
          <p>
            If you opt in, your first name, last initial, and referral count appear on the public leaderboard. You can
            opt out by replying to any email from us. To delete your data, reply to any email from us and we will
            remove it within ten business days.
          </p>
        </div>
      </section>
    </div>
  );
}
