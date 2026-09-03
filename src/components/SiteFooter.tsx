import Link from "next/link";
import { BRAND, HOME_PORT, LAUNCH_YEAR } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t border-sand bg-sand/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-stone sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="max-w-sm">
          <p className="font-display text-base text-ink">{BRAND}</p>
          <p className="mt-2">
            A captained sauna boat on Richardson Bay, {HOME_PORT}. Launching {LAUNCH_YEAR}. The vessel is under
            development and every deposit is fully refundable at any time.
          </p>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-ink">
            Terms
          </Link>
          <Link href="/terms#refunds" className="inline-flex min-h-11 items-center hover:text-ink">
            Refund policy
          </Link>
          <Link href="/terms#referrals" className="inline-flex min-h-11 items-center hover:text-ink">
            Referral rules
          </Link>
          <Link href="/terms#privacy" className="inline-flex min-h-11 items-center hover:text-ink">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
