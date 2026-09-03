-- Sauna boat presale schema.
-- All access goes through server routes using the service role key.
-- RLS is enabled on every table with NO policies, so anon/authenticated
-- clients cannot read or write anything.

create extension if not exists pgcrypto;

create table public.members (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null unique,
  first_name         text,
  last_initial       text,
  referral_code      text not null unique,
  referred_by        uuid references public.members(id) on delete set null,
  tier               text not null default 'waitlist' check (tier in ('waitlist', 'reserved')),
  leaderboard_opt_in boolean not null default true,
  visitor_id         text,
  nudge_sent_at      timestamptz,
  created_at         timestamptz not null default now()
);
create index members_created_at_idx on public.members (created_at);
create index members_referred_by_idx on public.members (referred_by);

create table public.reservations (
  id                          uuid primary key default gen_random_uuid(),
  member_id                   uuid not null references public.members(id) on delete cascade,
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text unique,
  stripe_customer_id          text,
  party_size                  integer not null check (party_size between 1 and 6),
  preferred_season            text not null check (preferred_season in ('winter', 'spring', 'summer', 'fall')),
  status                      text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'cancelled')),
  amount_cents                integer not null check (amount_cents >= 0),
  created_at                  timestamptz not null default now(),
  paid_at                     timestamptz,
  refunded_at                 timestamptz
);
create index reservations_member_id_idx on public.reservations (member_id);
create index reservations_status_idx on public.reservations (status);

create table public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references public.members(id) on delete cascade,
  referred_id  uuid not null unique references public.members(id) on delete cascade,
  confirmed_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now(),
  check (referrer_id <> referred_id)
);
create index referrals_referrer_id_idx on public.referrals (referrer_id);

create table public.events (
  id         bigint generated always as identity primary key,
  member_id  uuid references public.members(id) on delete set null,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_type_created_idx on public.events (type, created_at);

create table public.email_tokens (
  token      text primary key,
  member_id  uuid not null references public.members(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index email_tokens_member_id_idx on public.email_tokens (member_id);

-- Processed Stripe event ids; makes the webhook idempotent on replay.
create table public.stripe_events (
  id         text primary key,
  type       text not null,
  created_at timestamptz not null default now()
);

-- Confirmed, unrevoked referrals per referrer, split by what the referred
-- person did (deposit vs free signup).
create view public.member_referral_counts with (security_invoker = true) as
select
  r.referrer_id,
  count(*)::int                                   as total,
  count(*) filter (where m.tier = 'reserved')::int as deposit_count,
  count(*) filter (where m.tier = 'waitlist')::int as free_count
from public.referrals r
join public.members m on m.id = r.referred_id
where r.confirmed_at is not null and r.revoked_at is null
group by r.referrer_id;

-- Public leaderboard: first name, last initial, count. Nothing else.
create view public.leaderboard with (security_invoker = true) as
select
  m.id as member_id,
  m.first_name,
  m.last_initial,
  c.total as referral_count
from public.member_referral_counts c
join public.members m on m.id = c.referrer_id
where m.leaderboard_opt_in
order by c.total desc, m.created_at asc
limit 10;

-- Row Level Security: on everywhere, zero policies.
alter table public.members       enable row level security;
alter table public.reservations  enable row level security;
alter table public.referrals     enable row level security;
alter table public.events        enable row level security;
alter table public.email_tokens  enable row level security;
alter table public.stripe_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
