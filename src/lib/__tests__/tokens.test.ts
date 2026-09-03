import { describe, expect, it } from "vitest";
import { createToken, verifyTokenSignature } from "../tokens";

const key = "unit-test-secret-key-0123456789";

describe("magic-link tokens", () => {
  it("round-trips a signed token", () => {
    const { token, expiresAt } = createToken(key);
    expect(verifyTokenSignature(token, key)).toBe(true);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
  it("rejects tampering, wrong keys, and junk", () => {
    const { token } = createToken(key);
    expect(verifyTokenSignature(token, "another-secret-key-0123456789")).toBe(false);
    expect(verifyTokenSignature(token.slice(0, -1) + "x", key)).toBe(false);
    expect(verifyTokenSignature("zzz", key)).toBe(false);
    expect(verifyTokenSignature("", key)).toBe(false);
  });
  it("fails closed without a key", () => {
    const { token } = createToken(key);
    expect(verifyTokenSignature(token, null)).toBe(false);
    expect(() => createToken(null)).toThrow();
  });
});
