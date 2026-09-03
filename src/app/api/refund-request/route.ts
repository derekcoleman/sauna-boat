import type { NextRequest } from "next/server";
import { getLatestReservation, getMemberByToken } from "@/lib/members";
import { sendRefundRequest } from "@/lib/email";
import { logEvent } from "@/lib/events";
import { bad, readJson } from "@/lib/request";

export async function POST(request: NextRequest) {
  const body = await readJson<{ token?: string }>(request);
  const token = String(body?.token ?? "");
  const member = token ? await getMemberByToken(token) : null;
  if (!member) return bad("This link is not valid.", 401);

  const reservation = await getLatestReservation(member.id);
  if (!reservation || reservation.status !== "paid") return bad("There is no paid deposit on this account.");

  await sendRefundRequest(member, reservation.id);
  await logEvent("refund_requested", { reservation_id: reservation.id }, member.id);
  return Response.json({ ok: true });
}
