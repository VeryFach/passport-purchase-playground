import { z } from "zod";

export type RecordType = "pembelian" | "servis" | "ganti_part" | "baterai" | "kerusakan";
export type HistoryRecord = {
  id: string;
  type: RecordType;
  date: string;
  description: string;
  evidence: string | null;
  level: 1 | 2 | 3 | 4;
  original: boolean;
  verifiedBy?: string | undefined;
  correctionOf?: string;
  correctionReason?: string;
};
export type Device = {
  id: string;
  kind: "hp" | "laptop";
  brand: string;
  model: string;
  variant: string;
  serial: string;
  year: number;
  purchasePrice: number;
  image: string;
  battery: number;
  condition: "mulus" | "lecet" | "rusak";
  unlocked: boolean;
  owner: string;
  location: string;
  records: HistoryRecord[];
  price: number | null;
  basePrice: number | null;
  status: "draf" | "aktif" | "terjual";
  identityStatus?: "unknown" | "checked" | "locked" | "blocked";
  privacy?: { showLocation: boolean; showPurchasePrice: boolean };
  accessories?: string;
  serviceDue?: string;
  warrantyUntil?: string;
  ownership?: { date: string; from: string; to: string }[];
};
export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
export const shortPrice = (n: number) =>
  `Rp ${(n / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jt`;
export const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const maskedSerial = (s: string) => `${s.slice(0, 2)}••••••••${s.slice(-3)}`;
export const recordNames: Record<RecordType, string> = {
  pembelian: "Pembelian perangkat",
  servis: "Servis perangkat",
  ganti_part: "Penggantian part",
  baterai: "Kondisi baterai",
  kerusakan: "Catatan kerusakan",
};
export function scoreItems(d: Device) {
  return [
    { label: "Identitas lengkap", points: d.serial && d.image ? 20 : 0, max: 20 },
    {
      label: "Bukti pembelian",
      points: d.records.some((r) => r.type === "pembelian" && r.evidence && r.level >= 2) ? 15 : 0,
      max: 15,
    },
    {
      label: "Kondisi baterai",
      points: d.records.some((r) => r.type === "baterai" && r.level >= 2) ? 15 : 0,
      max: 15,
    },
    {
      label: "Riwayat servis terdokumentasi",
      points: Math.min(
        20,
        d.records.filter(
          (r) => (r.type === "servis" || r.type === "ganti_part") && r.evidence && r.level >= 2,
        ).length * 5,
      ),
      max: 20,
    },
    {
      label: "Verifikasi mitra",
      points: Math.min(20, d.records.filter((r) => r.level >= 3).length * 10),
      max: 20,
    },
    { label: "Status kunci bersih", points: d.unlocked ? 10 : 0, max: 10 },
  ];
}
export const trustScore = (d: Device) => scoreItems(d).reduce((a, b) => a + b.points, 0);
export const scoreLabel = (score: number) =>
  score >= 70 ? "Terpercaya" : score >= 40 ? "Berdokumen" : "Dasar";
export function estimate(d: Device) {
  if (d.basePrice === null) return null;
  const score = trustScore(d);
  const premium = score >= 70 ? 0.06 : score >= 40 ? 0.03 : 0;
  const battery = d.battery >= 90 ? 1 : d.battery >= 80 ? 0.95 : 0.88;
  const part = 0.92 ** d.records.filter((r) => r.type === "ganti_part" && !r.original).length;
  const physical = d.condition === "mulus" ? 1 : d.condition === "lecet" ? 0.96 : 0.85;
  const adjusted = d.basePrice * battery * part * physical;
  const mid = adjusted * (1 + premium);
  return { mid, min: mid * 0.93, max: mid * 1.07, added: adjusted * premium };
}
export const priceLabel = (price: number, e: { min: number; max: number }) =>
  price < e.min ? "Murah" : price > e.max ? "Mahal" : "Wajar";
export const purchaseDevice = (d: Device, buyer: string): Device =>
  d.status === "aktif" && d.owner !== buyer ? { ...d, owner: buyer, status: "terjual" } : d;
export function fileError(file: File) {
  return !["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024
    ? "Format harus JPG/PNG, maksimal 5 MB"
    : null;
}
export const passportSchema = z
  .object({
    kind: z.enum(["hp", "laptop"]),
    brand: z.string().min(1, "Isi merek"),
    model: z.string().min(1, "Isi model"),
    variant: z.string(),
    serial: z.string(),
    year: z.coerce.number().min(2020, "Tahun tidak valid").max(2026, "Tahun tidak valid"),
    purchasePrice: z.coerce.number().positive("Isi harga beli"),
    battery: z.coerce.number().min(1, "Isi 1 sampai 100").max(100, "Isi 1 sampai 100"),
    condition: z.enum(["mulus", "lecet", "rusak"]),
    unlocked: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.kind === "hp" ? !/^\d{15}$/.test(d.serial) : d.serial.length < 5 || d.serial.length > 30)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["serial"],
        message: d.kind === "hp" ? "IMEI harus 15 digit" : "Serial harus 5 sampai 30 karakter",
      });
  });
export type PassportInput = z.infer<typeof passportSchema>;
export const historySchema = z.object({
  type: z.enum(["pembelian", "servis", "ganti_part", "baterai", "kerusakan"]),
  date: z
    .string()
    .min(1, "Isi tanggal")
    .refine((d) => d <= "2026-11-18", "Tanggal tidak boleh di masa depan"),
  description: z
    .string()
    .min(5, "Tulis 5 sampai 300 karakter")
    .max(300, "Tulis 5 sampai 300 karakter"),
  original: z.boolean(),
});
