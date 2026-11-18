import { describe, expect, it } from "vitest";
import {
  estimate,
  historySchema,
  passportSchema,
  priceLabel,
  purchaseDevice,
  scoreLabel,
  trustScore,
  type Device,
  type HistoryRecord,
} from "@/lib/passport";
const device: Device = {
  id: "test",
  kind: "hp",
  brand: "Apple",
  model: "iPhone 13",
  variant: "128 GB",
  serial: "351234567890482",
  year: 2023,
  purchasePrice: 12000000,
  image: "photo.jpg",
  battery: 91,
  condition: "lecet",
  unlocked: true,
  owner: "seller",
  location: "Jakarta",
  records: [],
  price: 6000000,
  basePrice: 6000000,
  status: "aktif",
};
const record = (type: HistoryRecord["type"], level: 1 | 2 | 3): HistoryRecord => ({
  id: type,
  type,
  date: "2025-03-12",
  description: "Bukti perangkat",
  evidence: level > 1 ? "receipt.jpg" : null,
  level,
  original: true,
});
describe("Trust Score", () => {
  it("gives 20 identity points and no points for self-reported lock status", () =>
    expect(trustScore(device)).toBe(20));
  it("L1 claims add no history points", () =>
    expect(
      trustScore({
        ...device,
        records: [record("pembelian", 1), record("baterai", 1), record("servis", 1)],
      }),
    ).toBe(20));
  it("purchase proof adds 15", () =>
    expect(trustScore({ ...device, records: [record("pembelian", 2)] })).toBe(35));
  it("battery evidence adds 15", () =>
    expect(trustScore({ ...device, records: [record("baterai", 2)] })).toBe(35));
  it("documented history adds a flat 15 regardless of repeated events", () =>
    expect(
      trustScore({ ...device, records: Array.from({ length: 5 }, () => record("servis", 2)) }),
    ).toBe(35));
  it("partner verification adds 7 each and caps at 35", () =>
    expect(
      trustScore({ ...device, records: Array.from({ length: 6 }, () => record("kerusakan", 3)) }),
    ).toBe(20 + 15 + 35));
  it("badges switch at 40 and 70", () => {
    expect([39, 40, 69, 70, 100].map(scoreLabel)).toEqual([
      "Dasar",
      "Berdokumen",
      "Berdokumen",
      "Terpercaya",
      "Terpercaya",
    ]);
  });
});
describe("Indicative prices", () => {
  it("uses 3% premium for documented passports and 7% range", () => {
    const e = estimate({ ...device, records: [record("pembelian", 3), record("baterai", 3)] });
    expect(e?.mid).toBe(5932800);
    expect(e?.added).toBe(172800);
    expect(e?.min).toBe(5517504);
    expect(e?.max).toBe(6348096);
  });
  it("battery thresholds are 90 and 80", () => {
    expect(
      [90, 89, 80, 79].map(
        (battery) => estimate({ ...device, battery, condition: "mulus", unlocked: false })?.mid,
      ),
    ).toEqual([6000000, 5700000, 5700000, 5280000]);
  });
  it("non-original main parts each apply 0.92", () =>
    expect(
      estimate({
        ...device,
        condition: "mulus",
        unlocked: false,
        records: [{ ...record("ganti_part", 1), original: false }],
      })?.mid,
    ).toBe(5520000));
  it("unsupported models do not receive estimates", () =>
    expect(estimate({ ...device, basePrice: null })).toBeNull());
  it("price boundaries stay fair and outside become cheap or expensive", () =>
    expect([99, 100, 200, 201].map((p) => priceLabel(p, { min: 100, max: 200 }))).toEqual([
      "Murah",
      "Wajar",
      "Wajar",
      "Mahal",
    ]));
});
describe("Demo flow rules", () => {
  it("purchase transfers ownership and marks sold", () =>
    expect(purchaseDevice(device, "buyer")).toMatchObject({ owner: "buyer", status: "terjual" }));
  it("sold listings cannot be bought twice", () =>
    expect(purchaseDevice({ ...device, status: "terjual" }, "buyer").owner).toBe("seller"));
  it("phone IMEI requires exactly 15 digits", () =>
    expect(passportSchema.safeParse({ ...device, serial: "1234" }).success).toBe(false));
  it("history cannot be dated in future", () =>
    expect(historySchema.safeParse({ ...record("servis", 1), date: "2026-11-19" }).success).toBe(
      false,
    ));
});
