/**
 * Referral codes: 6 characters from an alphabet with no 0/O/1/I so they are
 * unambiguous when read aloud or typed from a screenshot.
 */

export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

type RandomSource = (size: number) => Uint8Array;

function defaultRandom(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate a code using rejection sampling so every character is uniformly
 * distributed (256 is not a multiple of 32, so a plain modulo would bias).
 */
export function generateReferralCode(random: RandomSource = defaultRandom): string {
  const base = CODE_ALPHABET.length; // 32
  const limit = 256 - (256 % base); // 256, so no rejections for 32 — kept general
  let out = "";
  while (out.length < CODE_LENGTH) {
    const bytes = random(CODE_LENGTH * 2);
    for (const b of bytes) {
      if (b >= limit) continue;
      out += CODE_ALPHABET[b % base];
      if (out.length === CODE_LENGTH) break;
    }
  }
  return out;
}

const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

/** Normalise user input (case, ambiguous glyphs) and validate. Returns null when invalid. */
export function normalizeReferralCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input
    .trim()
    .toUpperCase()
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/[^A-Z2-9]/g, "");
  // Ambiguous glyphs were mapped above only to make regex failure explicit:
  // O and I are not in the alphabet, so a code containing them is rejected.
  return CODE_RE.test(cleaned) ? cleaned : null;
}

export function isValidReferralCode(code: string): boolean {
  return CODE_RE.test(code);
}
