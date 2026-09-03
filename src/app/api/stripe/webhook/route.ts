import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { verifyStripeEvent } from "@/lib/webhook";
import { db } from "@/lib/supabase";
import { confirmReferralFor, getMemberById, getStanding, latestToken, revokeReferralFor } from "@/lib/members";
import { sendReservationConfirmed } from "@/lib/email";
import { logEvent } from "@/lib/events";

/**
 * Stripe webhook. The only place payment state is written.
 *  - checkout.session.completed -> reservation paid, member reserved, referral confirmed
 *  - charge.refunded            -> reservation refunded, member back to waitlist, referral revoked
 * Idempotent on event id via the stripe_events table.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const verified = verifyStripeEvent(raw, request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
  if (!verified.ok) return new Response(`Webhook error: ${verified.error}`, { status: 400 });
  const event = verified.event;

  const client = db();
  const { error: dupError } = await client.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dupError) {
    if (dupError.code === "23505") return Response.json({ received: true, duplicate: true });
    return new Response(dupError.message, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    // Release the idempotency key so Stripe's retry can reprocess.
    await client.from("stripe_events").delete().eq("id", event.id);
    console.error("[webhook] handler failed", event.type, err);
    return new Response("Handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const reservationId = session.client_reference_id ?? session.metadata?.reservation_id;
  if (!reservationId) return;
  const client = db();

  const { data: reservation } = await client
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .maybeSingle();
  if (!reservation) {
    console.warn("[webhook] no reservation for session", session.id);
    return;
  }
  if (reservation.status === "paid") return;

  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const customer = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  await client
    .from("reservations")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntent,
      stripe_customer_id: customer,
      amount_cents: session.amount_total ?? reservation.amount_cents,
    })
    .eq("id", reservation.id);

  await client.from("members").update({ tier: "reserved" }).eq("id", reservation.member_id);
  await confirmReferralFor(reservation.member_id);
  await logEvent("checkout_completed", { reservation_id: reservation.id, amount_cents: session.amount_total }, reservation.member_id);

  const member = await getMemberById(reservation.member_id);
  if (!member) return;
  const [standing, token] = await Promise.all([getStanding(member.id), latestToken(member.id)]);
  await sendReservationConfirmed(
    { email: member.email, firstName: member.first_name, referralCode: member.referral_code, token, standing },
    reservation.party_size,
  );
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!charge.refunded) return; // partial refund: keep the reservation
  const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntent) return;
  const client = db();

  const { data: reservation } = await client
    .from("reservations")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntent)
    .maybeSingle();
  if (!reservation || reservation.status === "refunded") return;

  await client
    .from("reservations")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", reservation.id);

  const { count } = await client
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("member_id", reservation.member_id)
    .eq("status", "paid");
  if (!count) {
    await client.from("members").update({ tier: "waitlist" }).eq("id", reservation.member_id);
    await revokeReferralFor(reservation.member_id);
  }
  await logEvent("checkout_refunded", { reservation_id: reservation.id }, reservation.member_id);
}
