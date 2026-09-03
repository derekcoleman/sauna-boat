import Stripe from "stripe";

/**
 * Verify a Stripe webhook signature and parse the event. Kept free of
 * server-only imports so it can be unit tested directly.
 */
export function verifyStripeEvent(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined,
): { ok: true; event: Stripe.Event } | { ok: false; error: string } {
  if (!secret) return { ok: false, error: "STRIPE_WEBHOOK_SECRET is not set" };
  if (!signatureHeader) return { ok: false, error: "Missing stripe-signature header" };
  try {
    const event = Stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
    return { ok: true, event };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid signature" };
  }
}
