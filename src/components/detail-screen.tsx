import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  LockKeyhole,
  MapPin,
  Plus,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import QRCode from "qrcode";
import { anomalies, canList } from "@/lib/workflows";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDemo } from "./demo-provider";
import { ScoreRing, LevelChip, PriceBadge, PageHeading, EmptyState } from "./passport-ui";
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
export function PriceSuggestion({ device }: { device: Device }) {
  const e = estimate(device);
  return (
    <section className="border-t border-border py-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Estimasi harga</h2>
        <span className="text-[10px] text-muted-foreground">DATA PASAR SAMPEL</span>
      </div>
      <h3 className="text-sm font-medium">Rentang harga wajar</h3>
      {e ? (
        <>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {shortPrice(e.min)} – {shortPrice(e.max)}
          </p>
          <div className="relative my-5 h-2 rounded-full bg-muted">
            <div className="absolute inset-y-0 left-[20%] right-[20%] rounded-full bg-trust-soft" />
            <div className="absolute left-1/2 top-[-4px] h-4 w-1 rounded bg-trust" />
          </div>
          <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <Check className="size-4 shrink-0 text-trust" />
              Baterai {device.battery}%{" "}
              {device.battery >= 90 ? "termasuk sehat" : "diperhitungkan dalam estimasi"}.
            </li>
            <li className="flex gap-2">
              <Check className="size-4 shrink-0 text-trust" />
              Kondisi{" "}
              {device.condition === "mulus"
                ? "mulus"
                : device.condition === "lecet"
                  ? "lecet ringan"
                  : "retak/penyok"}{" "}
              disesuaikan dengan harga pasar.
            </li>
            <li className="flex gap-2">
              <Check className="size-4 shrink-0 text-trust" />
              Paspor menambah sekitar {rupiah(e.added)}.
            </li>
          </ul>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Estimasi indikatif dari rumus dan data contoh, bukan harga pasar real-time. Penjelasan
            AI belum terhubung.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Estimasi belum tersedia untuk model ini.
        </p>
      )}
    </section>
  );
}
export function DetailScreen({ id }: { id: string }) {
  const { devices, user, createOrder, orders } = useDemo();
  const navigate = useNavigate();
  const d = devices.find((x) => x.id === id);
  const [buy, setBuy] = useState(false),
    [qrOpen, setQrOpen] = useState(false),
    [qr, setQr] = useState(""),
    [evidence, setEvidence] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!qrOpen) return;
    QRCode.toDataURL(`${window.location.origin}/p/${id}`, { width: 280, margin: 2 })
      .then(setQr)
      .catch(() => toast.error("QR belum dapat dibuat"));
  }, [qrOpen, id]);
  if (!d)
    return (
      <main className="page-container py-12">
        <EmptyState title="Paspor tidak ditemukan">
          <Button asChild>
            <Link to="/">Kembali ke jelajahi</Link>
          </Button>
        </EmptyState>
      </main>
    );
  const owner = user?.id === d.owner,
    score = trustScore(d),
    e = estimate(d);
  const requestBuy = () => {
    if (!user) {
      navigate({ to: "/login", search: { next: `/p/${id}` } });
      return;
    }
    setBuy(true);
  };
  const confirmBuy = () => {
    if (!user || d.status !== "aktif" || owner) return;
    setBusy(true);
    const orderId = createOrder(id);
    if (orderId) navigate({ to: "/orders/$id", params: { id: orderId } });
    setBuy(false);
    setBusy(false);
    if (orderId) toast.success("Pesanan dibuat · Dana demo ditahan");
  };
  return (
    <main className="page-container reading-screen py-8">
      <PageHeading
        title="Detail perangkat"
        subtitle={`Paspor Digital · PD-${d.id.toUpperCase()}`}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,.88fr)] lg:gap-12">
        <div>
          <div className="aspect-[1.35] overflow-hidden rounded-xl bg-photo">
            <img src={d.image} alt={d.model} width={1024} height={768} className="photo-image" />
          </div>
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div>
              <p className="section-label text-muted-foreground">
                {d.brand} · {d.kind === "hp" ? "Handphone" : "Laptop"}
              </p>
              <h1 className="mt-2 text-[28px] font-bold tracking-tight md:text-[36px]">
                {d.model}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{d.variant}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-11 bg-card"
              aria-label="Lihat QR paspor"
              title="Lihat QR paspor"
              onClick={() => setQrOpen(true)}
            >
              <QrCode />
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="text-[30px] font-bold tracking-tight">
              {d.price ? rupiah(d.price) : "Belum ditayangkan"}
            </p>
            {d.price && e && <PriceBadge label={priceLabel(d.price, e)} />}
          </div>
          <div className="mt-5 grid gap-2 sm:hidden">
            <a
              href="#paspor"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold"
            >
              Lihat paspor perangkat <ArrowRight className="size-4" />
            </a>
            {!owner && d.status === "aktif" && (
              <Button
                className="h-12"
                onClick={requestBuy}
                disabled={
                  !canList(d) ||
                  orders.some(
                    (o) => o.deviceId === id && !["selesai", "dikembalikan"].includes(o.status),
                  )
                }
              >
                Beli sekarang <ArrowRight />
              </Button>
            )}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {d.privacy?.showLocation === false ? "Lokasi tidak dibagikan" : d.location}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-border py-4 text-sm">
            <span className="rounded-md bg-muted px-3 py-1.5 font-semibold">
              {d.status === "aktif"
                ? "Listing aktif"
                : d.status === "terjual"
                  ? "Terjual"
                  : "Draf paspor"}
            </span>
            <span className="text-muted-foreground">
              Penjual demo · {d.records.length} catatan riwayat
            </span>
          </div>
          <a
            href="#paspor"
            className="mt-6 hidden h-12 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold hover:bg-muted sm:inline-flex"
          >
            Lihat paspor perangkat <ArrowRight className="size-4" />
          </a>
          <section className="mt-7 border-t border-border pt-6">
            <h2 className="mb-5 font-semibold">Spesifikasi perangkat</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
              {[
                ["Serial / IMEI", maskedSerial(d.serial)],
                ["Tahun pembelian", String(d.year)],
                [
                  "Kondisi fisik",
                  d.condition === "mulus"
                    ? "Mulus"
                    : d.condition === "lecet"
                      ? "Lecet ringan"
                      : "Retak / penyok",
                ],
                ["Kapasitas baterai", `${d.battery}%`],
                ["Kelengkapan", d.accessories || "Belum dicatat"],
                ...(d.privacy?.showPurchasePrice
                  ? [["Harga beli awal", rupiah(d.purchasePrice)]]
                  : []),
              ].map(([name, value]) => (
                <div key={name}>
                  <dt className="text-muted-foreground">{name}</dt>
                  <dd className="mt-1.5 font-medium">{value}</dd>
                  <p className="mt-2 text-xs text-muted-foreground">L1 · Klaim penjual</p>
                </div>
              ))}
              <div>
                <dt className="text-muted-foreground">Kesehatan penyimpanan</dt>
                <dd className="mt-1.5 font-medium">Belum diperiksa</dd>
                <p className="mt-2 text-xs text-muted-foreground">Data belum tersedia</p>
              </div>
            </dl>
            <p className="mt-5 flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <LockKeyhole className="size-4 shrink-0" />
              {d.identityStatus === "blocked"
                ? "Perangkat terblokir (simulasi)"
                : d.identityStatus === "locked"
                  ? "Perangkat terkunci (simulasi)"
                  : d.unlocked
                    ? "Bebas iCloud / FRP / MDM"
                    : "Status kunci belum dikonfirmasi"}{" "}
              · Klaim penjual. Identitas{" "}
              {d.identityStatus === "checked"
                ? "sesuai pada pemeriksaan demo"
                : "belum diperiksa secara resmi"}
              .
            </p>
          </section>
          <section className="mt-7 border-t border-border pt-7">
            <h2 className="text-lg font-semibold">Rantai kepemilikan</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Pemilik sebelumnya disamarkan. Riwayat teknis tetap mengikuti perangkat.
            </p>
            {d.ownership?.length ? (
              d.ownership.map((o, i) => (
                <p key={i} className="mt-4 text-sm">
                  {dateLabel(o.date)} · {o.from} → {o.to}{" "}
                  <span className="text-xs text-muted-foreground">· Sumber belum ditetapkan</span>
                </p>
              ))
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Riwayat kepemilikan sebelumnya tidak tersedia.
              </p>
            )}
          </section>
        </div>
        <div>
          <section
            id="paspor"
            className="mb-6 grid scroll-mt-24 grid-cols-[auto_minmax(0,1fr)] items-center gap-5 rounded-lg border border-border bg-muted p-5 md:p-6"
          >
            <ScoreRing score={score} large />
            <div>
              <p className="section-label text-muted-foreground">
                Paspor Digital · Skor Kepercayaan
              </p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold">
                <ShieldCheck className="size-5 text-trust" />
                {scoreLabel(score)}
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Skor kelengkapan data,
                <br />
                bukan jaminan kondisi fisik.
              </p>
            </div>
          </section>
          {!owner && d.status === "aktif" && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <Button variant="outline" asChild className="h-12">
                <Link to="/chat/$id" params={{ id }}>
                  Tanya penjual
                </Link>
              </Button>
              <Button
                className="h-12"
                onClick={requestBuy}
                disabled={
                  !canList(d) ||
                  orders.some(
                    (o) => o.deviceId === id && !["selesai", "dikembalikan"].includes(o.status),
                  )
                }
              >
                Beli sekarang <ArrowRight />
              </Button>
            </div>
          )}
          <PriceSuggestion device={d} />
          <section className="border-t border-border py-7">
            <h2 className="mb-5 text-lg font-semibold">Yang perlu Anda tahu</h2>
            <div className="space-y-5">
              <div>
                <p className="font-medium">Baterai {d.battery}%</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {d.battery < 80
                    ? "Pertimbangkan biaya penggantian baterai sebelum membeli."
                    : "Periksa kapasitas dan hasil pengujian di riwayat."}{" "}
                  Persentase bukan estimasi sisa umur.
                </p>
              </div>
              <div>
                <p className="font-medium">
                  {d.records.filter((r) => r.type === "ganti_part").length} penggantian part
                  tercatat
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {d.records.some((r) => r.type === "ganti_part" && !r.original)
                    ? "Ada part non-original, lihat bukti dan dampaknya."
                    : "Keaslian part hanya sekuat sumber bukti yang tersedia."}
                </p>
              </div>
              <div>
                <p className="font-medium">
                  {d.records.some((r) => r.level === 4)
                    ? "Ada hasil inspeksi demo"
                    : "Belum terinspeksi"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Inspeksi dan diagnostik di aplikasi ini merupakan simulasi, bukan hasil
                  pemeriksaan otomatis.
                </p>
              </div>
              {anomalies(d).map((w) => (
                <p key={w} className="rounded-lg bg-document-soft p-4 text-sm text-document">
                  {w}
                </p>
              ))}
            </div>
          </section>
          <section id="riwayat" className="scroll-mt-24 border-t border-border py-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Riwayat perangkat</h2>
              <span className="text-xs text-muted-foreground">{d.records.length} catatan</span>
            </div>
            {d.records.length ? (
              <div className="space-y-0">
                {[...d.records].reverse().map((r) => (
                  <div key={r.id} className="flex gap-3 border-l border-border pb-6 pl-4">
                    <div className="-ml-8 mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card">
                      <FileText className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">{recordNames[r.type]}</h3>
                        <LevelChip level={r.level} />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{dateLabel(r.date)}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {r.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.verifiedBy ? `Diterbitkan ${r.verifiedBy}` : "Dicatat pemilik · Demo"}
                      </p>
                      {r.evidence && (
                        <Button
                          variant="ghost"
                          className="mt-2 h-auto gap-2 px-0 text-xs"
                          onClick={() => setEvidence(r.evidence)}
                        >
                          <img
                            src={r.evidence}
                            alt="Foto bukti catatan"
                            width={32}
                            height={40}
                            className="h-10 w-8 rounded object-cover"
                          />
                          Lihat bukti
                          <ArrowRight className="size-3" />
                        </Button>
                      )}
                      {r.verifiedBy && (
                        <p className="mt-2 flex items-center gap-1 text-[10px] text-trust">
                          <ShieldCheck className="size-3" />
                          {r.verifiedBy} · Simulasi
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-muted-foreground">
                Riwayat tidak tersedia. Ini bukan berarti perangkat bermasalah; kondisi saat ini
                perlu diperiksa.
              </p>
            )}
          </section>
          <div className="mobile-sticky-action sticky z-10 border-t border-border bg-background py-4 lg:bottom-0">
            {d.status === "terjual" ? (
              <div className="flex items-center gap-2 rounded-lg bg-trust-soft p-4 text-sm text-trust">
                <CheckCircle2 className="size-5" />
                {owner ? "Paspor kini milik Anda" : "Perangkat telah terjual"}
              </div>
            ) : owner ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild variant="outline" className="h-12 flex-1">
                  <Link to="/devices/$id" params={{ id }}>
                    <Plus />
                    Tambah catatan
                  </Link>
                </Button>
                <Button asChild className="h-12 flex-1">
                  <Link to="/devices/$id/listing" params={{ id }}>
                    Buat listing
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button asChild variant="outline" className="h-12 w-full">
                  <Link to="/chat/$id" params={{ id }}>
                    Tanya penjual / ajukan penawaran
                  </Link>
                </Button>
                <Button
                  className="h-12 w-full"
                  onClick={requestBuy}
                  disabled={
                    d.status !== "aktif" ||
                    !canList(d) ||
                    orders.some(
                      (o) => o.deviceId === id && !["selesai", "dikembalikan"].includes(o.status),
                    )
                  }
                >
                  Beli sekarang
                  <ArrowRight />
                </Button>
              </div>
            )}
            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              Transaksi demo · Tidak ada pembayaran sungguhan
            </p>
          </div>
        </div>
      </div>
      <Dialog open={buy} onOpenChange={setBuy}>
        <DialogContent>
          <DialogTitle>Mulai transaksi demo</DialogTitle>
          <DialogDescription>
            Dana demo ditahan, perangkat diperiksa dalam masa tinjau 48 jam, lalu paspor berpindah
            setelah Anda mengonfirmasi. Tidak ada pembayaran atau pengiriman sungguhan.
          </DialogDescription>
          <p className="py-3 text-2xl font-bold">{rupiah(d.price || 0)}</p>
          <Button onClick={confirmBuy} disabled={busy}>
            {busy ? "Memproses..." : "Konfirmasi beli"}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogTitle>QR Paspor Digital</DialogTitle>
          <DialogDescription>
            {d.model} · {d.variant}
          </DialogDescription>
          {qr ? (
            <img
              src={qr}
              alt="QR menuju halaman paspor"
              width={280}
              height={280}
              className="mx-auto"
            />
          ) : (
            <p>Membuat QR...</p>
          )}
          <p className="break-all font-mono text-xs text-muted-foreground">/p/{id}</p>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!evidence}
        onOpenChange={(open) => {
          if (!open) setEvidence(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Bukti riwayat</DialogTitle>
          <DialogDescription>Dokumen contoh untuk demonstrasi.</DialogDescription>
          {evidence && (
            <img
              src={evidence}
              alt="Bukti catatan perangkat"
              className="mx-auto max-h-[65vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
