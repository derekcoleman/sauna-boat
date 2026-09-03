import Link from "next/link";
import { BoatIllustration } from "./BoatIllustration";
import { TAGLINE, WHEN_LINE } from "@/lib/content";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-fog">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-8 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone">Sausalito, San Francisco Bay</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.05] text-ink sm:text-5xl lg:text-6xl">{TAGLINE}</h1>
          <p className="mt-6 max-w-xl text-lg text-stone">{WHEN_LINE}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/reserve"
              data-cta="hero_reserve"
              className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3.5 text-base text-fog transition hover:bg-bay"
            >
              Reserve your spot
            </Link>
            <Link
              href="/waitlist"
              data-cta="hero_waitlist"
              className="inline-flex items-center justify-center rounded-full border border-ink/25 px-6 py-3.5 text-base text-ink transition hover:border-ink"
            >
              Join the waitlist, free
            </Link>
          </div>
        </div>
        <figure className="m-0">
          <div className="aspect-[1200/520] w-full overflow-hidden rounded-2xl border border-sand">
            <BoatIllustration className="h-full w-full" />
          </div>
          <figcaption className="mt-2 text-xs text-stone">
            Placeholder illustration. Replace with original artwork before launch.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
