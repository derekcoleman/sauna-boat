import { FOUNDING_MEMBER, REWARD_TIERS, rewardProgress, type Standing } from "@/lib/position";
import type { ReferralCounts } from "@/lib/members";
import { displayName } from "@/lib/members";
import type { LeaderboardRow } from "@/lib/db-types";
import { referralDisplay, referralUrl } from "@/lib/config";
import { ShareButtons } from "./ShareButtons";
import { shareText } from "@/lib/share";

export function PositionCard({ standing, tier, depositLine }: { standing: Standing | null; tier: "waitlist" | "reserved"; depositLine?: string }) {
  return (
    <div className="rounded-2xl bg-ink p-6 text-fog sm:p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-ember">
        {tier === "reserved" ? "Founding reservation" : "Waitlist"}
      </p>
      {standing ? (
        <p className="mt-3 font-display text-5xl sm:text-6xl">
          #{standing.position.toLocaleString()}
          <span className="text-2xl text-fog/60"> of {standing.total.toLocaleString()}</span>
        </p>
      ) : (
        <p className="mt-3 font-display text-3xl">On the list</p>
      )}
      {standing && standing.boost > 0 ? (
        <p className="mt-2 text-sm text-fog/75">Up {standing.boost} places from referrals.</p>
      ) : null}
      {depositLine ? <p className="mt-4 text-sm text-fog/85">{depositLine}</p> : null}
    </div>
  );
}

export function ReferralCard({ code, tier }: { code: string; tier: "waitlist" | "reserved" }) {
  const link = referralUrl(code);
  return (
    <div className="rounded-2xl border border-sand bg-white/60 p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-stone">Your referral link</p>
      <p className="mt-3 break-all font-display text-2xl text-ink">{referralDisplay(code)}</p>
      <p className="mt-2 text-sm text-stone">
        Each person who joins through it moves you up {tier === "reserved" ? "ten" : "five"} places. Deposit
        holders always rank above the free list.
      </p>
      <div className="mt-5">
        <ShareButtons link={link} text={shareText(tier, link)} code={code} />
      </div>
    </div>
  );
}

export function RewardsProgress({ counts }: { counts: ReferralCounts }) {
  const p = rewardProgress(counts.total);
  return (
    <div className="rounded-2xl border border-sand bg-white/60 p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-stone">Referrals</p>
        <p className="text-sm text-stone">
          {counts.total} confirmed: {counts.deposit} with deposits, {counts.free} free
        </p>
      </div>
      {p.next ? (
        <>
          <p className="mt-3 text-ink">
            {p.remaining} more {p.remaining === 1 ? "referral" : "referrals"} to unlock {p.next.title.toLowerCase()}.
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.progress * 100)}>
            <div className="h-full bg-cedar" style={{ width: `${Math.round(p.progress * 100)}%` }} />
          </div>
        </>
      ) : (
        <p className="mt-3 text-ink">Every reward is unlocked. Founding member status goes to the top ten at launch.</p>
      )}
      <ol className="mt-6 space-y-3">
        {REWARD_TIERS.map((t) => {
          const done = counts.total >= t.referrals;
          return (
            <li key={t.referrals} className="flex gap-3 text-sm">
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${done ? "border-cedar bg-cedar text-fog" : "border-ink/25 text-stone"}`}
                aria-hidden="true"
              >
                {t.referrals}
              </span>
              <span>
                <span className={done ? "text-ink" : "text-ink/80"}>{t.title}</span>
                <span className="text-stone"> {t.detail}</span>
              </span>
            </li>
          );
        })}
        <li className="flex gap-3 text-sm">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ember bg-ember/40 text-[11px]" aria-hidden="true">
            10
          </span>
          <span>
            <span className="text-ink">{FOUNDING_MEMBER.title}</span>
            <span className="text-stone"> {FOUNDING_MEMBER.detail}</span>
          </span>
        </li>
      </ol>
    </div>
  );
}

export function Leaderboard({ rows, highlightId }: { rows: LeaderboardRow[]; highlightId?: string }) {
  return (
    <div className="rounded-2xl border border-sand bg-white/60 p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-stone">Leaderboard</p>
      <p className="mt-2 text-sm text-stone">Top referrers right now. The top ten at launch become founding members.</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-ink">Nobody has a confirmed referral yet. The first one takes the top spot.</p>
      ) : (
        <ol className="mt-4 divide-y divide-sand">
          {rows.map((r, i) => (
            <li
              key={r.member_id}
              className={`flex items-center justify-between py-2 text-sm ${r.member_id === highlightId ? "font-medium text-cedar" : "text-ink"}`}
            >
              <span>
                <span className="mr-3 inline-block w-5 text-stone">{i + 1}</span>
                {displayName(r)}
              </span>
              <span className="text-stone">
                {r.referral_count} {r.referral_count === 1 ? "referral" : "referrals"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
