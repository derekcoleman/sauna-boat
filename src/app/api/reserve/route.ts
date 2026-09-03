import type { NextRequest } from "next/server";
import { normalizeEmail } from "@/lib/disposable";
import { createMember, getLatestReservation, getMemberByEmail, splitName } from "@/lib/members";
import { db, isSupabaseConfigured } from "@/lib/supabase";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { logEvent } from "@/lib/events";
import { bad, readAttributionCookies, readJson } from "@/lib/request";
import { BRAND, DEPOSIT_CENTS, SEASONS, SITE_URL, type Season } from "@/lib/config";

interface Body {
  name?: string;
  email?: string;
  party_size?: number | string;
  preferred_season?: string;
  leaderboard_opt_in?: boolean;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return bad("Supabase is not configured", 503);
  if (!isStripeConfigured()) return bad("Stripe is not configured", 503);

  const body = await readJson<Body>(request);
  const email = normalizeEmail(String(body?.email ?? ""));
  const name = String(body?.name ?? "").trim();
  const partySize = Number(body?.party_size);
  const season = String(body?.preferred_season ?? "") as Season;

  if (!name) return bad("Enter your name.");
  if (!email) return bad("Enter a valid email address.");
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 6) return bad("Party size must be 1 to 6.");
  if (!SEASONS.includes(season)) return bad("Choose a season.");

  const { firstName, lastInitial } = splitName(name);
  const { refCode, visitorId } = readAttributionCookies(request);

  let member = await getMemberByEmail(email);
  let refCodeForMetadata: string | null = refCode;
  if (member) {
    const latest = await getLatestReservation(member.id);
    if (latest?.status === "paid") {
      return Response.json({ url: `/welcome?ref=${member.referral_code}&existing=1` });
    }
    if (!member.first_name) {
      const { data } = await db()
        .from("members")
        .update({ first_name: firstName, last_initial: lastInitial })
        .eq("id", member.id)
        .select("*")
        .single();
      if (data) member = data;
    }
    refCodeForMetadata = null; // attribution happened at their first signup
  } else {
    const created = await createMember({
      email,
      firstName,
      lastInitial,
      leaderboardOptIn: body?.leaderboard_opt_in !== false,
      visitorId,
      refCode,
      confirmReferralNow: false,
    });
    member = created.member;
  }

  const { data: reservation, error } = await db()
    .from("reservations")
    .insert({
      member_id: member.id,
      party_size: partySize,
      preferred_season: season,
      status: "pending",
      amount_cents: DEPOSIT_CENTS,
    })
    .select("*")
    .single();
  if (error || !reservation) return bad(error?.message ?? "Could not create reservation", 500);

  const metadata = {
    reservation_id: reservation.id,
    member_id: member.id,
    referral_code: refCodeForMetadata ?? "",
    party_size: String(partySize),
    preferred_season: season,
  };

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_creation: "always",
    customer_email: email,
    client_reference_id: reservation.id,
    metadata,
    payment_intent_data: { metadata },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: DEPOSIT_CENTS,
          product_data: {
            name: `${BRAND} Founding Reservation — refundable deposit`,
            description: `Refundable at any time before launch. Party of ${partySize}, ${season} 2027 preferred.`,
          },
        },
      },
    ],
    success_url: `${SITE_URL}/welcome?ref=${member.referral_code}&checkout=success`,
    cancel_url: `${SITE_URL}/reserve?cancelled=1`,
  });

  await db()
    .from("reservations")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", reservation.id);

  await logEvent("checkout_started", { reservation_id: reservation.id, ref: refCode, party_size: partySize }, member.id);

  if (!session.url) return bad("Stripe did not return a checkout URL", 502);
  return Response.json({ url: session.url });
}
