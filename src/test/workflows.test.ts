import { describe, expect, it } from "vitest";
import {
  canCompare,
  canList,
  correctRecord,
  duplicatePassport,
  orderLabels,
  verifiedIdentity,
  type Order,
} from "@/lib/workflows";
import { initialDevices } from "@/lib/demo-data";
import { purchaseDevice } from "@/lib/passport";

const device = initialDevices[0];

describe("Marketplace and passport rules", () => {
  it("limits Compare to three devices", () => {
    expect(canCompare(["a", "b", "c"], "d")).toBe(false);
    expect(canCompare(["a", "b"], "c")).toBe(true);
    expect(canCompare(["a", "b", "c"], "a")).toBe(true);
  });

  it("prevents a second passport for the same serial", () => {
    expect(duplicatePassport(initialDevices, "351234567890482")).toBe(true);
    expect(duplicatePassport(initialDevices, "351234567890482", "iphone-13")).toBe(false);
  });

  it("rejects locked, blocked, or unchecked devices for listing", () => {
    if (!device) throw new Error("Missing fixture");
    expect(canList({ ...device, identityStatus: "locked" })).toBe(false);
    expect(canList({ ...device, identityStatus: "blocked" })).toBe(false);
    expect(canList({ ...device, unlocked: false })).toBe(false);
    expect(canList({ ...device, identityStatus: "unknown" })).toBe(false);
    expect(canList(device)).toBe(true);
    expect(verifiedIdentity({ ...device, identityStatus: "unknown" })).toBe(false);
  });

  it("preserves an original record when correcting it", () => {
    const original = {
      id: "original",
      type: "servis" as const,
      date: "2025-01-01",
      description: "Catatan awal",
      evidence: "receipt.jpg",
      level: 3 as const,
      original: true,
    };
    const next = correctRecord(original, "Catatan diperbaiki", "Salah ketik");
    expect(original.description).toBe("Catatan awal");
    expect(next.id).not.toBe(original.id);
    expect(next.correctionOf).toBe(original.id);
    expect(next.level).toBe(1);
  });

  it("keeps completed purchases and one ownership transfer", () => {
    if (!device) throw new Error("Missing fixture");
    const order: Order = {
      id: "order",
      deviceId: device.id,
      buyer: "buyer",
      seller: device.owner,
      amount: device.price ?? 0,
      status: "selesai",
      createdAt: "2026-11-19T00:00:00Z",
    };
    const transferred = purchaseDevice(device, order.buyer);
    expect(orderLabels[order.status]).toBe("Pembelian selesai");
    expect(transferred.owner).toBe(order.buyer);
    expect(transferred.status).toBe("terjual");
    expect(purchaseDevice(transferred, order.buyer)).toBe(transferred);
    expect(purchaseDevice(device, device.owner)).toBe(device);
  });
});
