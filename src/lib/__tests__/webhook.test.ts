import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { verifyStripeEvent } from "../webhook";

const secret = "whsec_test_secret_123";
const payload = JSON.stringify({
  id: "evt_test_1",
  object: "event",
  type: "checkout.session.completed",
  data: { object: { id: "cs_test_1", object: "checkout.session" } },
});

function sign(body: string, key: string, timestamp?: number) {
  return Stripe.webhooks.generateTestHeaderString({ payload: body, secret: key, timestamp });
}

describe("verifyStripeEvent", () => {
  it("accepts a correctly signed payload", () => {
    const result = verifyStripeEvent(payload, sign(payload, secret), secret);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.id).toBe("evt_test_1");
      expect(result.event.type).toBe("checkout.session.completed");
    }
  });

  it("rejects a payload signed with a different secret", () => {
    const result = verifyStripeEvent(payload, sign(payload, "whsec_other"), secret);
    expect(result.ok).toBe(false);
  });

  it("rejects a tampered body", () => {
    const header = sign(payload, secret);
    const tampered = payload.replace("cs_test_1", "cs_test_2");
    expect(verifyStripeEvent(tampered, header, secret).ok).toBe(false);
  });

  it("rejects a stale timestamp", () => {
    const old = Math.floor(Date.now() / 1000) - 60 * 60;
    expect(verifyStripeEvent(payload, sign(payload, secret, old), secret).ok).toBe(false);
  });

  it("rejects a missing header or missing secret", () => {
    expect(verifyStripeEvent(payload, null, secret).ok).toBe(false);
    expect(verifyStripeEvent(payload, sign(payload, secret), undefined).ok).toBe(false);
  });
});
