import type { Device, HistoryRecord } from "./passport";
export type OrderStatus = "selesai";
export type Order = {
  id: string;
  deviceId: string;
  buyer: string;
  seller: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
};
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
export const orderLabels: Record<OrderStatus, string> = {
  selesai: "Pembelian selesai",
};
