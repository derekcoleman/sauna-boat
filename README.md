# Sauna Boat presale

Presale landing site for a captained, wood-fired sauna boat on Richardson Bay, Sausalito, launching 2027. The site validates demand and funds the build: refundable deposits through Stripe Checkout, a free waitlist, a referral program with computed positions and rewards, and personalised share cards.

Stack: Next.js 16 (App Router, TypeScript), Tailwind 4, Supabase (Postgres + RLS), Stripe Checkout + webhooks, Resend, `next/og` (the bundled `@vercel/og`), Vercel Analytics. Deploys to Vercel.

## Assumptions

The brief left four placeholders unfilled. They are all env vars with defaults, so nothing is hard-coded:

| Placeholder | Env var | Default |
| --- | --- | --- |
| `[BRAND]` | `NEXT_PUBLIC_BRAND_NAME` | `Sauna Boat` (working title) |
| `[DOMAIN]` | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `[DEPOSIT_USD]` | `NEXT_PUBLIC_DEPOSIT_USD` | `250` |
| `[SESSION_PRICE_USD]` | `NEXT_PUBLIC_SESSION_PRICE_USD` | `900` |

Other decisions made without asking:

- **Schema additions.** Beyond the brief's schema: `members.last_initial` (leaderboard shows first name + last initial), `members.visitor_id` (blocks same-browser self-referral), `members.nudge_sent_at` (48-hour follow-up), `reservations.stripe_customer_id` and `refunded_at`, and a `stripe_events` table that makes the webhook idempotent on event id. Two views: `member_referral_counts` and the public `leaderboard`.
- **Waitlist signups collect email only**, as specified, so they have no name. They appear on the leaderboard as "Anonymous" until they reserve (which collects a name).
- **Deposit referrals confirm on the webhook**, not on the success redirect. A waitlist referral confirms immediately at signup.
- **Refunding a deposit** moves the member back to the waitlist tier and revokes the referrer's credit for them. Partial refunds are ignored.
- **Magic-link tokens** are random, HMAC-signed with `EMAIL_TOKEN_SECRET`, stored in `email_tokens`, and expire after 180 days. There is no login; the emailed link is the identity.
- **The `/r/[code]` page** is the landing page with a banner. The referral cookie is set by `src/proxy.ts` (Next 16's name for middleware) so the page itself stays a plain server component.
- **The 48-hour nudge** runs from a Vercel Cron (`vercel.json`, hourly) hitting `/api/cron/nudge`. Locally, call it by hand.
- **Refunds are manual.** The status page's "Request refund" emails `ADMIN_EMAIL`; you refund in the Stripe dashboard and the `charge.refunded` webhook updates the record.
- **Imagery.** The hero uses an inline SVG placeholder captioned "Replace with original artwork before launch". There are no raster images, so no `next/image` calls yet; when you add photos use `next/image` with explicit `width`/`height`.
- The `frontend-design` skill was not available in the build environment, so the UI was designed by hand: typography-led, one display serif and one sans, a five-colour palette in `src/app/globals.css`.

## Setup

Requires Node 22.18+ (the seed script relies on Node's built-in TypeScript type stripping).

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Stripe test keys at minimum
npm run dev                  # http://localhost:3000
```

`npm run dev` works with only the Supabase and Stripe test keys set. Without `RESEND_API_KEY`, emails are printed to the terminal. Without `ADMIN_PASSWORD`, `/admin` returns 503.

### Environment variables

See `.env.example` for every variable with comments. Required: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Strongly recommended in production: `EMAIL_TOKEN_SECRET` (the app refuses to start in production without it), `ADMIN_PASSWORD`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`.

The service role key is only ever used in server code (`src/lib/supabase.ts` is `server-only`). There is no browser Supabase client at all.

## Supabase

1. Create a project at supabase.com (or run `supabase start` locally with Docker).
2. Apply the migration:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

   Or paste `supabase/migrations/20260903000000_init.sql` into the SQL editor.
3. Copy the project URL and the **service role** key into `.env.local`.
4. Seed sample data (optional, idempotent):

   ```bash
   npm run db:seed
   ```

   This creates eleven members with referrals and paid reservations. Try `/welcome?ref=ADA234` and `/r/ADA234`.

Row Level Security is enabled on every table with zero policies, and all grants for `anon` and `authenticated` are revoked, so the anon key can read nothing. Every query goes through server routes with the service role key. The `leaderboard` view exposes only first name, last initial, and referral count.

## Stripe

Test mode by default: use `sk_test_...` keys. To go live, swap in `sk_live_...` and a live webhook secret; nothing else changes.

Checkout Sessions are created per reservation with `customer_creation: always`, `customer_email`, `client_reference_id` set to our reservation UUID, and metadata carrying the referral code, party size, and season (also copied to the PaymentIntent so refunds can be traced).

### Local webhooks

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` and restart `npm run dev`. Pay with test card `4242 4242 4242 4242`, any future date, any CVC.

To exercise the refund path: refund the payment in the Stripe test dashboard (or `stripe refunds create --payment-intent pi_...`). The `charge.refunded` event marks the reservation refunded, drops the member to the waitlist tier, and revokes the referral credit.

Replay a delivered event with `stripe events resend evt_...`: the handler answers `{ received: true, duplicate: true }` and changes nothing.

### Production webhook

In the Stripe dashboard, Developers → Webhooks → Add endpoint: `https://<your-domain>/api/stripe/webhook`, events `checkout.session.completed` and `charge.refunded`. Put the signing secret in Vercel as `STRIPE_WEBHOOK_SECRET`.

## Email

Templates live in `src/lib/email.ts`: reservation confirmed, waitlist confirmed, and the 48-hour nudge. All include the magic link to `/status/[token]`, the referral link, and share buttons. Without `RESEND_API_KEY` they log to the console. In production, verify your sending domain in Resend and set `EMAIL_FROM` to an address on it.

The nudge endpoint: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/nudge`. With `CRON_SECRET` unset it runs unauthenticated in development only.

## Pages and routes

| Path | What |
| --- | --- |
| `/` | Landing. Static. JSON-LD for Organization, FAQPage, Event. |
| `/r/[code]` | Landing with referral banner; sets `sb_ref` cookie (30 days) via proxy; `noindex`; personalised OG image. |
| `/reserve` | Name, email, party size, season → Stripe Checkout. |
| `/waitlist` | Email only → `/welcome?ref=CODE`. |
| `/welcome?ref=CODE` | Position, referral link, rewards progress, share buttons, leaderboard. |
| `/status/[token]` | Magic-link status page with refund request. |
| `/admin` | Basic auth (`ADMIN_PASSWORD`, any username). KPIs, funnel, tables, CSV export. |
| `/terms` | Deposit terms, refund policy, referral rules, privacy. |
| `POST /api/waitlist`, `POST /api/reserve` | Signups. |
| `POST /api/stripe/webhook` | The only writer of payment state. |
| `GET /api/og?code=` | 1200×630 share card with first name and position. |
| `POST /api/events` | Client-side analytics (page views, CTA clicks, share clicks). |
| `POST /api/refund-request` | Emails the admin. |
| `GET /api/admin/export?type=members\|reservations` | CSV. |
| `GET /api/cron/nudge` | 48-hour follow-up email. |

## Position and rewards

Position is computed on every read in `src/lib/position.ts`, never stored. Members are numbered by signup order, then `referrals × 5` (waitlist) or `referrals × 10` (deposit holders) is subtracted from that number. Deposit holders always sort above the free list. Ties go to the earlier signup.

A referral is confirmed when the referred person completes a signup. Self-referrals (same email or same visitor cookie) are never recorded; disposable-domain signups are recorded but not credited (`src/lib/disposable.ts`).

Rewards: 1 → priority booking window, 3 → free cold plunge add-on for a guest, 5 → 20% off first session, 10 → one free private session. Top ten at launch → founding member. These are displayed, not enforced; enforcement happens at booking time, after launch.

## Tests

```bash
npm test          # vitest: referral codes, position math, webhook signatures
npm run typecheck
npm run lint
```

## Deploy to Vercel

1. Push the repo and import it in Vercel. Framework preset: Next.js. No build settings to change.
2. Add every variable from `.env.example` in Project → Settings → Environment Variables. Set `NEXT_PUBLIC_SITE_URL` to your production domain (used for canonical URLs, referral links, and Stripe redirect URLs).
3. Deploy. `vercel.json` registers the hourly cron for the nudge email; Vercel sends `CRON_SECRET` automatically once it is set.
4. Create the production Stripe webhook (above) pointing at the deployed domain and add its secret.
5. Enable Vercel Analytics on the project (the `<Analytics />` component is already mounted).

## Manual end-to-end check

1. Open `/`, click Reserve, fill the form, pay with `4242 4242 4242 4242`.
2. Land on `/welcome?ref=CODE`. The deposit line reads "Confirming" until `stripe listen` delivers the webhook, then "received" on refresh.
3. Copy the referral link and open it in an incognito window: the banner shows your first name.
4. Join the waitlist there with a different email.
5. Reload your `/welcome` page: referrals now show 1, and your position improved by ten.
6. `stripe events resend <evt_id>` for the completed checkout: response says `duplicate: true`, nothing changes.
