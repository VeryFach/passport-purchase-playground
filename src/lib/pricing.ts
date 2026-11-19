import type { Device } from "./passport";

export type MarketReference = {
  retail_price: number | string | null;
  used_price_1y: number | string | null;
  used_price_2y: number | string | null;
  used_price_3y: number | string | null;
};

export type PricingExplanation = {
  source: "deterministic_template" | "llm";
  summary: string;
  reasons: string[];
  warnings?: string[];
};

export type DeterministicEstimate = {
  basePrice: number;
  adjustedPrice: number;
  min: number;
  mid: number;
  max: number;
  passportPremium: number;
  age: number;
  ageUsed: number;
  explanation: PricingExplanation;
};

const numberOrNull = (value: number | string | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/** Interpolates between 0, 1, 2 and 3-year reference points. Older units use 3y explicitly. */
export function interpolateMarketPrice(reference: MarketReference, age: number): number | null {
  const points = [
    numberOrNull(reference.retail_price),
    numberOrNull(reference.used_price_1y),
    numberOrNull(reference.used_price_2y),
    numberOrNull(reference.used_price_3y),
  ];
  if (!points.some((point) => point !== null) || age < 0) return null;
  const normalizedAge = Math.min(3, age);
  const lower = Math.floor(normalizedAge);
  const upper = Math.ceil(normalizedAge);
  const lowerPrice = points[lower] ?? points.find((point) => point !== null) ?? null;
  const upperPrice = points[upper] ?? lowerPrice;
  if (lowerPrice === null || upperPrice === null) return null;
  if (lower === upper) return lowerPrice;
  return lowerPrice + (upperPrice - lowerPrice) * (normalizedAge - lower);
}

export function deterministicEstimate(
  device: Pick<Device, "year" | "battery" | "condition" | "records" | "trustScore">,
  reference: MarketReference | undefined,
  currentYear = new Date().getFullYear(),
): DeterministicEstimate | null {
  const age = currentYear - device.year;
  if (!reference || age < 0) return null;
  const basePrice = interpolateMarketPrice(reference, age);
  if (basePrice === null) return null;
  const warnings: string[] = [];
  const batteryFactor = device.battery > 0 ? (device.battery >= 90 ? 1 : device.battery >= 80 ? 0.95 : 0.88) : 1;
  if (!device.battery) warnings.push("Data baterai belum diisi; faktor baterai netral digunakan.");
  const nonOriginalParts = device.records.filter((record) => record.type === "ganti_part" && !record.original).length;
  const partFactor = 0.92 ** nonOriginalParts;
  const physicalFactor = device.condition === "mulus" ? 1 : device.condition === "lecet" ? 0.96 : 0.85;
  const cleanTrustScore = Math.max(0, Math.min(100, device.trustScore ?? 0));
  const premiumFactor = cleanTrustScore / 1000;
  const adjustedPrice = basePrice * batteryFactor * partFactor * physicalFactor;
  const passportPremium = adjustedPrice * premiumFactor;
  const mid = adjustedPrice + passportPremium;
  const ageUsed = Math.min(3, age);
  if (age > 3) warnings.push("Usia di atas 3 tahun memakai titik referensi 3 tahun terakhir.");
  const reasons = [
    `Harga dasar diinterpolasi dari data pasar usia ${ageUsed} tahun.`,
    `Kondisi baterai dan fisik menerapkan faktor ${((batteryFactor * physicalFactor) * 100).toFixed(0)}%.`,
    `Trust Score ${cleanTrustScore} memberi premi paspor ${Math.round(passportPremium).toLocaleString("id-ID")} .`,
  ];
  return {
    basePrice,
    adjustedPrice,
    min: Math.round(mid * 0.93),
    mid: Math.round(mid),
    max: Math.round(mid * 1.07),
    passportPremium: Math.round(passportPremium),
    age,
    ageUsed,
    explanation: {
      source: "deterministic_template",
      summary: "Rentang dihitung dari data pasar sampel dan kondisi paspor.",
      reasons,
      ...(warnings.length ? { warnings } : {}),
    },
  };
}
