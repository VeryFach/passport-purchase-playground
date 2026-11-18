import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDemo } from "./demo-provider";
import { EmptyState, LevelChip, PageHeading } from "./passport-ui";
import { dateLabel, maskedSerial, recordNames, trustScore } from "@/lib/passport";
import { cn } from "@/lib/utils";
export function PartnerScreen() {
  const { devices, user, updateDevice, inspections } = useDemo();
  const [selected, setSelected] = useState(""),
    [confirm, setConfirm] = useState(false),
    [zoom, setZoom] = useState(false);
  const queue = devices.flatMap((d) =>
    d.records.filter((r) => r.level === 2).map((r) => ({ d, r })),
  );
  const current = queue.find((item) => item.r.id === selected) || queue[0];
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
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
  const verify = () => {
    if (!current || !identityConfirmed || !current.d.unlocked) return;
    const before = trustScore(current.d);
    const updated = {
      ...current.d,
      identityStatus: "checked" as const,
      records: current.d.records.map((r) =>
        r.id === current.r.id ? { ...r, level: 4 as const, verifiedBy: user.name } : r,
      ),
    };
    updateDevice(current.d.id, () => updated);
    toast.success(`Catatan terverifikasi · Skor ${before} → ${trustScore(updated)}`);
    setConfirm(false);
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
              {devices.find((d) => d.id === i.deviceId)?.model} · {dateLabel(i.date)} · {i.location}
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
              {queue.map(({ d, r }) => (
                <Button
                  key={r.id}
                  variant="ghost"
                  onClick={() => {
                    setSelected(r.id);
                    setIdentityConfirmed(false);
                  }}
                  className={cn(
                    "h-auto w-full justify-start whitespace-normal p-4 text-left",
                    current.r.id === r.id ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{recordNames[r.type]}</p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        current.r.id === r.id
                          ? "text-primary-foreground/75"
                          : "text-muted-foreground",
                      )}
                    >
                      {d.model} · {dateLabel(r.date)}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-border p-5 md:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="min-w-0 text-xl font-semibold">{recordNames[current.r.type]}</h2>
              <LevelChip level={2} />
            </div>
            <p className="text-sm text-muted-foreground">
              {current.d.model} · {dateLabel(current.r.date)}
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Serial {maskedSerial(current.d.serial)}
            </p>
            <p className="my-5 text-sm leading-6">{current.r.description}</p>
            {current.r.evidence && (
              <Button
                variant="ghost"
                className="mb-6 h-auto w-full bg-muted p-5"
                aria-label="Perbesar bukti"
                onClick={() => setZoom(true)}
              >
                <img
                  src={current.r.evidence}
                  alt="Bukti untuk diperiksa mitra"
                  className="max-h-[420px] w-full object-contain"
                />
              </Button>
            )}
            <label className="mb-5 flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                checked={identityConfirmed}
                onChange={(e) => setIdentityConfirmed(e.target.checked)}
                className="mt-1 size-5"
              />
              Identitas cocok dan kunci bersih pada pemeriksaan demo.
            </label>
            {!current.d.unlocked && (
              <p className="mb-4 text-sm text-expensive">
                Klaim kunci bersih belum tersedia. Pemilik perlu memperbaruinya.
              </p>
            )}
            <Button
              disabled={!identityConfirmed || !current.d.unlocked}
              className="h-12 w-full"
              onClick={() => setConfirm(true)}
            >
              <ShieldCheck />
              Verifikasi catatan
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
            Terinspeksi (simulasi).
          </DialogDescription>
          <Button onClick={verify}>
            <ShieldCheck />
            Konfirmasi verifikasi
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent>
          <DialogTitle>Bukti riwayat</DialogTitle>
          <DialogDescription>Foto dokumen contoh.</DialogDescription>
          {current?.r.evidence && (
            <img
              src={current.r.evidence}
              alt="Bukti riwayat diperbesar"
              className="max-h-[70vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
