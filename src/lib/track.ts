/** Browser-side event logging. Never throws, never blocks. */
export function track(type: "page_view" | "cta_click" | "share_click", payload: Record<string, unknown>, code?: string) {
  try {
    const body = JSON.stringify({ type, payload, code });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
    }
  } catch {
    // ignore
  }
}
