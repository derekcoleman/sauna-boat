import { BRAND } from "./config";

export type ShareChannel = "copy" | "sms" | "whatsapp" | "x" | "linkedin" | "email";

/** First-person, short, no exclamation points. */
export function shareText(tier: "waitlist" | "reserved", link: string): string {
  const verb = tier === "reserved" ? "I reserved a spot on" : "I joined the list for";
  return `${verb} a sauna boat that sails SF Bay, cold plunge included. Launching 2027: ${link}`;
}

export function shareSubject(): string {
  return `A sauna boat on SF Bay, launching 2027`;
}

export function shareUrl(channel: ShareChannel, text: string, link: string): string {
  const enc = encodeURIComponent;
  switch (channel) {
    case "sms":
      // `&body=` is the widely supported form on both iOS and Android.
      return `sms:?&body=${enc(text)}`;
    case "whatsapp":
      return `https://wa.me/?text=${enc(text)}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${enc(text)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`;
    case "email":
      return `mailto:?subject=${enc(shareSubject())}&body=${enc(text)}`;
    case "copy":
      return link;
  }
}

export const SHARE_CHANNELS: { channel: ShareChannel; label: string }[] = [
  { channel: "copy", label: "Copy link" },
  { channel: "sms", label: "Message" },
  { channel: "whatsapp", label: "WhatsApp" },
  { channel: "x", label: "X" },
  { channel: "linkedin", label: "LinkedIn" },
  { channel: "email", label: "Email" },
];

export function referralBannerText(firstName: string | null): string {
  const who = firstName || `A ${BRAND} member`;
  return `${who} saved you a spot. Reserve or join to jump the line.`;
}
