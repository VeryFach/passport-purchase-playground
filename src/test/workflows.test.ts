import { describe, expect, it } from "vitest";
import {
  advanceOrder,
  canCompare,
  canList,
  correctRecord,
  duplicatePassport,
  verifiedIdentity,
  REVIEW_HOURS,
  type Order,
} from "@/lib/workflows";
import { initialDevices } from "@/lib/demo-data";
const d = initialDevices[0];
const order: Order = {
  id: "order",
  deviceId: "iphone-13",
  buyer: "buyer",
  seller: "seller",
  amount: 6000000,
  status: "ditahan",
  createdAt: "2026-11-18T10:00:00Z",
};
describe("Buyer and seller rules", () => {
  it("comparison is limited to 3 listings", () => {
    expect(canCompare(["a", "b", "c"], "d")).toBe(false);
    expect(canCompare(["a", "b"], "c")).toBe(true);
    expect(canCompare(["a", "b", "c"], "a")).toBe(true);
  });
  it("one serial has only one passport", () => {
    expect(duplicatePassport(initialDevices, "351234567890482")).toBe(true);
    expect(duplicatePassport(initialDevices, "351234567890482", "iphone-13")).toBe(false);
  });
  it("locked and blocked devices cannot be listed", () => {
    if (!d) throw new Error("Missing fixture");
    expect(canList({ ...d, identityStatus: "locked" })).toBe(false);
    expect(canList({ ...d, identityStatus: "blocked" })).toBe(false);
    expect(canList({ ...d, unlocked: false })).toBe(false);
    expect(canList({ ...d, identityStatus: "unknown" })).toBe(false);
    expect(canList(d)).toBe(true);
  });
  it("verified identity needs clean lock and an identity check", () => {
    if (!d) throw new Error("Missing fixture");
    expect(verifiedIdentity({ ...d, identityStatus: "unknown" })).toBe(false);
    expect(verifiedIdentity({ ...d, unlocked: false })).toBe(false);
    expect(verifiedIdentity(d)).toBe(true);
  });
  it("verified history corrections preserve the original and create an unverified revision", () => {
    const r = {
      id: "original",
      type: "servis" as const,
      date: "2025-01-01",
      description: "Ancien diagnostic",
      evidence: "receipt.jpg",
      level: 4 as const,
      original: true,
    };
    const next = correctRecord(r, "Description corrigée", "Erreur de saisie");
    expect(r.description).toBe("Ancien diagnostic");
    expect(next.id).not.toBe(r.id);
    expect(next.correctionOf).toBe("original");
    expect(next.level).toBe(1);
  });
});
describe("Demo escrow transitions", () => {
  it("paying does not transfer the passport before review", () => {
    expect(order.status).toBe("ditahan");
    expect(advanceOrder(order, "buyer", "accept")).toBe(order);
  });
  it("only buyer can begin review after receipt", () => {
    expect(advanceOrder(order, "seller", "received")).toBe(order);
    expect(
      advanceOrder(order, "buyer", "received", undefined, "2026-11-18T12:00:00Z"),
    ).toMatchObject({ status: "ditinjau", reviewStartedAt: "2026-11-18T12:00:00Z" });
  });
  it("review lasts 2 times 24 hours", () => expect(REVIEW_HOURS).toBe(48));
  it("acceptance after review completes transaction", () =>
    expect(advanceOrder({ ...order, status: "ditinjau" }, "buyer", "accept").status).toBe(
      "selesai",
    ));
  it("a dispute requires a reason and evidence", () => {
    const review = { ...order, status: "ditinjau" as const };
    expect(advanceOrder(review, "buyer", "dispute", { reason: "Layar retak" })).toBe(review);
    expect(
      advanceOrder(review, "buyer", "dispute", { reason: "Layar retak", evidence: "proof.jpg" })
        .status,
    ).toBe("sengketa");
  });
  it("buyer refunds and seller releases disputed funds without an admin", () => {
    const disputed = { ...order, status: "sengketa" as const };
    expect(advanceOrder(disputed, "buyer", "release")).toBe(disputed);
    expect(advanceOrder(disputed, "seller", "refund")).toBe(disputed);
    expect(advanceOrder(disputed, "buyer", "refund").status).toBe("dikembalikan");
    expect(advanceOrder(disputed, "seller", "release").status).toBe("selesai");
  });
});
