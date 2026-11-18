import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Camera, FileText, Plus, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDemo } from "./demo-provider";
import { Checklist, EmptyState, LevelChip, PageHeading } from "./passport-ui";
import {
  dateLabel,
  fileError,
  historySchema,
  passportSchema,
  recordNames,
  trustScore,
  type Device,
  type HistoryRecord,
  type PassportInput,
} from "@/lib/passport";
import { OwnerTools } from "./owner-tools";
import { duplicatePassport, correctRecord } from "@/lib/workflows";
import { galaxy, iphone, macbook } from "@/lib/demo-data";
import type { z } from "zod";
function Upload({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}) {
  const [error, setError] = useState("");
  return (
    <div>
      <label className="field">
        {label}
        {required ? " *" : ""}
        <div className="relative flex min-h-32 items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed border-border bg-muted/50 p-4">
          {value ? (
            <img src={value} alt={label} className="h-28 w-36 rounded object-cover" />
          ) : (
            <Camera className="size-7 text-muted-foreground" />
          )}
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-brand">{value ? "Ganti foto" : "Pilih foto"}</span>
            <p className="mt-1">JPG / PNG · maksimal 5 MB</p>
          </div>
          <input
            aria-label={label}
            type="file"
            accept="image/jpeg,image/png"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const err = fileError(f);
              if (err) {
                setError(err);
                return;
              }
              setError("");
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") onChange(reader.result);
              };
              reader.readAsDataURL(f);
            }}
          />
        </div>
      </label>
      {error && (
        <p role="alert" className="field-error mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
export function RecordDialog({
  device,
  open,
  onOpenChange,
}: {
  device: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateDevice } = useDemo();
  const [evidence, setEvidence] = useState("");
  const form = useForm<z.infer<typeof historySchema>>({
    resolver: zodResolver(historySchema),
    mode: "onBlur",
    defaultValues: { type: "baterai", date: "2026-11-18", description: "", original: true },
  });
  const type = form.watch("type");
  const submit = form.handleSubmit((values) => {
    const before = trustScore(device);
    const r: HistoryRecord = {
      ...values,
      id: crypto.randomUUID(),
      evidence: evidence || null,
      level: evidence ? 2 : 1,
    };
    const updated = { ...device, records: [...device.records, r] };
    updateDevice(device.id, () => updated);
    toast.success(`Catatan disimpan · Skor ${before} → ${trustScore(updated)}`);
    form.reset();
    setEvidence("");
    onOpenChange(false);
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle>Tambah catatan riwayat</DialogTitle>
        <DialogDescription>
          {device.model} · Riwayat yang jelas menambah kepercayaan.
        </DialogDescription>
        <form onSubmit={submit} className="space-y-4">
          <label className="field">
            Jenis catatan
            <select {...form.register("type")}>
              {Object.entries(recordNames).map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Tanggal
            <input type="date" max="2026-11-18" {...form.register("date")} />
            {form.formState.errors.date && (
              <span className="field-error">{form.formState.errors.date.message}</span>
            )}
          </label>
          {form.watch("date") < `${device.year}-01-01` && (
            <p className="text-xs text-document">
              Tanggal catatan lebih awal dari tahun pembelian.
            </p>
          )}
          <label className="field">
            Deskripsi
            <textarea
              rows={3}
              placeholder="Apa yang terjadi pada perangkat ini?"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <span className="field-error">{form.formState.errors.description.message}</span>
            )}
          </label>
          <Upload label="Foto bukti" value={evidence} onChange={setEvidence} />
          {type === "ganti_part" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("original")} />
              Part original
            </label>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Level catatan</span>
            <LevelChip level={evidence ? 2 : 1} />
          </div>
          <Button type="submit" className="h-11 w-full">
            <Save />
            Simpan catatan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function PassportForm({ id }: { id?: string }) {
  const { devices, user, addDevice, updateDevice } = useDemo();
  const existing = devices.find((d) => d.id === id);
  const navigate = useNavigate();
  const [image, setImage] = useState(existing?.image || ""),
    [imageError, setImageError] = useState(""),
    [recordOpen, setRecordOpen] = useState(false),
    [step, setStep] = useState(1),
    [correction, setCorrection] = useState<HistoryRecord | null>(null),
    [correctionText, setCorrectionText] = useState(""),
    [correctionReason, setCorrectionReason] = useState("");
  const form = useForm<PassportInput>({
    resolver: zodResolver(passportSchema),
    mode: "onBlur",
    defaultValues: existing
      ? { ...existing }
      : {
          kind: "hp",
          brand: "Apple",
          model: "iPhone 13",
          variant: "128 GB",
          serial: "",
          year: 2023,
          purchasePrice: 12999000,
          battery: 91,
          condition: "mulus",
          unlocked: false,
        },
  });
  const values = form.watch();
  if (!user)
    return (
      <main className="page-container py-12">
        <EmptyState title="Masuk untuk membuat dan mengelola paspor perangkat.">
          <Button asChild>
            <Link to="/login" search={{ next: id ? `/devices/${id}` : "/devices/new" }}>
              Masuk ke akun
            </Link>
          </Button>
        </EmptyState>
      </main>
    );
  if (id && (!existing || existing.owner !== user.id))
    return (
      <main className="page-container py-12">
        <EmptyState title="Perangkat ini bukan milik Anda.">
          <Button asChild>
            <Link to="/devices">Perangkat Saya</Link>
          </Button>
        </EmptyState>
      </main>
    );
  const preview: Device = {
    ...existing,
    id: id || "new",
    ...values,
    image,
    owner: user.id,
    location: existing?.location || "Jakarta Selatan",
    records: existing?.records || [],
    price: existing?.price || null,
    basePrice: existing?.basePrice || null,
    status: existing?.status || "draf",
  };
  const save = form.handleSubmit(
    (v) => {
      if (duplicatePassport(devices, v.serial, existing?.id)) {
        form.setError("serial", {
          message: "Perangkat dengan serial / IMEI ini sudah memiliki paspor.",
        });
        setStep(1);
        return;
      }
      if (!image) {
        setImageError("Tambahkan foto perangkat");
        return;
      }
      const device: Device = {
        ...preview,
        ...v,
        id: existing?.id || crypto.randomUUID(),
        basePrice:
          v.model === "iPhone 13"
            ? 6000000
            : v.model === "Galaxy S23"
              ? 6200000
              : v.model === "MacBook Air M1"
                ? 8500000
                : null,
      };
      if (existing) updateDevice(existing.id, () => device);
      else addDevice(device);
      toast.success("Paspor berhasil disimpan");
      navigate({ to: "/devices/$id", params: { id: device.id } });
    },
    () => {
      if (!existing) setStep(1);
    },
  );
  const field = (
    name: "brand" | "model" | "variant" | "serial" | "year" | "purchasePrice" | "battery",
    label: string,
    type = "text",
  ) => (
    <label className="field">
      {label}
      <input type={type} {...form.register(name)} />
      {form.formState.errors[name] && (
        <span className="field-error">{form.formState.errors[name]?.message}</span>
      )}
    </label>
  );
  return (
    <main className="page-container reading-screen py-8">
      <PageHeading
        title={existing ? "Kelola paspor" : "Buat paspor perangkat"}
        subtitle="Setiap cerita perangkat dimulai dari identitas yang jelas."
      >
        {existing && (
          <Button asChild variant="outline">
            <Link to="/p/$id" params={{ id: existing.id }}>
              Lihat paspor
              <ArrowRight />
            </Link>
          </Button>
        )}
      </PageHeading>
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <form onSubmit={save} className="space-y-8" noValidate>
          {!existing && (
            <div
              className="grid grid-cols-2 gap-3 border-b border-border pb-5"
              role="group"
              aria-label="Langkah pembuatan paspor"
            >
              {[
                { n: 1, label: "Identitas" },
                { n: 2, label: "Kondisi & foto" },
              ].map((s) => (
                <Button
                  key={s.n}
                  type="button"
                  variant={step === s.n ? "default" : "outline"}
                  aria-current={step === s.n ? "step" : undefined}
                  className="h-12"
                  onClick={async () => {
                    if (
                      s.n === 1 ||
                      (await form.trigger(["brand", "model", "serial", "year", "purchasePrice"]))
                    )
                      setStep(s.n);
                  }}
                >
                  {s.n}. {s.label}
                </Button>
              ))}
            </div>
          )}
          <section className={!existing && step !== 1 ? "hidden" : ""}>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
              <span className="grid size-6 place-items-center rounded-full bg-brand-soft text-xs text-brand">
                1
              </span>
              Identitas perangkat
            </h2>
            <div className="space-y-5">
              <label className="field">
                Jenis perangkat
                <select {...form.register("kind")}>
                  <option value="hp">HP</option>
                  <option value="laptop">Laptop</option>
                </select>
              </label>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {field("brand", "Merek")}
                {field("model", "Model")}
              </div>
              {field("variant", "Varian / Kapasitas")}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field("serial", values.kind === "hp" ? "IMEI (15 digit)" : "Serial perangkat")}
                {field("year", "Tahun beli", "number")}
              </div>
              {field("purchasePrice", "Harga beli (Rp)", "number")}
            </div>
          </section>
          <section className={!existing && step !== 2 ? "hidden" : "border-t border-border pt-7"}>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
              <span className="grid size-6 place-items-center rounded-full bg-brand-soft text-xs text-brand">
                2
              </span>
              Kondisi perangkat
            </h2>
            <div className="mb-7 space-y-5">
              {" "}
              <Upload
                label="Foto perangkat"
                required
                value={image}
                onChange={(url) => {
                  setImage(url);
                  setImageError("");
                }}
              />
              {imageError && <p className="field-error">{imageError}</p>}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Atau foto contoh:</span>
                {[
                  { label: "iPhone", url: iphone },
                  { label: "Samsung", url: galaxy },
                  { label: "MacBook", url: macbook },
                ].map((item) => (
                  <Button
                    type="button"
                    key={item.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImage(item.url);
                      setImageError("");
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {field("battery", "Baterai (%)", "number")}
              <label className="field">
                Kondisi fisik
                <select {...form.register("condition")}>
                  <option value="mulus">Mulus</option>
                  <option value="lecet">Lecet ringan</option>
                  <option value="rusak">Retak / penyok</option>
                </select>
              </label>
            </div>
            <label className="mt-5 flex items-start gap-3 text-xs leading-5">
              <input type="checkbox" {...form.register("unlocked")} className="mt-1 size-4" />
              Saya menyatakan bebas iCloud / FRP / MDM (klaim penjual)
            </label>
          </section>
          <section className={!existing ? "hidden" : "border-t border-border pt-7"}>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <span className="grid size-6 place-items-center rounded-full bg-brand-soft text-xs text-brand">
                  3
                </span>
                Riwayat perangkat
              </h2>
              {existing && (
                <Button type="button" variant="outline" onClick={() => setRecordOpen(true)}>
                  <Plus />
                  Tambah catatan
                </Button>
              )}
            </div>
            {existing?.records.length ? (
              <div className="space-y-4">
                {existing.records.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 border-b border-border pb-4">
                    <FileText className="mt-1 size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium">{recordNames[r.type]}</h3>
                        <LevelChip level={r.level} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {dateLabel(r.date)} · {r.description}
                      </p>
                      {r.level >= 3 && (
                        <Button
                          variant="link"
                          type="button"
                          className="mt-2 h-11 px-0"
                          onClick={() => {
                            setCorrection(r);
                            setCorrectionText(r.description);
                          }}
                        >
                          Koreksi dengan jejak riwayat
                        </Button>
                      )}
                      {r.correctionOf && (
                        <p className="mt-2 text-xs text-document">Koreksi: {r.correctionReason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-muted p-5 text-xs text-muted-foreground">
                {existing
                  ? "Belum ada riwayat. Tambahkan catatan pertama perangkat Anda."
                  : "Simpan identitas terlebih dahulu untuk menambahkan catatan."}
              </p>
            )}
          </section>
          {existing && <OwnerTools device={existing} />}
          <div className="form-sticky-actions mobile-sticky-action sticky grid grid-cols-1 gap-3 border-t border-border bg-background py-4 sm:grid-cols-2 lg:bottom-0">
            {!existing && step === 1 ? (
              <Button
                type="button"
                className="h-12"
                onClick={async () => {
                  const valid = await form.trigger([
                    "brand",
                    "model",
                    "serial",
                    "year",
                    "purchasePrice",
                  ]);
                  if (valid) setStep(2);
                }}
              >
                Lanjut: kondisi & foto
                <ArrowRight />
              </Button>
            ) : (
              <Button type="submit" className="h-12 flex-1">
                <Save />
                Simpan paspor
              </Button>
            )}
            {existing && (
              <Button type="button" asChild variant="outline" className="h-12">
                <Link to="/devices/$id/listing" params={{ id: existing.id }}>
                  Buat listing
                  <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        </form>
        <aside className="sticky top-6 hidden lg:block">
          <Checklist device={preview} />
          <div className="mt-4 flex gap-3 p-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="size-5 shrink-0 text-trust" />
            Lengkapi bukti dan verifikasi mitra untuk membangun kepercayaan.
          </div>
        </aside>
      </div>
      <Dialog
        open={!!correction}
        onOpenChange={(o) => {
          if (!o) setCorrection(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Koreksi catatan</DialogTitle>
          <DialogDescription>
            Catatan asli tetap tersimpan. Koreksi baru perlu diverifikasi ulang.
          </DialogDescription>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!existing || !correction) return;
              const next = correctRecord(correction, correctionText, correctionReason);
              updateDevice(existing.id, (d) => ({ ...d, records: [...d.records, next] }));
              setCorrection(null);
              setCorrectionReason("");
              toast.success("Koreksi ditambahkan, catatan asli tetap utuh");
            }}
          >
            <label className="field">
              Deskripsi yang benar
              <textarea
                minLength={5}
                maxLength={300}
                required
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
              />
            </label>
            <label className="field">
              Alasan koreksi
              <textarea
                minLength={5}
                required
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
              />
            </label>
            <Button type="submit" className="h-12 w-full">
              Simpan koreksi
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {existing && (
        <RecordDialog device={existing} open={recordOpen} onOpenChange={setRecordOpen} />
      )}
    </main>
  );
}
