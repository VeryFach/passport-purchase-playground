import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { initialDevices } from "@/lib/demo-data";
import { conditionToDbValue, estimate, type Device, type HistoryRecord } from "@/lib/passport";
import { explainPrice } from "@/lib/pricing-ai.server";
import type { Order } from "@/lib/workflows";
import {
  fetchMarketplaceFeed,
  fetchWorkspace,
  recordTitle,
  RECORD_TO_DB_TYPE,
  uploadEvidence,
  uploadProductPhoto,
} from "@/lib/supabase/passport-data";
import { createClient } from "@/lib/supabase/client";
import { readSupabaseBrowserEnv } from "@/lib/supabase/env";
import { errorMessage } from "@/lib/supabase/errors";

type UserRole = "user" | "mitra";
type User = { id: string; name: string; role: UserRole };
type ProfileState = { phone: string };

type DemoState = {
  devices: Device[];
  user: User | null;
  authReady: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateDevice: (id: string, fn: (device: Device) => Device) => Promise<boolean>;
  addDevice: (device: Device) => void;
  saveDevice: (device: Device, existingId?: string) => Promise<Device | null>;
  saved: string[];
  comparison: string[];
  toggleSaved: (id: string) => void;
  toggleCompare: (id: string) => void;
  orders: Order[];
  createOrder: (id: string) => Promise<string | null>;
  profile: ProfileState;
  setProfile: (profile: ProfileState) => void;
  requestVerification: (recordId: string) => Promise<void>;
  reviewVerification: (recordId: string, approve: boolean, note?: string) => Promise<void>;
  pendingVerifications: Array<{
    recordId: string;
    deviceId: string;
    deviceModel: string;
    deviceBrand: string;
    serial: string;
    recordType: HistoryRecord["type"];
    recordTitle: string;
    description: string;
    date: string;
    evidence: string | null;
    requestedAt: string | null;
  }>;
  withdrawListing: (listingId: string) => Promise<boolean>;
};

const DemoContext = createContext<DemoState | null>(null);

const EMPTY_PROFILE: ProfileState = { phone: "" };

export function DemoProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const configured = readSupabaseBrowserEnv().configured;
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfileState] = useState<ProfileState>(EMPTY_PROFILE);
  const [pendingVerifications, setPendingVerifications] = useState<DemoState["pendingVerifications"]>(
    [],
  );
  const [saved, setSaved] = useState<string[]>([]);
  const [comparison, setComparison] = useState<string[]>([]);
  const [profileName, setProfileName] = useState("Pengguna");

  const feedQuery = useQuery({
    queryKey: ["marketplace_feed"],
    queryFn: () => fetchMarketplaceFeed(),
    enabled: configured,
    staleTime: 15_000,
  });

  const workspaceQuery = useQuery({
    queryKey: ["workspace", userId],
    queryFn: () => fetchWorkspace(userId as string),
    enabled: Boolean(userId) && configured,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!configured) {
      setAuthReady(true);
      return;
    }
    const supabase = createClient();
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUserId(data.session?.user.id ?? null);
        setSessionEmail(data.session?.user.email ?? "");
        setAuthReady(true);
      })
      .catch(() => {
        if (active) setAuthReady(true);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setSessionEmail(session?.user.email ?? "");
      setAuthReady(true);
      if (!session) {
        queryClient.removeQueries({ queryKey: ["workspace"] });
        setOrders([]);
        setProfileState(EMPTY_PROFILE);
        setPendingVerifications([]);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [configured, queryClient]);

  useEffect(() => {
    if (!configured) {
      setDevices(initialDevices);
      return;
    }
    const byId = new Map<string, Device>();
    for (const d of feedQuery.data ?? []) {
      byId.set(d.id, d);
    }
    if (workspaceQuery.data) {
      for (const d of workspaceQuery.data.devices) {
        byId.set(d.id, d);
      }
    }
    setDevices([...byId.values()]);
  }, [configured, feedQuery.data, workspaceQuery.data]);

  useEffect(() => {
    const data = workspaceQuery.data;
    if (!data) return;
    setOrders(data.orders);
    setProfileState({
      phone: data.profile?.phone ?? "",
    });
    setProfileName(data.profile?.full_name || sessionEmail.split("@")[0] || "Pengguna");
    setPendingVerifications(
      data.pendingVerifications.map((item) => ({
        recordId: item.record_id,
        deviceId: item.device_id,
        deviceModel: item.device_model,
        deviceBrand: item.device_brand,
        serial: item.serial_number || item.imei || "",
        recordType:
          item.record_type === "part_replacement"
            ? "ganti_part"
            : item.record_type === "service"
              ? "servis"
              : item.record_type === "purchase"
                ? "pembelian"
                : item.record_type === "battery"
                  ? "baterai"
                  : "kerusakan",
        recordTitle: item.record_title,
        description: item.record_description,
        date: item.event_date,
        evidence: item.evidence_url ?? null,
        requestedAt: item.requested_at,
      })),
    );
  }, [workspaceQuery.data, sessionEmail]);

  useEffect(() => {
    if (!feedQuery.error) return;
    toast.error(errorMessage(feedQuery.error, "Gagal memuat feed marketplace."));
  }, [feedQuery.error]);

  useEffect(() => {
    if (!workspaceQuery.error) return;
    toast.error(errorMessage(workspaceQuery.error, "Gagal memuat data pengguna."));
  }, [workspaceQuery.error]);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["marketplace_feed"] }),
      queryClient.invalidateQueries({ queryKey: ["workspace"] }),
    ]);
  }, [queryClient]);

  const isMitra = workspaceQuery.data?.profile?.role === "mitra";

  const user = useMemo<User | null>(() => {
    if (!userId) return null;
    return {
      id: userId,
      name: profileName,
      role: isMitra ? "mitra" : "user",
    };
  }, [userId, profileName, isMitra]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(errorMessage(error));
    },
    [],
  );

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    });
    if (error) throw new Error(errorMessage(error));
    if (data.session) {
      setUserId(data.session.user.id);
      setSessionEmail(data.session.user.email ?? email);
      return;
    }
    if (data.user) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!signInError && signInData.session) {
        setUserId(signInData.session.user.id);
        setSessionEmail(signInData.session.user.email ?? email);
        return;
      }
    }
    throw new Error("Akun dibuat tetapi membutuhkan konfirmasi email sebelum dapat masuk.");
  }, []);

  const signOut = useCallback(async () => {
    if (configured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    queryClient.removeQueries({ queryKey: ["workspace"] });
    setUserId(null);
    setOrders([]);
    setSaved([]);
    setComparison([]);
    setProfileState(EMPTY_PROFILE);
    await queryClient.invalidateQueries({ queryKey: ["marketplace_feed"] });
  }, [configured, queryClient]);

  const createOrder = useCallback(
    async (deviceId: string): Promise<string | null> => {
      if (isMitra) {
        toast.error("Akun mitra hanya dapat melakukan verifikasi.");
        return null;
      }
      const device = devices.find((item) => item.id === deviceId);
      if (!device?.listingId) {
        toast.error("Listing tidak tersedia untuk dibeli.");
        return null;
      }
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("buy_listing", {
          p_listing_id: device.listingId,
        });
        if (error) throw error;
        await refresh();
        return (data as string) ?? null;
      } catch (error) {
        toast.error(errorMessage(error, "Pembelian simulasi gagal."));
        return null;
      }
    },
    [devices, refresh, isMitra],
  );

  const persistDeviceUpdate = useCallback(
    async (current: Device, next: Device) => {
      if (!userId) return false;
      const supabase = createClient();
      try {
        if (next.status === "aktif" && current.status !== "aktif") {
          await publishListingFor(next, userId);
          await refresh();
          return true;
        }

        if (next.status === "draf" && current.status === "aktif" && current.listingId) {
          await supabase.rpc("withdraw_listing", { p_listing_id: current.listingId });
        }

        const updates: Record<string, unknown> = {};
        if (next.variant !== current.variant) updates["variant"] = next.variant || null;
        if (next.battery !== current.battery) updates["battery_health"] = next.battery || null;
        if (next.condition !== current.condition) {
          updates["physical_condition"] = conditionToDbValue(next.condition);
        }
        if (next.unlocked !== current.unlocked) {
          updates["lock_status"] = next.unlocked ? "claimed_unlocked" : "claimed_locked";
        }
        if (next.purchasePrice !== current.purchasePrice) {
          updates["purchase_price"] = next.purchasePrice || null;
        }
        if (next.year !== current.year && next.year > 0) {
          updates["purchase_date"] = `${next.year}-01-01`;
        }
        if (next.image !== current.image) {
          const photo = await uploadProductPhoto(next.image, userId);
          if (photo) updates["photo_url"] = photo;
        }

        const nextSpecs = {
          location: next.location,
          accessories: next.accessories ?? "",
          serviceDue: next.serviceDue ?? "",
          warrantyUntil: next.warrantyUntil ?? "",
          identityStatus: next.identityStatus ?? "unknown",
          showLocation: next.privacy?.showLocation ?? true,
          showPurchasePrice: next.privacy?.showPurchasePrice ?? false,
        };
        const currentSpecs = {
          location: current.location,
          accessories: current.accessories ?? "",
          serviceDue: current.serviceDue ?? "",
          warrantyUntil: current.warrantyUntil ?? "",
          identityStatus: current.identityStatus ?? "unknown",
          showLocation: current.privacy?.showLocation ?? true,
          showPurchasePrice: current.privacy?.showPurchasePrice ?? false,
        };
        if (JSON.stringify(nextSpecs) !== JSON.stringify(currentSpecs)) {
          updates["specifications"] = nextSpecs;
        }

        if (Object.keys(updates).length) {
          const { error } = await supabase.from("devices").update(updates).eq("id", current.id);
          if (error) throw error;
        }

        const existingIds = new Set(current.records.map((record) => record.id));
        const added = next.records.filter((record) => !existingIds.has(record.id));
        for (const record of added) {
          const evidenceUrl = record.evidence
            ? await uploadEvidence(record.evidence, userId)
            : null;
          const { error } = await supabase.from("history_records").insert({
            device_id: current.id,
            type: RECORD_TO_DB_TYPE[record.type],
            title: recordTitle(record.type),
            description: record.description,
            event_date: record.date,
            evidence_url: evidenceUrl,
            part_original: record.type === "ganti_part" ? record.original : null,
            is_public: true,
            details: {
              original: record.original,
              ...(record.correctionOf ? { correctionOf: record.correctionOf } : {}),
              ...(record.correctionReason ? { correctionReason: record.correctionReason } : {}),
            },
          });
          if (error) throw error;
        }

        await refresh();
        return true;
      } catch (error) {
        toast.error(errorMessage(error, "Gagal menyimpan perubahan perangkat."));
        return false;
      }
    },
    [userId, refresh],
  );

  const updateDevice = useCallback(
    (id: string, fn: (device: Device) => Device): Promise<boolean> => {
      if (isMitra) return Promise.resolve(false);
      let persistence = Promise.resolve(false);
      setDevices((currentDevices) => {
        const current = currentDevices.find((device) => device.id === id);
        if (!current) return currentDevices;
        const next = fn(current);
        persistence = persistDeviceUpdate(current, next);
        void persistence.then((saved) => {
          if (!saved) {
            setDevices((items) => items.map((item) => (item.id === id ? current : item)));
          }
        });
        return currentDevices.map((device) => (device.id === id ? next : device));
      });
      return persistence;
    },
    [persistDeviceUpdate, isMitra],
  );

  const addDevice = useCallback(
    (device: Device) => {
      if (isMitra) {
        toast.error("Akun mitra hanya dapat melakukan verifikasi.");
        return;
      }
      setDevices((currentDevices) => [device, ...currentDevices]);
      if (userId) {
        void saveNewDevice(device, userId)
          .then(() => refresh())
          .catch((error) => toast.error(errorMessage(error, "Gagal menyimpan paspor.")));
      }
    },
    [userId, refresh, isMitra],
  );

  const saveDevice = useCallback(
    async (device: Device, existingId?: string): Promise<Device | null> => {
      if (!userId) return null;
      if (isMitra) {
        toast.error("Akun mitra hanya dapat melakukan verifikasi.");
        return null;
      }
      if (existingId) {
        const current = devices.find((item) => item.id === existingId);
        if (!current) return null;
        const next = { ...device, id: existingId };
        setDevices((items) => items.map((item) => (item.id === existingId ? next : item)));
        void persistDeviceUpdate(current, next).then((saved) => {
          if (!saved) {
            setDevices((items) => items.map((item) => (item.id === existingId ? current : item)));
          }
        });
        return next;
      }
      try {
        const row = await saveNewDevice(device, userId);
        await refresh();
        return { ...device, id: row.id, passportCode: row.passport_code };
      } catch (error) {
        toast.error(errorMessage(error, "Gagal menyimpan paspor."));
        return null;
      }
    },
    [userId, devices, persistDeviceUpdate, refresh, isMitra],
  );

  const setProfile = useCallback(
    (nextProfile: ProfileState) => {
      setProfileState(nextProfile);
      if (!userId) return;
      const supabase = createClient();
      void supabase
        .from("profiles")
        .update({ phone: nextProfile.phone })
        .eq("id", userId)
        .then(({ error }) => {
          if (error) toast.error(errorMessage(error, "Gagal menyimpan profil."));
        });
    },
    [userId],
  );

  const requestVerification = useCallback(
    async (recordId: string) => {
      if (isMitra) {
        toast.error("Akun mitra tidak dapat mengajukan verifikasi.");
        return;
      }
      try {
        const supabase = createClient();
        const { error } = await supabase.rpc("request_verification", { p_history_id: recordId });
        if (error) throw error;
        toast.success("Permintaan verifikasi dikirim ke Mitra (simulasi).");
        await refresh();
      } catch (error) {
        toast.error(errorMessage(error, "Gagal mengajukan verifikasi."));
      }
    },
    [refresh, isMitra],
  );

  const reviewVerification = useCallback(
    async (recordId: string, approve: boolean, note?: string) => {
      if (!isMitra) {
        toast.error("Hanya akun mitra yang dapat meninjau verifikasi.");
        return;
      }
      try {
        const supabase = createClient();
        const { error } = await supabase.rpc("review_verification", {
          p_history_id: recordId,
          p_approve: approve,
          p_note: note ?? null,
        });
        if (error) throw error;
        toast.success(approve ? "Catatan terverifikasi (simulasi)." : "Verifikasi ditolak.");
        await refresh();
      } catch (error) {
        toast.error(errorMessage(error, "Gagal memproses verifikasi."));
      }
    },
    [refresh, isMitra],
  );

  const withdrawListing = useCallback(
    async (listingId: string): Promise<boolean> => {
      if (isMitra) return false;
      try {
        const supabase = createClient();
        const { error } = await supabase.rpc("withdraw_listing", { p_listing_id: listingId });
        if (error) throw error;
        await refresh();
        return true;
      } catch (error) {
        toast.error(errorMessage(error, "Gagal menarik listing."));
        return false;
      }
    },
    [refresh, isMitra],
  );

  const value: DemoState = {
    devices,
    user,
    authReady,
    isConfigured: configured,
    signIn,
    signUp,
    signOut,
    refresh,
    updateDevice,
    addDevice,
    saveDevice,
    saved,
    comparison,
    toggleSaved: (id) =>
      setSaved((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])),
    toggleCompare: (id) => {
      setComparison((ids) => {
        if (ids.includes(id)) return ids.filter((x) => x !== id);
        if (ids.length >= 3) {
          toast.error("Bandingkan maksimal 3 perangkat.");
          return ids;
        }
        return [...ids, id];
      });
    },
    orders,
    createOrder,
    profile,
    setProfile,
    requestVerification,
    reviewVerification,
    pendingVerifications,
    withdrawListing,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

async function publishListingFor(device: Device, userId: string): Promise<void> {
  const supabase = createClient();
  const photo = await uploadProductPhoto(device.image, userId);
  const photos = photo ? [photo] : [];
  const { data, error } = await supabase.rpc("publish_listing", {
    p_device_id: device.id,
    p_title: `${device.brand} ${device.model}`.trim(),
    p_price: device.price ?? 0,
    p_description: device.variant,
    p_photos: photos,
  });
  if (error) throw error;
  if (data) {
    // Pricing refresh is optional for this MVP. A failed RPC must not make a
    // successfully-created listing look like a failed publication.
    const estimateRefresh = await supabase.rpc("refresh_listing_estimate", {
      p_listing_id: data as string,
    });
    if (estimateRefresh.error) {
      console.warn("[paspor] listing estimate refresh unavailable", estimateRefresh.error.message);
    }
    const range = estimate(device);
    if (range) {
      try {
        const explanation = await explainPrice({
          data: {
            model: `${device.brand} ${device.model}`,
            condition: device.condition,
            battery: device.battery,
            trustScore: device.trustScore ?? 0,
            min: range.min,
            mid: range.mid,
            max: range.max,
            passportPremium: range.added,
          },
        });
        const { error: explanationError } = await supabase.rpc("save_listing_explanation", {
          p_listing_id: data as string,
          p_explanation: explanation,
        });
        if (explanationError) {
          console.warn("[paspor] AI explanation persistence unavailable", explanationError.message);
        }
      } catch (explanationError) {
        console.warn("[paspor] AI explanation unavailable", explanationError);
      }
    }
  }
}

async function saveNewDevice(
  device: Device,
  userId: string,
): Promise<{ id: string; passport_code: string }> {
  const supabase = createClient();
  const photo = await uploadProductPhoto(device.image, userId);
  const serial = device.serial.trim();
  const isLaptop = device.kind === "laptop";
  const { data, error } = await supabase
    .from("devices")
    .insert({
    category: device.kind === "hp" ? "smartphone" : "laptop",
    brand: device.brand.trim(),
    model: device.model.trim(),
    variant: device.variant.trim(),
    serial_number: isLaptop ? serial : null,
    imei: isLaptop ? null : serial,
    purchase_date: device.year > 0 ? `${device.year}-01-01` : null,
    purchase_price: device.purchasePrice || null,
    battery_health: device.battery || null,
    physical_condition: conditionToDbValue(device.condition),
    photo_url: photo,
    lock_status: device.unlocked ? "claimed_unlocked" : "claimed_locked",
    specifications: {
      location: device.location,
      accessories: device.accessories ?? "",
      serviceDue: device.serviceDue ?? "",
      warrantyUntil: device.warrantyUntil ?? "",
      identityStatus: device.identityStatus ?? "unknown",
      showLocation: device.privacy?.showLocation ?? true,
      showPurchasePrice: device.privacy?.showPurchasePrice ?? false,
    },
    })
    .select("id,passport_code")
    .single();
  if (error) throw error;
  return data as { id: string; passport_code: string };
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider required");
  return value;
}
