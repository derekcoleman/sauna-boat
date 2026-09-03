import "server-only";
import { db } from "./supabase";

export type EventType =
  | "page_view"
  | "ref_visit"
  | "cta_click"
  | "share_click"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_refunded"
  | "waitlist_joined"
  | "refund_requested"
  | "nudge_sent";

export const EVENT_TYPES: EventType[] = [
  "page_view",
  "ref_visit",
  "cta_click",
  "share_click",
  "checkout_started",
  "checkout_completed",
  "checkout_refunded",
  "waitlist_joined",
  "refund_requested",
  "nudge_sent",
];

export async function logEvent(
  type: EventType,
  payload: Record<string, unknown> = {},
  memberId: string | null = null,
): Promise<void> {
  try {
    await db().from("events").insert({ type, payload, member_id: memberId });
  } catch (err) {
    // Analytics must never break a request.
    console.warn("[events] failed to log", type, err);
  }
}
