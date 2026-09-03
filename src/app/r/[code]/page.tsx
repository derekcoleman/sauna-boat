import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { BRAND } from "@/lib/config";
import { getMemberByCode } from "@/lib/members";
import { normalizeReferralCode } from "@/lib/referral";
import { isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ code: string }> };

async function lookup(raw: string) {
  const code = normalizeReferralCode(decodeURIComponent(raw));
  if (!code || !isSupabaseConfigured()) return { code, member: null };
  try {
    return { code, member: await getMemberByCode(code) };
  } catch {
    return { code, member: null };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const { member } = await lookup(code);
  const who = member?.first_name ? `${member.first_name} saved you a spot` : "You have been invited";
  const title = `${who} on ${BRAND}`;
  return {
    title,
    description: "A captained sauna boat with cold plunges on San Francisco Bay, launching 2027. Reserve or join the waitlist to jump the line.",
    robots: { index: false, follow: false },
    alternates: { canonical: "/" },
    openGraph: {
      title,
      url: `/r/${member?.referral_code ?? ""}`,
      images: [member ? `/api/og?code=${member.referral_code}` : "/api/og"],
    },
  };
}

export default async function ReferralPage({ params }: Props) {
  const { code } = await params;
  const { member } = await lookup(code);
  return <LandingPage refCode={member?.referral_code ?? null} referrerFirstName={member?.first_name ?? null} />;
}
