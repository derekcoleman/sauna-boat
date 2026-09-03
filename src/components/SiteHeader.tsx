import Link from "next/link";
import { BRAND } from "@/lib/config";

export function SiteHeader() {
  return (
    <header className="border-b border-sand/80 bg-fog/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link href="/" className="inline-flex min-h-11 items-center font-display text-lg tracking-tight text-ink">
          {BRAND}
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-5 text-sm text-stone">
          <Link href="/#how" className="hidden min-h-11 items-center px-1 hover:text-ink sm:inline-flex">
            How it works
          </Link>
          <Link href="/#pricing" className="hidden min-h-11 items-center px-1 hover:text-ink sm:inline-flex">
            Pricing
          </Link>
          <Link href="/#faq" className="hidden min-h-11 items-center px-1 hover:text-ink sm:inline-flex">
            FAQ
          </Link>
          <Link
            href="/reserve"
            data-cta="header_reserve"
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm text-fog transition hover:bg-bay"
          >
            Reserve
          </Link>
        </nav>
      </div>
    </header>
  );
}
