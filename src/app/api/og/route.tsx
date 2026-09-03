import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { BRAND, SITE_HOST } from "@/lib/config";
import { getMemberByCode, getStanding } from "@/lib/members";
import { normalizeReferralCode } from "@/lib/referral";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = normalizeReferralCode(request.nextUrl.searchParams.get("code"));
  let firstName: string | null = null;
  let position: number | null = null;
  let total: number | null = null;
  let tier: "waitlist" | "reserved" = "waitlist";

  if (code && isSupabaseConfigured()) {
    try {
      const member = await getMemberByCode(code);
      if (member) {
        firstName = member.first_name;
        tier = member.tier;
        const s = await getStanding(member.id);
        if (s) {
          position = s.position;
          total = s.total;
        }
      }
    } catch (err) {
      console.warn("[og] lookup failed", err);
    }
  }

  const headline = firstName
    ? tier === "reserved"
      ? `${firstName} reserved a spot`
      : `${firstName} is on the list`
    : "A sauna boat on San Francisco Bay";
  const sub = position && total ? `#${position.toLocaleString()} of ${total.toLocaleString()}` : "Launching 2027, Sausalito";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(180deg, #0f1b26 0%, #1b3140 70%, #274a5c 100%)",
          color: "#f5f2ec",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, textTransform: "uppercase", opacity: 0.8 }}>
          {BRAND}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 76, lineHeight: 1.05, maxWidth: 1000 }}>{headline}</div>
          <div style={{ display: "flex", fontSize: 40, color: "#e6b98a" }}>{sub}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, opacity: 0.85 }}>
          <span>Wood-fired sauna. Captained. Cold plunge into the Bay.</span>
          <span>{SITE_HOST}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    },
  );
}
