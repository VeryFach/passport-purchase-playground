import { createContext, useContext, useState, type ReactNode } from "react";
import { initialDevices } from "@/lib/demo-data";
import type { Device } from "@/lib/passport";
import {
  advanceOrder,
  canCompare,
  canList,
  type Order,
  type Message,
  type Inspection,
  type AuditEntry,
} from "@/lib/workflows";
import { toast } from "sonner";
type User = { id: string; name: string; role: "seller" | "buyer" | "partner" | "admin" };
type DemoState = {
  devices: Device[];
  user: User | null;
  signIn: (role: User["role"], name?: string) => void;
  signOut: () => void;
  updateDevice: (id: string, fn: (device: Device) => Device) => void;
  addDevice: (device: Device) => void;
  saved: string[];
  comparison: string[];
  toggleSaved: (id: string) => void;
  toggleCompare: (id: string) => void;
  orders: Order[];
  createOrder: (id: string) => string | null;
  orderAction: (
    id: string,
    action: "received" | "accept" | "dispute" | "refund" | "release",
    details?: { reason?: string; evidence?: string },
  ) => void;
  messages: Message[];
  sendMessage: (id: string, text: string, offer?: number) => void;
  inspections: Inspection[];
  bookInspection: (id: string, location: string, date: string) => void;
  audit: AuditEntry[];
  profile: { phone: string; address: string };
  setProfile: (profile: { phone: string; address: string }) => void;
  rateOrder: (id: string, rating: number) => void;
};
const DemoContext = createContext<DemoState | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState(initialDevices);
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [comparison, setComparison] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [profile, setProfile] = useState({ phone: "", address: "" });
  const log = (action: string, deviceId: string) =>
    setAudit((entries) => [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        actor: user?.name || "Demo",
        action,
        deviceId,
      },
      ...entries,
    ]);
  const createOrder = (id: string) => {
    const d = devices.find((x) => x.id === id);
    if (!d || !user || d.owner === user.id || d.status !== "aktif" || !canList(d)) return null;
    const existing = orders.find(
      (o) => o.deviceId === id && !["selesai", "dikembalikan"].includes(o.status),
    );
    if (existing) {
      toast.error("Perangkat sedang dalam transaksi.");
      return existing.buyer === user.id ? existing.id : null;
    }
    const order: Order = {
      id: crypto.randomUUID(),
      deviceId: id,
      buyer: user.id,
      seller: d.owner,
      amount: d.price || 0,
      status: "ditahan",
      createdAt: new Date().toISOString(),
    };
    setOrders((os) => [order, ...os]);
    log("Pesanan dibuat; dana ditahan (simulasi)", id);
    return order.id;
  };
  const orderAction: DemoState["orderAction"] = (id, action, details) => {
    const o = orders.find((x) => x.id === id);
    if (!o || !user) return;
    const next = advanceOrder(o, user.id, action, details);
    if (next === o) return;
    setOrders((os) => os.map((x) => (x.id === id ? next : x)));
    if (next.status === "selesai")
      setDevices((ds) =>
        ds.map((d) =>
          d.id === o.deviceId
            ? {
                ...d,
                owner: o.buyer,
                status: "terjual",
                ownership: [
                  ...(d.ownership || []),
                  {
                    date: new Date().toISOString().slice(0, 10),
                    from: "Pemilik sebelumnya",
                    to: "Pemilik berikutnya",
                  },
                ],
              }
            : d,
        ),
      );
    log(`Transaksi: ${next.status}`, o.deviceId);
  };
  const signIn = (role: User["role"], name?: string) =>
    setUser({
      id: role,
      role,
      name:
        name ||
        (role === "seller"
          ? "Raka Fadillah"
          : role === "buyer"
            ? "Nadia Putri"
            : role === "partner"
              ? "Mitra Servis Jakarta"
              : "Admin Demo"),
    });
  return (
    <DemoContext.Provider
      value={{
        devices,
        user,
        signIn,
        signOut: () => setUser(null),
        updateDevice: (id, fn) => {
          setDevices((ds) => ds.map((d) => (d.id === id ? fn(d) : d)));
          log("Paspor diperbarui", id);
        },
        addDevice: (d) => {
          setDevices((ds) => [d, ...ds]);
          log("Paspor dibuat", d.id);
        },
        saved,
        comparison,
        orders,
        createOrder,
        orderAction,
        messages,
        inspections,
        audit,
        profile,
        setProfile,
        toggleSaved: (id) =>
          setSaved((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])),
        toggleCompare: (id) => {
          if (!canCompare(comparison, id)) {
            toast.error("Bandingkan maksimal 3 perangkat.");
            return;
          }
          setComparison((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
        },
        sendMessage: (id, text, offer) => {
          if (!user || !text.trim()) return;
          setMessages((ms) => [
            ...ms,
            {
              id: crypto.randomUUID(),
              deviceId: id,
              sender: user.id,
              text,
              ...(offer ? { offer } : {}),
            },
          ]);
          log("Pesan dikirim", id);
        },
        bookInspection: (id, location, date) => {
          if (!user) return;
          setInspections((items) => [
            ...items,
            { id: crypto.randomUUID(), deviceId: id, location, date, status: "menunggu" },
          ]);
          log("Inspeksi dijadwalkan", id);
        },
        rateOrder: (id, rating) =>
          setOrders((os) =>
            os.map((o) =>
              o.id === id && o.buyer === user?.id && o.status === "selesai" ? { ...o, rating } : o,
            ),
          ),
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider required");
  return value;
}
