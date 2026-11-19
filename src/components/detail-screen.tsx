import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  dateLabel,
  estimate,
  maskedSerial,
  priceLabel,
  recordNames,
  rupiah,
  scoreLabel,
  shortPrice,
  trustScore,
  type Device,
} from "@/lib/passport";
import { fetchPublicDevice } from "@/lib/supabase/passport-data";
import { anomalies } from "@/lib/workflows";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  History,
  LockKeyhole,
  MapPin,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDemo } from "./demo-provider";
import { EmptyState, LevelChip, PageHeading, PriceBadge, ScoreRing } from "./passport-ui";

/** Reusable Mobile-First Collapsible Card */
function CollapsibleSection({
  title,
  summary,
  badge,
  defaultOpen = false,
  children,
  id,
}: {
  title: string;
  summary?: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      // Tambahkan w-full dan min-w-0 agar lebar tidak berubah saat open/close
      className="group w-full min-w-0 scroll-mt-20 border-b border-border py-4 last:border-b-0"
    >
      <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-3 py-1 select-none [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {badge}
          </div>
          {summary && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground group-open:hidden">
              {summary}
            </p>
          )}
        </div>
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted/60 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
          <ChevronDown className="size-4" />
        </div>
      </summary>
      {/* Tambahkan min-w-0 pada wrapper konten */}
      <div className="min-w-0 pt-4">{children}</div>
    </details>
  );
}

export function PriceSuggestion({ device }: { device: Device }) {
  const e = estimate(device);

  return (
    <CollapsibleSection
      title="Estimasi harga wajar"
      summary={e ? `${shortPrice(e.min)} – ${shortPrice(e.max)} · Data sampel` : "Belum tersedia"}
      badge={
        e && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {shortPrice(e.min)} – {shortPrice(e.max)}
          </span>
        )
      }
    >
      {e ? (
        <div className="rounded-xl bg-muted/40 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-bold tabular-nums">
              {shortPrice(e.min)} – {shortPrice(e.max)}
            </p>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Data Sampel
            </span>
          </div>

          <div className="relative my-4 h-1.5 rounded-full bg-muted">
            <div className="absolute inset-y-0 left-[20%] right-[20%] rounded-full bg-trust-soft" />
            <div className="absolute left-1/2 top-[-3px] h-3 w-1 rounded bg-trust" />
          </div>

          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-trust" />
              <span>
                Baterai {device.battery}% ({device.battery >= 90 ? "sehat" : "disesuaikan"})
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-trust" />
              <span>
                Fisik{" "}
                {device.condition === "mulus"
                  ? "mulus"
                  : device.condition === "lecet"
                    ? "lecet ringan"
                    : "retak/penyok"}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-trust" />
              <span>Nilai tambah paspor +{rupiah(e.added)}</span>
            </li>
          </ul>
          {device.estimateExplanation && (
            <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              <p>{device.estimateExplanation.summary}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {device.estimateExplanation.reasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
              {device.estimateExplanation.source === "deterministic_template" && (
                <p className="mt-2 text-[10px]">Penjelasan otomatis berbasis rumus; AI tidak tersedia.</p>
              )}
            </div>
          )}

          <p className="mt-3 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
            *Estimasi indikatif dari data contoh, bukan harga pasar real-time.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Estimasi belum tersedia untuk model ini.</p>
      )}
    </CollapsibleSection>
  );
}

export function DetailScreen({ id }: { id: string }) {
  const { devices, user, createOrder, withdrawListing } = useDemo();
  const navigate = useNavigate();
  const localDevice = devices.find((x) => x.id === id || x.passportCode === id);
  const [publicDevice, setPublicDevice] = useState<Device | null>(null);
  const publicDeviceMatches =
    publicDevice?.id === id || publicDevice?.passportCode === id ? publicDevice : null;
  const d = localDevice
    ? {
        ...localDevice,
        ownership: publicDeviceMatches
          ? publicDeviceMatches.ownership
          : localDevice.ownership,
        currentOwnerName:
          publicDeviceMatches?.currentOwnerName ?? localDevice.currentOwnerName,
      }
    : publicDeviceMatches;
  const [buy, setBuy] = useState(false),
    [qrOpen, setQrOpen] = useState(false),
    [qr, setQr] = useState(""),
    [evidence, setEvidence] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setPublicDevice(null);
    fetchPublicDevice(id)
      .then((device) => {
        if (active) setPublicDevice(device);
      })
      .catch(() => {
        if (active) setPublicDevice(null);
      });
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    if (!qrOpen) return;
    const code = d?.passportCode ?? id;
    QRCode.toDataURL(`${window.location.origin}/p/${code}`, { width: 280, margin: 2 })
      .then(setQr)
      .catch(() => toast.error("QR belum dapat dibuat"));
  }, [qrOpen, id, d?.passportCode]);
  if (!d) {
    return (
      <main className="page-container py-12">
        <EmptyState title="Paspor tidak ditemukan">
          <Button asChild>
            <Link to="/">Kembali ke jelajahi</Link>
          </Button>
        </EmptyState>
      </main>
    );
  }

  const owner = user?.id === d.owner;
  const score = trustScore(d);
  const e = estimate(d);
  const deviceAnomalies = anomalies(d);
  const partReplacements = d.records.filter((r) => r.type === "ganti_part");
  const hasNonOriginalPart = partReplacements.some((r) => !r.original);

  const conditionLabel =
    d.condition === "mulus" ? "Mulus" : d.condition === "lecet" ? "Lecet ringan" : "Retak / penyok";

  const requestBuy = () => {
    if (!user) {
      navigate({ to: "/login", search: { next: `/p/${d.passportCode ?? d.id}` } });
      return;
    }
    if (user.role === "mitra") {
      toast.error("Akun mitra hanya dapat melakukan verifikasi.");
      return;
    }
    setBuy(true);
  };
  const confirmBuy = async () => {
    if (!user || d.status !== "aktif" || owner) return;
    setBusy(true);
    try {
      const orderId = await createOrder(d.id);
      if (!orderId) {
        toast.error("Pesanan gagal dibuat. Coba muat ulang lalu ulangi.");
        return;
      }
      setBuy(false);
      toast.success("Pembelian simulasi berhasil · Paspor berpindah ke akun Anda");
      navigate({ to: "/orders/$id", params: { id: orderId } });
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!d.listingId) return;
    try {
      await withdrawListing(d.listingId);
      toast.success("Listing berhasil ditarik.");
    } catch {
      toast.error("Gagal menarik listing. Coba lagi.");
    }
  };

  return (
    <main className="page-container reading-screen pb-28 pt-5 md:py-8">
      <PageHeading
        title="Detail perangkat"
        subtitle={`Paspor Digital · ${d.passportCode ?? `PD-${d.id.slice(0, 8).toUpperCase()}`}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)] lg:gap-10">
        <div className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-photo sm:aspect-[1.35]">
            <img src={d.image} alt={d.model} width={1024} height={768} className="photo-image" />
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
              {d.status === "aktif"
                ? "Tersedia"
                : d.status === "terjual"
                  ? "Terjual"
                  : "Draf Paspor"}
            </span>
          </div>

          {/* Title & QR */}
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {d.brand} · {d.kind === "hp" ? "Handphone" : "Laptop"}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{d.model}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{d.variant}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-xl bg-card"
              aria-label="Lihat QR paspor"
              onClick={() => setQrOpen(true)}
            >
              <QrCode className="size-4" />
            </Button>
          </div>

          {/* Price & Location */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                {d.price ? rupiah(d.price) : "Belum ditayangkan"}
              </p>
              {d.price && e && <PriceBadge label={priceLabel(d.price, e)} />}
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {d.privacy?.showLocation === false ? "Lokasi disembunyikan" : d.location}
            </p>
          </div>

          {/* Quick Scannable Highlights (3 Key Metrics) */}
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-3 text-center">
            <div>
              <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <BatteryCharging className="size-3.5" /> Baterai
              </p>
              <p className="mt-0.5 text-sm font-semibold">{d.battery}%</p>
            </div>
            <div className="border-x border-border">
              <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="size-3.5" /> Kondisi
              </p>
              <p className="mt-0.5 text-sm font-semibold">{conditionLabel}</p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <History className="size-3.5" /> Riwayat
              </p>
              <p className="mt-0.5 text-sm font-semibold">{d.records.length} catatan</p>
            </div>
          </div>

          {/* Mobile Trust Score Card (Tampil di atas lipatan di mobile, pindah ke kanan di desktop) */}
          <div className="mt-5 lg:hidden">
            <TrustScoreCard score={score} />
          </div>

          {/* Collapsible Accordions (Left Column on Desktop, Stacked on Mobile) */}
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card px-4">
            {/* 1. Spesifikasi */}
            <CollapsibleSection
              title="Spesifikasi & Identitas"
              summary={`${maskedSerial(d.serial)} · Beli ${d.year} · ${d.unlocked ? "Bebas Kunci" : "Cek Status"}`}
              defaultOpen={true}
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                {[
                  ["Serial / IMEI", maskedSerial(d.serial)],
                  ["Tahun beli", String(d.year)],
                  ["Kondisi fisik", conditionLabel],
                  ["Baterai", `${d.battery}%`],
                  ["Kelengkapan", d.accessories || "Tidak dicatat"],
                  ...(d.privacy?.showPurchasePrice
                    ? [["Harga beli awal", rupiah(d.purchasePrice)]]
                    : []),
                ].map(([name, value]) => (
                  <div key={name}>
                    <dt className="text-xs text-muted-foreground">{name}</dt>
                    <dd className="mt-0.5 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/70 px-3 py-2.5 text-xs text-muted-foreground">
                <LockKeyhole className="size-4 shrink-0 text-foreground/70" />
                <span>
                  {d.identityStatus === "blocked"
                    ? "Terblokir (simulasi)"
                    : d.identityStatus === "locked"
                      ? "Terkunci (simulasi)"
                      : d.unlocked
                        ? "Bebas iCloud / FRP / MDM"
                        : "Status kunci belum dikonfirmasi"}{" "}
                  · <strong className="font-medium">Klaim penjual (L1)</strong>
                </span>
              </div>
            </CollapsibleSection>

            {/* 2. Rantai Kepemilikan */}
            <CollapsibleSection
  title="Rantai kepemilikan"
  summary={
    d.ownership?.length
      ? `${d.ownership.length} riwayat perpindahan${
          d.currentOwnerName ? ` · Pemilik: ${d.currentOwnerName}` : ""
        }`
      : d.currentOwnerName
        ? `Pemilik saat ini: ${d.currentOwnerName}`
        : "Belum ada catatan kepemilikan"
  }
>
  <div className="space-y-4">
    {/* Highlight Pemilik Saat Ini */}
    {d.currentOwnerName && (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              Pemilik saat ini
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {d.currentOwnerName}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {d.ownership?.length ? "Pemilik aktif" : "Tangan pertama"}
        </span>
      </div>
    )}

    {/* Timeline Perpindahan atau Empty State */}
    {d.ownership?.length ? (
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Riwayat perpindahan ({d.ownership.length})
        </p>

        <div className="relative pl-5">
          {/* Garis penghubung vertikal */}
          <div
            aria-hidden="true"
            className="absolute bottom-3.5 left-[7px] top-3.5 w-px bg-border"
          />

          <ul className="space-y-2.5">
            {d.ownership.map((o, i) => (
              <li
                key={i}
                className="relative flex flex-col justify-between gap-1.5 rounded-xl border border-border/50 bg-muted/25 px-3.5 py-2.5 transition-colors hover:bg-muted/45 sm:flex-row sm:items-center sm:gap-3"
              >
                {/* Titik node timeline */}
                <span
                  aria-hidden="true"
                  className="absolute -left-5 top-3.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-primary bg-background"
                />

                {/* Alur pemilik */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">{o.from}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="font-semibold text-foreground">{o.to}</span>
                </div>

                {/* Tanggal perpindahan */}
                <div className="flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground sm:shrink-0">
                  <Calendar className="h-3 w-3 shrink-0 opacity-70" />
                  <span>{dateLabel(o.date)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-5 text-center">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <History className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-foreground">
          Belum ada riwayat perpindahan tangan
        </p>
        <p className="mt-0.5 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
          {d.currentOwnerName
            ? "Perangkat ini masih tercatat pada pemilik awal dan belum pernah dipindahtangankan."
            : "Perpindahan kepemilikan berikutnya akan tercatat secara otomatis di paspor ini."}
        </p>
      </div>
    )}

    {/* Catatan jaminan integritas data */}
    <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" />
      <span>
        Riwayat teknis dan servis tetap melekat pada perangkat meski kepemilikan berpindah.
      </span>
    </div>
  </div>
</CollapsibleSection>
          </div>
        </div>

        {/* KOLOM KANAN: Paspor, Poin Penting, Riwayat & Action */}
        <div className="min-w-0 space-y-5">
          {/* Desktop Trust Score Card */}
          <div className="hidden lg:block">
            <TrustScoreCard score={score} />
          </div>

          {/* Desktop Action Box */}
          <div className="hidden rounded-2xl border border-border bg-card p-5 lg:block">
            <ActionButtons
              d={d}
              id={d.id}
              owner={owner}
              requestBuy={requestBuy}
              onWithdraw={handleWithdraw}
            />
            <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
              Pembelian simulasi · Tidak ada pembayaran sungguhan
            </p>
          </div>

          {/* Accordion Group Right */}
          <div className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
            {/* 3. Yang Perlu Anda Tahu */}
            <CollapsibleSection
              title="Yang perlu diperhatikan"
              summary={
                deviceAnomalies.length > 0
                  ? `${deviceAnomalies.length} peringatan ditemukan · Tap untuk detail`
                  : `Baterai ${d.battery}% · ${partReplacements.length} ganti part`
              }
              badge={
                deviceAnomalies.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-document-soft px-2 py-0.5 text-[11px] font-medium text-document">
                    <AlertTriangle className="size-3" /> {deviceAnomalies.length} Catatan
                  </span>
                )
              }
              defaultOpen={deviceAnomalies.length > 0}
            >
              <div className="space-y-3 text-xs">
                {deviceAnomalies.map((w) => (
                  <div
                    key={w}
                    className="flex items-start gap-2 rounded-lg bg-document-soft p-3 text-document"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p className="leading-relaxed">{w}</p>
                  </div>
                ))}

                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="font-semibold text-foreground">Baterai {d.battery}%</p>
                  <p className="mt-0.5 leading-relaxed text-muted-foreground">
                    {d.battery < 80
                      ? "Disarankan menganggarkan biaya ganti baterai."
                      : "Kapasitas masih layak pakai. Cek riwayat pengujian."}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="font-semibold text-foreground">
                    {partReplacements.length} penggantian part
                  </p>
                  <p className="mt-0.5 leading-relaxed text-muted-foreground">
                    {hasNonOriginalPart
                      ? "Terdapat part non-original, periksa bukti di riwayat."
                      : "Tidak ada catatan part non-original."}
                  </p>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  *Verifikasi mitra dalam demo tidak menjamin seluruh kondisi perangkat.
                </p>
              </div>
            </CollapsibleSection>

            {/* 4. Estimasi Harga */}
            <PriceSuggestion device={d} />

            {/* 5. Riwayat Perangkat */}
            <CollapsibleSection
              id="riwayat"
              title="Riwayat perangkat"
              summary={
                d.records.length
                  ? `Terakhir: ${recordNames[d.records[d.records.length - 1].type]}`
                  : "Belum ada catatan"
              }
              badge={
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {d.records.length}
                </span>
              }
              defaultOpen={d.records.length > 0 && d.records.length <= 3}
            >
              {d.records.length ? (
                <div className="space-y-0 pt-1">
                  {[...d.records].reverse().map((r) => (
                    <div
                      key={r.id}
                      className="relative flex gap-3 border-l border-border pb-5 pl-4 last:pb-1"
                    >
                      <div className="-ml-[29px] mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card">
                        <FileText className="size-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <h3 className="text-xs font-semibold">{recordNames[r.type]}</h3>
                          <LevelChip level={r.level} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {dateLabel(r.date)} · {r.verifiedBy ? r.verifiedBy : "Catatan pemilik"}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">
                          {r.description}
                        </p>
                        {r.evidence && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-8 gap-1.5 px-2.5 text-xs"
                            onClick={() => setEvidence(r.evidence)}
                          >
                            <img
                              src={r.evidence}
                              alt="Bukti"
                              width={20}
                              height={20}
                              className="size-4 rounded object-cover"
                            />
                            Lihat bukti
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Belum ada riwayat tercatat. Periksa kondisi fisik secara langsung saat COD/tinjau.
                </p>
              )}
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR (Satu-satunya CTA di layar mobile, bebas duplikasi) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto max-w-lg">
          <ActionButtons
            d={d}
            id={d.id}
            owner={owner}
            requestBuy={requestBuy}
            onWithdraw={handleWithdraw}
            compact
          />
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={buy} onOpenChange={setBuy}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogTitle>Konfirmasi transaksi demo</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Ini adalah pembelian simulasi. Paspor akan langsung berpindah ke akun Anda setelah
            konfirmasi. Tidak ada dana nyata yang dipindahkan.
          </DialogDescription>
          <div className="my-2 rounded-xl bg-muted/50 p-3.5 text-center">
            <p className="text-xs text-muted-foreground">Harga pembelian simulasi</p>
            <p className="mt-0.5 text-2xl font-bold">{rupiah(d.price || 0)}</p>
          </div>
          <Button className="h-11 w-full" onClick={confirmBuy} disabled={busy}>
            {busy ? "Memproses..." : "Lanjutkan transaksi"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-xs rounded-2xl text-center">
          <DialogTitle>QR Paspor Digital</DialogTitle>
          <DialogDescription className="text-xs">
            {d.model} · {d.variant}
          </DialogDescription>
          {qr ? (
            <img
              src={qr}
              alt="QR menuju halaman paspor"
              width={240}
              height={240}
              className="mx-auto rounded-lg"
            />
          ) : (
            <p className="py-8 text-xs text-muted-foreground">Membuat QR...</p>
          )}
          <p className="break-all font-mono text-[11px] text-muted-foreground">/p/{id}</p>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!evidence}
        onOpenChange={(open) => {
          if (!open) setEvidence(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogTitle>Bukti riwayat</DialogTitle>
          <DialogDescription className="text-xs">Dokumen pendukung catatan.</DialogDescription>
          {evidence && (
            <img
              src={evidence}
              alt="Bukti catatan perangkat"
              className="mx-auto max-h-[60vh] rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

/** Sub-komponen Trust Score agar tidak duplikat antara Mobile & Desktop */
function TrustScoreCard({ score }: { score: number }) {
  return (
    <section
      id="paspor"
      className="flex scroll-mt-20 items-center gap-4 rounded-2xl border border-border bg-muted/50 p-4"
    >
      <ScoreRing score={score} large />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Skor Kelengkapan Paspor
        </p>
        <h2 className="mt-0.5 flex items-center gap-1.5 text-lg font-bold">
          <ShieldCheck className="size-4 shrink-0 text-trust" />
          <span className="truncate">{scoreLabel(score)}</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Mengukur kelengkapan data riwayat, bukan garansi fisik.
        </p>
      </div>
    </section>
  );
}

/** Sub-komponen Tombol Aksi untuk Mobile Bottom Bar & Desktop Card */
function ActionButtons({
  d,
  id,
  owner,
  requestBuy,
  onWithdraw,
  compact = false,
}: {
  d: Device;
  id: string;
  owner: boolean;
  requestBuy: () => void;
  onWithdraw: () => void;
  compact?: boolean;
}) {
  if (d.status === "terjual") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-trust-soft p-3 text-xs font-medium text-trust">
        <CheckCircle2 className="size-4 shrink-0" />
        {owner ? "Paspor ini sekarang milik Anda" : "Perangkat sudah terjual"}
      </div>
    );
  }

  if (owner) {
    if (d.status === "aktif" && d.listingId) {
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <Button asChild variant="outline" className="h-11">
            <Link to="/devices/$id" params={{ id }}>
              <Plus className="size-4" />
              Catatan
            </Link>
          </Button>
          <Button variant="destructive" className="h-11" onClick={onWithdraw}>
            Tarik Listing
          </Button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-2.5">
        <Button asChild variant="outline" className="h-11">
          <Link to="/devices/$id" params={{ id }}>
            <Plus className="size-4" />
            Catatan
          </Link>
        </Button>
        <Button asChild className="h-11">
          <Link to="/devices/$id/listing" params={{ id }}>
            Listing
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Button
        className="h-11 w-full"
        onClick={requestBuy}
        // Seller eligibility is checked when publishing. Buyers only need an
        // active listing; public feed rows intentionally do not expose the
        // owner's private identity-check fields.
        disabled={d.status !== "aktif"}
      >
        <span>Beli sekarang</span>
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
