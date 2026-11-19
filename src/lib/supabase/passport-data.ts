import { galaxy, iphone, macbook } from "@/lib/demo-data";
import type { Device, HistoryRecord, RecordType } from "@/lib/passport";
import type { Order } from "@/lib/workflows";

import { createClient } from "./client";
import type {
  DeviceRow,
  HistoryRecordRow,
  HistoryType,
  ListingRow,
  MarketPriceRow,
  MarketplaceFeedRow,
  PendingVerificationRow,
  ProfileRow,
  TransactionRow,
} from "./database.types";
import { isMissingSchemaError } from "./errors";
import { interpolateMarketPrice } from "@/lib/pricing";

const DB_TO_RECORD_TYPE: Record<HistoryType, RecordType | null> = {
  purchase: "pembelian",
  service: "servis",
  part_replacement: "ganti_part",
  battery: "baterai",
  damage: "kerusakan",
  condition: "kerusakan",
  transfer: null,
};

export const RECORD_TO_DB_TYPE: Record<RecordType, HistoryType> = {
  pembelian: "purchase",
  servis: "service",
  ganti_part: "part_replacement",
  baterai: "battery",
  kerusakan: "damage",
};

const RECORD_TITLES: Record<RecordType, string> = {
  pembelian: "Pembelian perangkat",
  servis: "Servis perangkat",
  ganti_part: "Penggantian part",
  baterai: "Kondisi baterai",
  kerusakan: "Catatan kerusakan",
};

export type WorkspaceData = {
  devices: Device[];
  orders: Order[];
  pendingVerifications: PendingVerificationRow[];
  profile: ProfileRow | null;
  marketPrices: MarketPriceRow[];
};

export type PendingVerificationView = {
  recordId: string;
  deviceId: string;
  deviceModel: string;
  deviceBrand: string;
  serial: string;
  recordType: RecordType;
  recordTitle: string;
  description: string;
  date: string;
  evidence: string | null;
  requestedAt: string | null;
};

function num(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function nnum(value: unknown): number | null {
  const parsed = num(value);
  return parsed > 0 ? parsed : null;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function specsOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function imageForDevice(category: string, brand: string): string {
  if (category === "laptop") return macbook;
  if (brand.toLowerCase().includes("samsung")) return galaxy;
  return iphone;
}

function conditionFromDb(value: string): Device["condition"] {
  if (value === "like_new") return "mulus";
  if (value === "damaged") return "rusak";
  return "lecet";
}

function conditionToDb(value: Device["condition"]): "like_new" | "light_wear" | "damaged" {
  if (value === "mulus") return "like_new";
  if (value === "rusak") return "damaged";
  return "light_wear";
}

function ageOf(purchaseDate: string | null | undefined): number {
  if (!purchaseDate) return 3;
  const year = Number(purchaseDate.slice(0, 4));
  if (!year) return 3;
  return Math.max(0, new Date().getFullYear() - year);
}

export function usedPriceForAge(market: MarketPriceRow | undefined, age: number): number | null {
  if (!market) return null;
  return interpolateMarketPrice(market, age);
}

export function findMarketPrice(
  markets: MarketPriceRow[],
  category: string,
  brand: string,
  model: string,
): MarketPriceRow | undefined {
  const wantedCategory = category === "hp" ? "smartphone" : category;
  return markets.find(
    (row) =>
      row.category === wantedCategory &&
      row.brand.trim().toLowerCase() === brand.trim().toLowerCase() &&
      row.model.trim().toLowerCase() === model.trim().toLowerCase(),
  );
}

function pickLatestListing(listings: ListingRow[]): ListingRow | undefined {
  if (!listings.length) return undefined;
  return (
    listings.find((listing) => listing.status === "active") ??
    [...listings].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  );
}

function estimateFromListing(listing: ListingRow | undefined) {
  if (!listing) return undefined;
  const min = nnum(listing.estimated_min);
  const max = nnum(listing.estimated_max);
  if (min === null || max === null) return undefined;
  return {
    min,
    max,
    mid: (min + max) / 2,
    added: num(listing.passport_premium),
  };
}

function explanationFromListing(listing: ListingRow | undefined): Device["estimateExplanation"] {
  const explanation = listing?.ai_explanation;
  if (!explanation || typeof explanation.summary !== "string") return undefined;
  const source = explanation.source === "llm" ? "llm" : "deterministic_template";
  const reasons = Array.isArray(explanation.reasons)
    ? explanation.reasons.filter((item): item is string => typeof item === "string").slice(0, 3)
    : [];
  return { source, summary: explanation.summary, reasons,
    ...(Array.isArray(explanation.warnings) ? { warnings: explanation.warnings.filter((item): item is string => typeof item === "string") } : {}) };
}

export function historyRowToRecord(
  row: HistoryRecordRow,
  signedUrls: Record<string, string>,
): HistoryRecord | null {
  const type = DB_TO_RECORD_TYPE[row.type];
  if (!type) return null;
  const details = row.details ?? {};
  return {
    id: row.id,
    type,
    date: row.event_date,
    description: row.description,
    evidence: row.evidence_url ? (signedUrls[row.evidence_url] ?? null) : null,
    level: (row.level >= 1 && row.level <= 3 ? row.level : 1) as HistoryRecord["level"],
    original: row.part_original ?? true,
    verifiedBy: row.verification_status === "verified" ? "Mitra (simulasi)" : undefined,
    ...(typeof details["correctionOf"] === "string"
      ? { correctionOf: details["correctionOf"] }
      : {}),
    ...(typeof details["correctionReason"] === "string"
      ? { correctionReason: details["correctionReason"] }
      : {}),
  };
}

function publicHistoryToRecord(row: {
  type: HistoryType;
  title: string;
  description: string;
  event_date: string;
  level: number | null;
}): HistoryRecord | null {
  const type = DB_TO_RECORD_TYPE[row.type];
  if (!type) return null;
  return {
    id: `${row.type}-${row.event_date}-${row.description.slice(0, 12)}`,
    type,
    date: row.event_date,
    description: row.description,
    evidence: null,
    level: (row.level && row.level >= 1 && row.level <= 3 ? row.level : 1) as HistoryRecord["level"],
    original: true,
  };
}

function ownershipFromHistories(rows: HistoryRecordRow[], signedUrls: Record<string, string>) {
  return rows
    .filter((row) => row.type === "transfer")
    .map((row) => ({
      date: row.event_date,
      from: "Pemilik sebelumnya",
      to: "Pemilik saat ini",
      description: row.description,
      evidence: row.evidence_url ? (signedUrls[row.evidence_url] ?? null) : null,
    }));
}

function deviceFromOwnedRow(
  row: DeviceRow,
  histories: HistoryRecordRow[],
  listings: ListingRow[],
  markets: MarketPriceRow[],
  signedUrls: Record<string, string>,
): Device {
  const specs = specsOf(row.specifications);
  const listing = pickLatestListing(listings);
  const records = histories
    .map((history) => historyRowToRecord(history, signedUrls))
    .filter((record): record is HistoryRecord => Boolean(record));
  const kind = row.category === "smartphone" ? "hp" : "laptop";
  const market = findMarketPrice(markets, kind, row.brand, row.model);
  const age = ageOf(row.purchase_date);
  const basePrice = nnum(listing?.estimated_base_price) ?? usedPriceForAge(market, age);
  const status: Device["status"] =
    listing?.status === "active" ? "aktif" : listing?.status === "sold" ? "terjual" : "draf";
  const lockStatus = str(specs["identityStatus"], "unknown") as Device["identityStatus"];

  return {
    id: row.id,
    kind,
    brand: row.brand,
    model: row.model,
    variant: row.variant ?? "",
    serial: row.serial_number ?? row.imei ?? "",
    year: row.purchase_date ? Number(row.purchase_date.slice(0, 4)) : 0,
    purchasePrice: num(row.purchase_price),
    image: row.photo_url || imageForDevice(row.category, row.brand),
    battery: row.battery_health ?? 0,
    condition: conditionFromDb(row.physical_condition),
    unlocked: row.lock_status === "claimed_unlocked",
    owner: row.owner_id,
    location: str(specs["location"], "Lokasi tidak dibagikan"),
    records,
    price: listing ? num(listing.price) : null,
    basePrice,
    status,
    identityStatus:
      lockStatus === "checked" || lockStatus === "locked" || lockStatus === "blocked"
        ? lockStatus
        : "unknown",
    privacy: {
      showLocation: specs["showLocation"] !== false,
      showPurchasePrice: specs["showPurchasePrice"] === true,
    },
    accessories: str(specs["accessories"], ""),
    serviceDue: str(specs["serviceDue"], ""),
    warrantyUntil: str(specs["warrantyUntil"], ""),
    ownership: ownershipFromHistories(histories, signedUrls),
    passportCode: row.passport_code,
    listingId: listing?.status === "active" ? listing.id : undefined,
    trustScore: row.trust_score > 0 ? row.trust_score : undefined,
    estimateRange: estimateFromListing(listing),
    estimateExplanation: explanationFromListing(listing),
  };
}

function deviceFromFeedRow(row: MarketplaceFeedRow, markets: MarketPriceRow[]): Device {
  const passport = row.passport;
  const kind = passport.category === "smartphone" ? "hp" : "laptop";
  const market = findMarketPrice(markets, kind, passport.brand, passport.model);
  const purchaseYear = passport.purchase_year ?? new Date().getFullYear();
  const age = Math.max(0, new Date().getFullYear() - purchaseYear);
  const basePrice =
    nnum(row.estimated_min) ??
    nnum(row.estimated_max) ??
    usedPriceForAge(market, age) ??
    null;
  const min = nnum(row.estimated_min);
  const max = nnum(row.estimated_max);
  const records = (row.histories ?? [])
    .map((history) => publicHistoryToRecord(history))
    .filter((record): record is HistoryRecord => Boolean(record));

  return {
    id: row.device_id,
    kind,
    brand: passport.brand,
    model: passport.model,
    variant: passport.variant ?? "",
    serial: "",
    year: purchaseYear,
    purchasePrice: 0,
    image: passport.photo_url || imageForDevice(passport.category, passport.brand),
    battery: passport.battery_health ?? 0,
    condition: conditionFromDb(passport.physical_condition),
    unlocked: passport.lock_status === "claimed_unlocked",
    owner: "",
    location: "Lokasi tidak dibagikan",
    records,
    price: num(row.price),
    basePrice,
    status: "aktif",
    identityStatus: "unknown",
    privacy: { showLocation: false, showPurchasePrice: false },
    passportCode: passport.passport_code,
    listingId: row.listing_id,
    // Public feed histories are sanitized; the backend score is authoritative.
    trustScore: passport.trust_score,
    estimateRange:
      min !== null && max !== null
        ? { min, max, mid: (min + max) / 2, added: num(passport.passport_premium) }
        : undefined,
    estimateExplanation:
      row.passport.ai_explanation && typeof row.passport.ai_explanation.summary === "string"
        ? {
            source: row.passport.ai_explanation.source === "llm" ? "llm" : "deterministic_template",
            summary: row.passport.ai_explanation.summary,
            reasons: Array.isArray(row.passport.ai_explanation.reasons)
              ? row.passport.ai_explanation.reasons.filter((item): item is string => typeof item === "string").slice(0, 3)
              : [],
          }
        : undefined,
  };
}

function deviceFromSnapshot(
  snapshot: Record<string, unknown>,
  fallbackPrice: number,
  buyerId: string,
): Device | null {
  const feed = snapshot as unknown as MarketplaceFeedRow;
  if (!feed?.device_id || !feed.passport) return null;
  const base = deviceFromFeedRow(
    {
      ...feed,
      price: feed.price ?? fallbackPrice,
    },
    [],
  );
  return {
    ...base,
    price: num(feed.price) || fallbackPrice,
    status: "terjual",
    owner: buyerId,
    listingId: undefined,
  };
}

export async function createSignedEvidenceMap(paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return {};
  const supabase = createClient();
  const { data } = await supabase.storage.from("device-evidence").createSignedUrls(unique, 3600);
  const map: Record<string, string> = {};
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl;
  }
  return map;
}

export async function fetchMarketPrices(): Promise<MarketPriceRow[]> {
  const supabase = createClient();
  const { data } = await supabase.from("market_prices").select("*");
  return (data as MarketPriceRow[] | null) ?? [];
}

async function fetchFeed(): Promise<MarketplaceFeedRow[]> {
  const supabase = createClient();
  const v2 = await supabase.rpc("marketplace_feed_v2");
  if (!v2.error) return (v2.data as MarketplaceFeedRow[] | null) ?? [];
  const v1 = await supabase.rpc("marketplace_feed");
  if (v1.error) {
    if (!isMissingSchemaError(v1.error)) {
      // Surface unexpected errors to the caller's console without breaking the page.
      console.warn("[paspor] marketplace feed unavailable", v1.error.message);
    }
    return [];
  }
  return (v1.data as MarketplaceFeedRow[] | null) ?? [];
}

export async function fetchMarketplaceFeed(): Promise<Device[]> {
  const [feed, markets] = await Promise.all([fetchFeed(), fetchMarketPrices()]);
  return feed.map((row) => deviceFromFeedRow(row, markets));
}

export async function fetchWorkspace(userId: string): Promise<WorkspaceData> {
  const supabase = createClient();

  const [profileResult, devicesResult, markets] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("devices").select("*").eq("owner_id", userId),
    fetchMarketPrices(),
  ]);

  const owned = (devicesResult.data as DeviceRow[] | null) ?? [];
  const ownedIds = owned.map((row) => row.id);

  const [historiesResult, listingsResult] = await Promise.all([
    ownedIds.length
      ? supabase.from("history_records").select("*").in("device_id", ownedIds)
      : Promise.resolve({ data: [] as HistoryRecordRow[] }),
    ownedIds.length
      ? supabase.from("listings").select("*").in("device_id", ownedIds)
      : Promise.resolve({ data: [] as ListingRow[] }),
  ]);

  const histories = (historiesResult.data as HistoryRecordRow[] | null) ?? [];
  const listings = (listingsResult.data as ListingRow[] | null) ?? [];
  const evidencePaths = histories
    .map((history) => history.evidence_url)
    .filter((path): path is string => Boolean(path));
  const signedUrls = await createSignedEvidenceMap(evidencePaths);

  const ownedDevices = owned.map((row) =>
    deviceFromOwnedRow(
      row,
      histories.filter((history) => history.device_id === row.id),
      listings.filter((listing) => listing.device_id === row.id),
      markets,
      signedUrls,
    ),
  );

  const byId = new Map<string, Device>();
  for (const device of ownedDevices) byId.set(device.id, device);

  const transactionsResult = await supabase
    .from("transactions")
    .select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  const transactions = (transactionsResult.data as TransactionRow[] | null) ?? [];
  const listingIds = [...new Set(transactions.map((tx) => tx.listing_id))];
  const transactionListingsResult = listingIds.length
    ? await supabase.from("listings").select("*").in("id", listingIds)
    : { data: [] as ListingRow[] };
  const transactionListings =
    (transactionListingsResult.data as ListingRow[] | null) ?? [];

  for (const tx of transactions) {
    const snapshotDeviceId = (tx.listing_snapshot as { device_id?: string }).device_id;
    const listingDeviceId = transactionListings.find(
      (row) => row.id === tx.listing_id,
    )?.device_id;
    const deviceId = snapshotDeviceId ?? listingDeviceId ?? "";
    if (deviceId && byId.has(deviceId)) continue;
    const device = deviceFromSnapshot(tx.listing_snapshot, num(tx.total_price), tx.buyer_id);
    if (device) byId.set(device.id, device);
  }

  const orders = transactions.map((tx) => {
    const listing = transactionListings.find((row) => row.id === tx.listing_id);
    const snapshot = tx.listing_snapshot as { device_id?: string };
    return {
      id: tx.id,
      deviceId: snapshot.device_id ?? listing?.device_id ?? "",
      buyer: tx.buyer_id,
      seller: tx.seller_id,
      amount: num(tx.total_price),
      status: "selesai" as const,
      createdAt: tx.created_at,
    } satisfies Order;
  });

  let pendingVerifications: PendingVerificationRow[] = [];
  const pendingResult = await supabase.rpc("pending_verifications");
  if (!pendingResult.error) {
    pendingVerifications = (pendingResult.data as PendingVerificationRow[] | null) ?? [];
    const pendingEvidence = await createSignedEvidenceMap(
      pendingVerifications
        .map((item) => item.evidence_url)
        .filter((path): path is string => Boolean(path)),
    );
    pendingVerifications = pendingVerifications.map((item) => ({
      ...item,
      evidence_url: item.evidence_url ? (pendingEvidence[item.evidence_url] ?? null) : null,
    }));
  }

  return {
    devices: [...byId.values()],
    orders,
    pendingVerifications,
    profile: (profileResult.data as ProfileRow | null) ?? null,
    marketPrices: markets,
  };
}

export async function fetchPublicDevice(key: string): Promise<Device | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("public_passport", { p_key: key });
  if (error || !data?.length) return null;
  const row = data[0] as {
    device_id: string;
    passport_code: string;
    category: "smartphone" | "laptop";
    brand: string;
    model: string;
    variant: string | null;
    battery_health: number | null;
    physical_condition: string;
    lock_status: string;
    trust_score: number;
    photo_url: string | null;
    purchase_year: number | null;
    specifications: Record<string, unknown>;
    histories: {
      type: HistoryType;
      title: string;
      description: string;
      event_date: string;
      level: number | null;
    }[];
  };
  const records = (row.histories ?? [])
    .map((history) => publicHistoryToRecord(history))
    .filter((record): record is HistoryRecord => Boolean(record));
  return {
    id: row.device_id,
    kind: row.category === "smartphone" ? "hp" : "laptop",
    brand: row.brand,
    model: row.model,
    variant: row.variant ?? "",
    serial: "",
    year: row.purchase_year ?? 0,
    purchasePrice: 0,
    image: row.photo_url || imageForDevice(row.category, row.brand),
    battery: row.battery_health ?? 0,
    condition: conditionFromDb(row.physical_condition),
    unlocked: row.lock_status === "claimed_unlocked",
    owner: "",
    location: "Lokasi tidak dibagikan",
    records,
    price: null,
    basePrice: null,
    status: "draf",
    identityStatus: "unknown",
    privacy: { showLocation: false, showPurchasePrice: false },
    passportCode: row.passport_code,
    trustScore: row.trust_score,
  };
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] ?? "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? "";
  const binary = isBase64 ? atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

function extensionFor(blob: Blob): string {
  if (blob.type === "image/png") return "png";
  if (blob.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadProductPhoto(
  image: string,
  userId: string,
): Promise<string | null> {
  if (!image) return null;
  if (!image.startsWith("data:")) return image;
  const blob = dataUrlToBlob(image);
  if (!blob) return null;
  const supabase = createClient();
  const path = `${userId}/${crypto.randomUUID()}.${extensionFor(blob)}`;
  const { error } = await supabase.storage
    .from("product-photos")
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadEvidence(
  evidence: string,
  userId: string,
): Promise<string | null> {
  if (!evidence) return null;
  if (!evidence.startsWith("data:")) return evidence;
  const blob = dataUrlToBlob(evidence);
  if (!blob) return null;
  const supabase = createClient();
  const path = `${userId}/${crypto.randomUUID()}.${extensionFor(blob)}`;
  const { error } = await supabase.storage
    .from("device-evidence")
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return path;
}

export function recordTitle(type: RecordType): string {
  return RECORD_TITLES[type];
}
