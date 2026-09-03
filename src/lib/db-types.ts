/**
 * Hand-written Supabase types for the tables in supabase/migrations.
 * Regenerate with `supabase gen types typescript --local` if you extend the schema.
 */

export type Tier = "waitlist" | "reserved";
export type ReservationStatus = "pending" | "paid" | "refunded" | "cancelled";
export type SeasonValue = "winter" | "spring" | "summer" | "fall";

export type MemberRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_initial: string | null;
  referral_code: string;
  referred_by: string | null;
  tier: Tier;
  leaderboard_opt_in: boolean;
  visitor_id: string | null;
  nudge_sent_at: string | null;
  created_at: string;
};

export type ReservationRow = {
  id: string;
  member_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  party_size: number;
  preferred_season: SeasonValue;
  status: ReservationStatus;
  amount_cents: number;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
};

export type ReferralRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  confirmed_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type EventRow = {
  id: number;
  member_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type EmailTokenRow = {
  token: string;
  member_id: string;
  expires_at: string;
  created_at: string;
};

export type StripeEventRow = {
  id: string;
  type: string;
  created_at: string;
};

export type LeaderboardRow = {
  member_id: string;
  first_name: string | null;
  last_initial: string | null;
  referral_count: number;
};

export type ReferralCountRow = {
  referrer_id: string;
  total: number;
  deposit_count: number;
  free_count: number;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row extends Record<string, unknown>, Insert = Partial<Row>, Update = Partial<Row>, Rels extends Relationship[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Rels;
};

type MemberFk = [
  {
    foreignKeyName: "reservations_member_id_fkey";
    columns: ["member_id"];
    isOneToOne: false;
    referencedRelation: "members";
    referencedColumns: ["id"];
  },
];

export type Database = {
  public: {
    Tables: {
      members: Table<MemberRow>;
      reservations: Table<ReservationRow, Partial<ReservationRow>, Partial<ReservationRow>, MemberFk>;
      referrals: Table<ReferralRow>;
      events: Table<EventRow, Partial<Omit<EventRow, "id">>>;
      email_tokens: Table<EmailTokenRow>;
      stripe_events: Table<StripeEventRow>;
    };
    Views: {
      leaderboard: { Row: LeaderboardRow; Relationships: [] };
      member_referral_counts: { Row: ReferralCountRow; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
