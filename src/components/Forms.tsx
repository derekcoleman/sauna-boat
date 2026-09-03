"use client";

import { useState, type FormEvent } from "react";
import { SEASONS } from "@/lib/config";
import { SEASON_LABELS } from "@/lib/content";
import { track } from "@/lib/track";

const input =
  "w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";
const label = "block text-sm text-stone";
const button = "inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-fog transition hover:bg-bay disabled:opacity-60";

async function submit(url: string, body: unknown): Promise<{ url?: string; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({ error: "Something went wrong." }))) as { url?: string; error?: string };
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    track("cta_click", { cta: "waitlist_submit" });
    const r = await submit("/api/waitlist", { email, leaderboard_opt_in: optIn });
    if (r.url) window.location.assign(r.url);
    else {
      setError(r.error ?? "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="wl-email" className={label}>
          Email
        </label>
        <input
          id="wl-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${input} mt-1`}
          placeholder="you@example.com"
        />
      </div>
      <label className="flex items-start gap-3 text-sm text-stone">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-1" />
        <span>Show my first name and last initial on the public leaderboard.</span>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-cedar">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className={button}>
        {busy ? "Joining" : "Join the waitlist"}
      </button>
    </form>
  );
}

export function ReserveForm({ depositLabel }: { depositLabel: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [party, setParty] = useState(2);
  const [season, setSeason] = useState<string>("summer");
  const [optIn, setOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    track("cta_click", { cta: "reserve_submit" });
    const r = await submit("/api/reserve", {
      name,
      email,
      party_size: party,
      preferred_season: season,
      leaderboard_opt_in: optIn,
    });
    if (r.url) window.location.assign(r.url);
    else {
      setError(r.error ?? "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="rs-name" className={label}>
          Name
        </label>
        <input
          id="rs-name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${input} mt-1`}
          placeholder="First and last"
        />
      </div>
      <div>
        <label htmlFor="rs-email" className={label}>
          Email
        </label>
        <input
          id="rs-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${input} mt-1`}
          placeholder="you@example.com"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="rs-party" className={label}>
            Party size
          </label>
          <select id="rs-party" value={party} onChange={(e) => setParty(Number(e.target.value))} className={`${input} mt-1`}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rs-season" className={label}>
            Preferred season
          </label>
          <select id="rs-season" value={season} onChange={(e) => setSeason(e.target.value)} className={`${input} mt-1`}>
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {SEASON_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-start gap-3 text-sm text-stone">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-1" />
        <span>Show my first name and last initial on the public leaderboard.</span>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-cedar">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className={button}>
        {busy ? "Opening checkout" : `Continue to pay the ${depositLabel} deposit`}
      </button>
      <p className="text-xs text-stone">You will be taken to a secure checkout. The deposit is fully refundable at any time before launch.</p>
    </form>
  );
}

export function RefundButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  async function request() {
    if (!window.confirm("Request a full refund of your deposit? We will reply by email.")) return;
    setState("busy");
    const res = await fetch("/api/refund-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setState(res.ok ? "sent" : "error");
  }
  if (state === "sent") return <p className="text-sm text-ink">Refund requested. We will confirm by email.</p>;
  return (
    <div>
      <button
        type="button"
        onClick={request}
        disabled={state === "busy"}
        className="rounded-full border border-ink/25 px-4 py-2 text-sm text-ink transition hover:border-ink disabled:opacity-60"
      >
        {state === "busy" ? "Sending" : "Request refund"}
      </button>
      {state === "error" ? (
        <p role="alert" className="mt-2 text-sm text-cedar">
          That did not go through. Email us instead.
        </p>
      ) : null}
    </div>
  );
}
