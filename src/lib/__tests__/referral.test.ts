import { describe, expect, it } from "vitest";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  generateReferralCode,
  isValidReferralCode,
  normalizeReferralCode,
} from "../referral";

describe("generateReferralCode", () => {
  it("produces 6 characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 500; i++) {
      const code = generateReferralCode();
      expect(code).toHaveLength(CODE_LENGTH);
      for (const ch of code) expect(CODE_ALPHABET).toContain(ch);
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it("is deterministic given a random source and uses every byte uniformly", () => {
    const seq = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const code = generateReferralCode(() => seq);
    expect(code).toBe("ABCDEF");
    // 255 % 32 = 31 -> last alphabet char
    const high = Uint8Array.from([255, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0]);
    expect(generateReferralCode(() => high)).toBe("999999");
  });

  it("collides rarely", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20_000; i++) seen.add(generateReferralCode());
    expect(seen.size).toBeGreaterThan(19_990);
  });
});

describe("normalizeReferralCode", () => {
  it("accepts lowercase and surrounding whitespace", () => {
    expect(normalizeReferralCode("  abc234 ")).toBe("ABC234");
  });
  it("rejects codes containing ambiguous characters", () => {
    expect(normalizeReferralCode("ABC0DE")).toBeNull();
    expect(normalizeReferralCode("ABC1DE")).toBeNull();
    expect(normalizeReferralCode("ABCODE")).toBeNull();
    expect(normalizeReferralCode("ABCIDE")).toBeNull();
  });
  it("rejects wrong lengths and empties", () => {
    expect(normalizeReferralCode("ABCDE")).toBeNull();
    expect(normalizeReferralCode("ABCDEFG")).toBeNull();
    expect(normalizeReferralCode("")).toBeNull();
    expect(normalizeReferralCode(null)).toBeNull();
  });
  it("validates strictly", () => {
    expect(isValidReferralCode("ABC234")).toBe(true);
    expect(isValidReferralCode("abc234")).toBe(false);
  });
});
