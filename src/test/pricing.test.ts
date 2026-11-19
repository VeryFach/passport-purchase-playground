import { describe, expect, it } from "vitest";
import { deterministicEstimate, interpolateMarketPrice } from "@/lib/pricing";

const market = { retail_price: 1000, used_price_1y: 800, used_price_2y: 600, used_price_3y: 400 };
const device = { year: 2024, battery: 91, condition: "mulus" as const, records: [], trustScore: 0 };

describe("deterministic pricing", () => {
  it("interpolates between reference points", () => {
    expect(interpolateMarketPrice(market, 1.5)).toBe(700);
  });

  it("clamps older devices to the 3-year reference and explains it", () => {
    const result = deterministicEstimate({ ...device, year: 2018 }, market, 2026);
    expect(result?.basePrice).toBe(400);
    expect(result?.explanation.warnings).toContain("Usia di atas 3 tahun memakai titik referensi 3 tahun terakhir.");
  });

  it("returns no estimate for unsupported or future ages", () => {
    expect(deterministicEstimate(device, undefined, 2026)).toBeNull();
    expect(deterministicEstimate({ ...device, year: 2027 }, market, 2026)).toBeNull();
  });

  it("marks missing condition data without pretending it was measured", () => {
    const result = deterministicEstimate({ ...device, battery: 0 }, market, 2026);
    expect(result?.explanation.warnings).toContain("Data baterai belum diisi; faktor baterai netral digunakan.");
  });
});
