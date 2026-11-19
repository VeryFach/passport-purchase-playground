// Locally derived from supabase/migrations/001_digital_passport_mvp_v02.sql
// and 002_business_logic.sql. Regenerate with the Supabase CLI when remote
// schema access is available.
//
// This file intentionally contains no generated-file banner: it is hand
// maintained until `supabase gen types typescript` can be run locally.

export type DeviceCategory = "smartphone" | "laptop";
export type PhysicalCondition = "unknown" | "like_new" | "light_wear" | "damaged";
export type LockStatus = "unknown" | "claimed_unlocked" | "claimed_locked";
export type ProfileRole = "user" | "mitra";
export type HistoryType =
  | "purchase"
  | "service"
  | "part_replacement"
  | "battery"
  | "damage"
  | "condition"
  | "transfer";
export type VerificationStatus = "not_requested" | "pending" | "verified" | "rejected";
export type ListingStatus = "active" | "sold" | "withdrawn";
export type TransactionStatus = "completed";

export interface ProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: ProfileRole;
  created_at: string;
}

export interface DeviceRow {
  id: string;
  owner_id: string;
  passport_code: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  variant: string | null;
  serial_number: string | null;
  imei: string | null;
  specifications: Record<string, unknown>;
  purchase_date: string | null;
  purchase_price: number | string | null;
  battery_health: number | null;
  physical_condition: PhysicalCondition;
  photo_url: string | null;
  lock_status: LockStatus;
  trust_score: number;
  updated_at: string;
  created_at: string;
}

export interface HistoryRecordRow {
  id: string;
  device_id: string;
  created_by: string;
  type: HistoryType;
  title: string;
  description: string;
  event_date: string;
  evidence_url: string | null;
  details: Record<string, unknown>;
  level: number;
  part_original: boolean | null;
  verification_status: VerificationStatus;
  verifier_id: string | null;
  verification_note: string | null;
  requested_at: string | null;
  verified_at: string | null;
  is_public: boolean;
  created_at: string;
}

export interface ListingRow {
  id: string;
  device_id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number | string;
  estimated_min: number | string | null;
  estimated_max: number | string | null;
  estimated_base_price: number | string | null;
  passport_premium: number | string | null;
  ai_explanation: Record<string, unknown> | null;
  price_label: string | null;
  estimated_at: string | null;
  estimation_snapshot: Record<string, unknown> | null;
  photos: unknown[];
  status: ListingStatus;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  total_price: number | string;
  listing_snapshot: Record<string, unknown>;
  status: TransactionStatus;
  is_simulation: boolean;
  created_at: string;
  completed_at: string;
}

export interface MarketPriceRow {
  id: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  variant: string;
  retail_price: number | string | null;
  used_price_1y: number | string | null;
  used_price_2y: number | string | null;
  used_price_3y: number | string | null;
  source: string;
  is_demo: boolean;
  updated_at: string;
}

export interface PendingVerificationRow {
  record_id: string;
  device_id: string;
  device_model: string;
  device_brand: string;
  device_category: DeviceCategory;
  passport_code: string;
  serial_number: string | null;
  imei: string | null;
  record_type: HistoryType;
  record_title: string;
  record_description: string;
  event_date: string;
  evidence_url: string | null;
  requested_at: string | null;
  owner_id: string;
  created_by: string;
}

export interface PublicPassportRow {
  device_id: string;
  passport_code: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  variant: string | null;
  battery_health: number | null;
  physical_condition: PhysicalCondition;
  lock_status: LockStatus;
  trust_score: number;
  photo_url: string | null;
  purchase_year: number | null;
  specifications: Record<string, unknown>;
  histories: PublicHistoryRow[];
}

export interface PublicHistoryRow {
  type: HistoryType;
  title: string;
  description: string;
  event_date: string;
  level: number | null;
  evidence_reported: boolean;
  verification_simulated: boolean;
  source: string;
}

export interface PublicOwnershipEvent {
  type: HistoryType | "owner_fallback";
  title?: string;
  description?: string;
  event_date?: string;
  level?: number | null;
  owner_name?: string;
}

export interface MarketplaceFeedRow {
  listing_id: string;
  device_id: string;
  title: string;
  description: string;
  price: number | string;
  estimated_min: number | string | null;
  estimated_max: number | string | null;
  photos: unknown[];
  passport: {
    passport_code: string;
    category: DeviceCategory;
    brand: string;
    model: string;
    variant: string | null;
    battery_health: number | null;
    physical_condition: PhysicalCondition;
    trust_score: number;
    lock_status: LockStatus;
    photo_url: string | null;
    specifications: Record<string, unknown>;
    purchase_year?: number | null;
    price_label: string | null;
    passport_premium: number | string | null;
    ai_explanation: Record<string, unknown> | null;
  };
  histories: PublicHistoryRow[];
  created_at: string;
}

type TableDefinition<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow>;
      devices: TableDefinition<DeviceRow>;
      history_records: TableDefinition<HistoryRecordRow>;
      listings: TableDefinition<ListingRow>;
      transactions: TableDefinition<TransactionRow>;
      market_prices: TableDefinition<MarketPriceRow>;
    };
    Views: Record<never, never>;
    Functions: {
      marketplace_feed: {
        Args: { p_listing_id?: string | null };
        Returns: MarketplaceFeedRow[];
      };
      public_passport: {
        Args: { p_key: string };
        Returns: PublicPassportRow[];
      };
      public_ownership_history: {
        Args: { p_key: string };
        Returns: { histories: PublicOwnershipEvent[] }[];
      };
      pending_verifications: {
        Args: Record<string, never>;
        Returns: PendingVerificationRow[];
      };
      request_verification: {
        Args: { p_history_id: string };
        Returns: undefined;
      };
      review_verification: {
        Args: { p_history_id: string; p_approve: boolean; p_note?: string | null };
        Returns: undefined;
      };
      publish_listing: {
        Args: {
          p_device_id: string;
          p_title: string;
          p_price: number;
          p_description?: string;
          p_photos?: unknown[];
        };
        Returns: string;
      };
      withdraw_listing: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      buy_listing: {
        Args: { p_listing_id: string };
        Returns: string;
      };
      refresh_listing_estimate: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      save_listing_explanation: {
        Args: { p_listing_id: string; p_explanation: Record<string, unknown> };
        Returns: undefined;
      };
      calculate_trust_score: {
        Args: { p_device_id: string };
        Returns: number;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
