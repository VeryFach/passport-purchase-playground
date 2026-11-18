import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDemo } from "./demo-provider";
import { EmptyState, LevelChip, PageHeading } from "./passport-ui";
import { dateLabel, maskedSerial } from "@/lib/passport";
import { cn } from "@/lib/utils";

export function PartnerScreen() {
  const { user, pendingVerifications, reviewVerification, inspections, devices } = useDemo();
  const [selected, setSelected] = useState(""),
    [confirm, setConfirm] = useState(false),
    [rejectOpen, setRejectOpen] = useState(false),
    [note, setNote] = useState(""),
    [zoom, setZoom] = useState(false),
    [identityConfirmed, setIdentityConfirmed] = useState(false);
  const queue = pendingVerifications;
  const current = queue.find((item) => item.recordId === selected) || queue[0];

  if (user?.role !== "partner")
    return (
      <main className="page-container py-12">
        <EmptyState title="Masuk sebagai Mitra untuk memverifikasi catatan.">
          <Button asChild>
            <Link to="/login" search={{ next: "/mitra" }}>
              Masuk sebagai Mitra
            </Link>
          </Button>
        </EmptyState>
      </main>
    );

  const approve = () => {
    if (!current || !identityConfirmed) return;
    void reviewVerification(current.recordId, true);
    setConfirm(false);
    setSelected("");
    setIdentityConfirmed(false);
  };
  const reject = () => {
    if (!current || note.trim().length < 5) return;
    void reviewVerification(current.recordId, false, note.trim());
    setRejectOpen(false);
    setNote("");
    setSelected("");
    setIdentityConfirmed(false);
  };

  return (
    <main className="page-container reading-screen py-8">
      <PageHeading
        title="Dasbor Mitra"
        subtitle="Periksa bukti, verifikasi riwayat, bangun kepercayaan."
      />
      <p className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-muted p-4 text-xs text-muted-foreground">
        <ShieldCheck className="size-4" />
        Verifikasi simulasi oleh akun Mitra Demo, bukan service center resmi.
      </p>
      {inspections.length > 0 && (
        <section className="mb-8 border-y border-border py-5">
          <h2 className="font-semibold">Jadwal inspeksi demo</h2>
          {inspections.map((i) => (
            <p key={i.id} className="mt-3 text-sm">
              {devices.find((d) => d.id === i.deviceId)?.model || i.deviceId} ·{" "}
              {dateLabel(i.date)} · {i.location}
            </p>
          ))}
        </section>
      )}
      {queue.length && current ? (
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-4 font-semibold">
              Menunggu verifikasi <span className="text-muted-foreground">({queue.length})</span>
            </h2>
            <div className="max-h-[620px] space-y-2 overflow-y-auto">
              {queue.map((item) => (
                <Button
                  key={item.recordId}
                  variant="ghost"
                  onClick={() => {
                    setSelected(item.recordId);
                    setIdentityConfirmed(false);
                  }}
                  className={cn(
                    "h-auto w-full justify-start whitespace-normal p-4 text-left",
                    current.recordId === item.recordId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{item.recordTitle}</p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        current.recordId === item.recordId
                          ? "text-primary-foreground/75"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.deviceModel} · {dateLabel(item.date)}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-border p-5 md:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="min-w-0 text-xl font-semibold">{current.recordTitle}</h2>
              <LevelChip level={2} />
            </div>
            <p className="text-sm text-muted-foreground">
              {current.deviceBrand} {current.deviceModel} · {dateLabel(current.date)}
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Serial {current.serial ? maskedSerial(current.serial) : "tidak ditampilkan"}
            </p>
            <p className="my-5 text-sm leading-6">{current.description}</p>
            {current.evidence ? (
              <Button
                variant="ghost"
                className="mb-6 h-auto w-full bg-muted p-5"
                aria-label="Perbesar bukti"
                onClick={() => setZoom(true)}
              >
                <img
                  src={current.evidence}
                  alt="Bukti untuk diperiksa mitra"
                  className="max-h-[420px] w-full object-contain"
                />
              </Button>
            ) : (
              <p className="mb-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                Bukti belum dapat diakses. Pastikan kebijakan penyimpanan migrasi 002 sudah
                dijalankan.
              </p>
            )}
            <label className="mb-5 flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                checked={identityConfirmed}
                onChange={(e) => setIdentityConfirmed(e.target.checked)}
                className="mt-1 size-5"
              />
              Saya telah memeriksa bukti dan identitas perangkat pada pemeriksaan demo.
            </label>
            <Button
              disabled={!identityConfirmed}
              className="h-12 w-full"
              onClick={() => setConfirm(true)}
            >
              <ShieldCheck />
              Verifikasi catatan
            </Button>
            <Button
              variant="outline"
              className="mt-3 h-12 w-full"
              onClick={() => setRejectOpen(true)}
            >
              Tolak dengan catatan
            </Button>
          </section>
        </div>
      ) : (
        <EmptyState title="Tidak ada catatan menunggu verifikasi">
          <CheckCircle2 className="size-10 text-trust" />
        </EmptyState>
      )}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle>Verifikasi catatan ini?</DialogTitle>
          <DialogDescription>
            Anda menyatakan telah memeriksa bukti yang dilampirkan. Catatan akan ditandai
            Terverifikasi (L3, simulasi) dan Trust Score dihitung ulang.
          </DialogDescription>
          <Button onClick={approve}>
            <ShieldCheck />
            Konfirmasi verifikasi
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogTitle>Tolak verifikasi</DialogTitle>
          <DialogDescription>
            Alasan penolakan disimpan pada catatan. Catatan asli tidak diubah.
          </DialogDescription>
          <label className="field">
            Catatan untuk pemilik
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bukti kurang jelas, tanggal tidak sesuai, dan sebagainya."
            />
          </label>
          <Button
            className="h-12 w-full"
            disabled={note.trim().length < 5}
            onClick={reject}
          >
            Tolak verifikasi
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent>
          <DialogTitle>Bukti riwayat</DialogTitle>
          <DialogDescription>Bukti privat diakses melalui tautan bertanda tangan.</DialogDescription>
          {current?.evidence && (
            <img
              src={current.evidence}
              alt="Bukti riwayat diperbesar"
              className="max-h-[70vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
