import Link from "next/link";
import { FAQ, PRICING, STEPS, WHY_BAY } from "@/lib/content";

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs uppercase tracking-[0.25em] text-stone">{eyebrow}</p>
      <h2 className="mt-2 text-3xl text-ink sm:text-4xl">{title}</h2>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="border-t border-sand bg-fog">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading eyebrow="How a session works" title="Three steps, two and a half hours" />
        <ol className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-ink/15 pt-5">
              <p className="font-display text-sm text-cedar">0{i + 1}</p>
              <h3 className="mt-2 text-xl text-ink">{s.title}</h3>
              <p className="mt-2 text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function WhyTheBay() {
  return (
    <section id="why" className="bg-ink text-fog">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-ember">Why the Bay</p>
        <h2 className="mt-2 max-w-2xl text-3xl sm:text-4xl">Cold plunge in San Francisco Bay, twelve months a year</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {WHY_BAY.map((w) => (
            <div key={w.title} className="border-t border-fog/20 pt-5">
              <h3 className="text-xl">{w.title}</h3>
              <p className="mt-2 text-fog/75">{w.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingPreview() {
  return (
    <section id="pricing" className="bg-fog">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading eyebrow="Pricing preview" title="What a session costs" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-sand bg-white/60 p-6">
            <p className="text-sm text-stone">{PRICING.privateLabel}</p>
            <p className="mt-2 font-display text-4xl text-ink">{PRICING.privatePrice}</p>
            <p className="mt-2 text-sm text-stone">{PRICING.privateDetail}</p>
          </div>
          <div className="rounded-2xl border border-dashed border-sand p-6">
            <p className="text-sm text-stone">{PRICING.communalLabel}</p>
            <p className="mt-2 font-display text-4xl text-stone/70">Coming later</p>
            <p className="mt-2 text-sm text-stone">{PRICING.communalDetail}</p>
          </div>
          <div className="rounded-2xl border border-cedar/40 bg-ember/20 p-6">
            <p className="text-sm text-stone">{PRICING.depositLabel}</p>
            <p className="mt-2 font-display text-4xl text-ink">{PRICING.depositPrice}</p>
            <p className="mt-2 text-sm text-stone">{PRICING.depositDetail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ReserveBlock() {
  return (
    <section id="reserve" className="border-y border-sand bg-sand/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone">Reserve</p>
          <h2 className="mt-2 text-3xl text-ink sm:text-4xl">Hold a place for the first season</h2>
          <p className="mt-4 max-w-2xl text-stone">
            A {PRICING.depositPrice} refundable deposit puts you ahead of the free list and gets you a referral link.
            Every person who joins through it moves you up and unlocks rewards, from a priority booking window to a
            free private session. Refund at any time before launch.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href="/reserve"
            data-cta="block_reserve"
            className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3.5 text-fog transition hover:bg-bay"
          >
            Reserve your spot
          </Link>
          <Link
            href="/waitlist"
            data-cta="block_waitlist"
            className="inline-flex items-center justify-center rounded-full border border-ink/25 px-6 py-3.5 text-ink transition hover:border-ink"
          >
            Join the waitlist, free
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="bg-fog">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading eyebrow="Questions" title="Frequently asked" />
        <dl className="divide-y divide-sand">
          {FAQ.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="text-lg text-ink">{f.q}</dt>
              <dd className="mt-2 text-stone">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
