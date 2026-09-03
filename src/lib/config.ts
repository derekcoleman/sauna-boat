/**
 * Central configuration. Every placeholder from the brief is env-driven with a
 * sensible default so the app runs with nothing but Supabase and Stripe keys.
 */

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Sauna Boat";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

/** Bare host used when we print a referral link, e.g. "saunaboat.com/r/ABC234". */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

export const DEPOSIT_USD = num(process.env.NEXT_PUBLIC_DEPOSIT_USD, 250);
export const DEPOSIT_CENTS = Math.round(DEPOSIT_USD * 100);
export const SESSION_PRICE_USD = num(process.env.NEXT_PUBLIC_SESSION_PRICE_USD, 900);

export const LAUNCH_YEAR = "2027";
export const HOME_PORT = "Sausalito";
export const MAX_GUESTS = 6;
export const SESSION_HOURS = 2.5;

export const REF_COOKIE = "sb_ref";
export const VISITOR_COOKIE = "sb_vid";
export const REF_COOKIE_DAYS = 30;

export const SEASONS = ["winter", "spring", "summer", "fall"] as const;
export type Season = (typeof SEASONS)[number];

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || "";
export const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() || `${BRAND} <onboarding@resend.dev>`;

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function referralUrl(code: string): string {
  return `${SITE_URL}/r/${code}`;
}

export function referralDisplay(code: string): string {
  return `${SITE_HOST}/r/${code}`;
}
