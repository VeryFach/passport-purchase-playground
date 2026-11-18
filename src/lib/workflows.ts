import type { Device, HistoryRecord } from "./passport";
export type OrderStatus = "ditahan" | "ditinjau" | "sengketa" | "selesai" | "dikembalikan";
export type Order = {
  id: string;
  deviceId: string;
  buyer: string;
  seller: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  reviewStartedAt?: string;
  reason?: string;
  evidence?: string;
  decision?: string;
  rating?: number;
};
export type Message = {
  id: string;
  deviceId: string;
  sender: string;
  text: string;
  offer?: number;
};
export type Inspection = {
  id: string;
  deviceId: string;
  location: string;
  date: string;
  status: "menunggu" | "selesai";
};
export type AuditEntry = {
  id: string;
  date: string;
  actor: string;
  action: string;
  deviceId: string;
};
export const REVIEW_HOURS = 48;
export const canCompare = (ids: string[], id: string) => ids.includes(id) || ids.length < 3;
export const duplicatePassport = (devices: Device[], serial: string, excludeId?: string) =>
  devices.some(
    (d) => d.id !== excludeId && d.serial.toUpperCase().trim() === serial.toUpperCase().trim(),
  );
export const canList = (d: Device) => d.unlocked && d.identityStatus === "checked";
export const verifiedIdentity = (d: Device) => d.unlocked && d.identityStatus === "checked";
export function anomalies(d: Device) {
  const warnings: string[] = [];
  if (d.records.some((r) => Number(r.date.slice(0, 4)) < d.year))
    warnings.push("Ada catatan sebelum tahun pembelian.");
  if (d.records.filter((r) => r.type === "ganti_part").length > 1)
    warnings.push("Ada beberapa penggantian part. Periksa komponen dan bukti servis.");
  if (d.records.some((r) => r.type === "kerusakan"))
    warnings.push("Ada catatan kerusakan. Periksa detail dan penanganannya.");
  return warnings;
}
export function correctRecord(
  record: HistoryRecord,
  description: string,
  reason: string,
): HistoryRecord {
  return {
    ...record,
    id: crypto.randomUUID(),
    description,
    correctionOf: record.id,
    correctionReason: reason,
    level: 1,
    evidence: null,
    verifiedBy: undefined,
  };
}
export function advanceOrder(
  order: Order,
  actor: string,
  action: "received" | "accept" | "dispute" | "refund" | "release",
  details?: { reason?: string; evidence?: string },
  now = new Date().toISOString(),
): Order {
  if (action === "received" && actor === order.buyer && order.status === "ditahan")
    return { ...order, status: "ditinjau", reviewStartedAt: now };
  if (action === "accept" && actor === order.buyer && order.status === "ditinjau")
    return { ...order, status: "selesai" };
  if (
    action === "dispute" &&
    actor === order.buyer &&
    order.status === "ditinjau" &&
    details?.reason &&
    details.evidence
  )
    return { ...order, status: "sengketa", reason: details.reason, evidence: details.evidence };
  if (actor === "admin" && order.status === "sengketa" && action === "refund")
    return {
      ...order,
      status: "dikembalikan",
      decision: "Pengembalian dana disetujui (simulasi).",
    };
  if (actor === "admin" && order.status === "sengketa" && action === "release")
    return { ...order, status: "selesai", decision: "Dana dilepas ke penjual (simulasi)." };
  return order;
}
export const orderLabels: Record<OrderStatus, string> = {
  ditahan: "Dana ditahan",
  ditinjau: "Masa tinjau",
  sengketa: "Dalam sengketa",
  selesai: "Selesai",
  dikembalikan: "Dana dikembalikan",
};
