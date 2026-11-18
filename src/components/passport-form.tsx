import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  FileText,
  Laptop,
  Plus,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDemo } from "./demo-provider";
import { Checklist, EmptyState, LevelChip, PageHeading, ScoreRing } from "./passport-ui";
import {
  dateLabel,
  fileError,
  historySchema,
  passportSchema,
  recordNames,
  todayDateString,
  trustScore,
  type Device,
  type HistoryRecord,
  type PassportInput,
} from "@/lib/passport";
import { OwnerTools } from "./owner-tools";
import { duplicatePassport, correctRecord } from "@/lib/workflows";
import { galaxy, iphone, macbook } from "@/lib/demo-data";
import type { z } from "zod";

/** Format angka dengan titik pemisah ribuan (contoh: 12999000 -> "12.999.000") */
function formatDots(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Reusable Collapsible Card (Anti-Layout Shift) */
function FormSection({
  stepNumber,
  title,
  summary,
  badge,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  stepNumber?: number;
  title: string;
  summary?: string;
  badge?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  if (!collapsible) {
    return (
      <section className="w-full min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-2.5">
          {stepNumber && (
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
              {stepNumber}
            </span>
          )}
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
        </div>
        <div className="min-w-0">{children}</div>
      </section>
    );
  }

  return (
    <details
      open={defaultOpen}
      className="group w-full min-w-0 rounded-2xl border border-border bg-card px-4 py-3.5 sm:px-6 sm:py-4"
    >
      <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-3 py-1 select-none [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {stepNumber && (
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
              {stepNumber}
            </span>
          )}
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
        </div>
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted/60 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
          <ChevronDown className="size-4" />
        </div>
      </summary>
      <div className="mt-3 min-w-0 border-t border-border/60 pt-4">{children}</div>
    </details>
  );
}

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
      <span className="mb-1.5 block text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <label className="relative flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center transition-colors hover:bg-muted/70 sm:flex-row sm:text-left">
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-24 w-32 shrink-0 rounded-lg object-cover shadow-xs"
          />
        ) : (
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-background shadow-xs">
            <Camera className="size-5 text-muted-foreground" />
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-brand">
            {value ? "Ketuk untuk ganti foto" : "Pilih atau ambil foto"}
          </span>
          <p className="mt-0.5 text-[11px]">JPG / PNG · Maks. 5 MB</p>
        </div>
        <input
          aria-label={label}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
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
      </label>
      {error && (
        <p role="alert" className="field-error mt-1.5 text-xs">
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
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl">
        <DialogTitle>Tambah catatan riwayat</DialogTitle>
        <DialogDescription className="text-xs">
          {device.model} · Bukti foto menaikkan level catatan ke L2.
        </DialogDescription>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <input type="date" max={todayDateString()} {...form.register("date")} />
              {form.formState.errors.date && (
                <span className="field-error">{form.formState.errors.date.message}</span>
              )}
            </label>
          </div>

          {form.watch("date") < `${device.year}-01-01` && (
            <p className="rounded-lg bg-document-soft px-3 py-2 text-xs text-document">
              Tanggal catatan lebih awal dari tahun beli ({device.year}).
            </p>
          )}

          <label className="field">
            Deskripsi singkat
            <textarea
              rows={3}
              placeholder="Contoh: Ganti baterai baru di service center resmi..."
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <span className="field-error">{form.formState.errors.description.message}</span>
            )}
          </label>

          <Upload label="Foto bukti (opsional)" value={evidence} onChange={setEvidence} />

          {type === "ganti_part" && (
            <label className="flex items-center gap-2.5 rounded-xl border border-border p-3 text-xs font-medium">
              <input type="checkbox" className="size-4" {...form.register("original")} />
              Menggunakan part original
            </label>
          )}

          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
            <span className="text-xs text-muted-foreground">Level verifikasi</span>
            <LevelChip level={evidence ? 2 : 1} />
          </div>

          <Button type="submit" className="h-11 w-full">
            <Save className="size-4" />
            Simpan catatan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PassportForm({ id }: { id?: string }) {
  const { devices, user, saveDevice, requestVerification } = useDemo();
  const existing = devices.find((d) => d.id === id);
  const navigate = useNavigate();

  const [image, setImage] = useState(existing?.image || "");
  const [imageError, setImageError] = useState("");
  const [recordOpen, setRecordOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [correction, setCorrection] = useState<HistoryRecord | null>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");

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

  if (!user) {
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
  }

  if (id && (!existing || existing.owner !== user.id)) {
    return (
      <main className="page-container py-12">
        <EmptyState title="Perangkat ini bukan milik Anda.">
          <Button asChild>
            <Link to="/devices">Perangkat Saya</Link>
          </Button>
        </EmptyState>
      </main>
    );
  }

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

  const previewScore = trustScore(preview);

  const handleNextStep = async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const valid = await form.trigger([
      "brand",
      "model",
      "variant",
      "serial",
      "year",
      "purchasePrice",
    ]);

    if (valid) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Periksa kembali data identitas yang masih kosong/salah");
    }
  };

  const save = form.handleSubmit(
    async (v) => {
      if (duplicatePassport(devices, v.serial, existing?.id)) {
        form.setError("serial", {
          message: "Serial / IMEI ini sudah terdaftar di paspor lain.",
        });
        setStep(1);
        return;
      }
      if (!image) {
        setImageError("Tambahkan foto perangkat terlebih dahulu");
        return;
      }
      const device: Device = {
        ...preview,
        ...v,
        id: existing?.id || crypto.randomUUID(),
        basePrice: existing?.basePrice ?? null,
      };
      const saved = await saveDevice(device, existing?.id);
      if (!saved) {
        toast.error("Paspor gagal disimpan. Periksa koneksi dan coba lagi.");
        return;
      }
      toast.success("Paspor berhasil disimpan");
      navigate({ to: "/devices/$id", params: { id: saved.id } });
    },
    () => {
      if (!existing) setStep(1);
    },
  );

  const field = (
    name: "brand" | "model" | "variant" | "serial" | "year" | "battery",
    label: string,
    type = "text",
    placeholder?: string,
  ) => (
    <label className="field">
      {label}
      <input type={type} placeholder={placeholder} {...form.register(name)} />
      {form.formState.errors[name] && (
        <span className="field-error">{form.formState.errors[name]?.message}</span>
      )}
    </label>
  );

  const conditionLabels: Record<string, string> = {
    mulus: "Mulus",
    lecet: "Lecet ringan",
    rusak: "Retak / penyok",
  };

  return (
    <main className="page-container reading-screen pb-24 pt-5 md:py-8"> 
      <PageHeading
        title={existing ? "Kelola paspor" : "Buat paspor perangkat"}
        subtitle={
          existing
            ? `${existing.model} · PD-${existing.id.toUpperCase()}`
            : "Lengkapi identitas untuk mulai membangun riwayat."
        }
      >
        {existing && (
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link to="/p/$id" params={() => ({ id: existing.id })}>
              Pratinjau
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </PageHeading>

      {/* Mobile Compact Score Preview Banner */}
      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <ScoreRing score={previewScore} />
          <div>
            <p className="text-xs font-semibold">Skor Kelengkapan: {previewScore}/100</p>
            <p className="text-[11px] text-muted-foreground">
              {image ? "Foto lengkap" : "Butuh foto"} · {preview.records.length} catatan
            </p>
          </div>
        </div>
        <ShieldCheck className="size-5 shrink-0 text-trust" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <form onSubmit={save} className="min-w-0 space-y-4 sm:space-y-6" noValidate>
          {/* Step Indicator (Hanya saat buat baru) */}
          {!existing && (
            <div
              className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1"
              role="group"
              aria-label="Langkah pembuatan paspor"
            >
              {[
                { n: 1, label: "1. Identitas" },
                { n: 2, label: "2. Kondisi & Foto" },
              ].map((s) => (
                <button
                  key={s.n}
                  type="button"
                  aria-current={step === s.n ? "step" : undefined}
                  className={`flex h-10 touch-manipulation items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${
                    step === s.n
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    if (s.n === 1) setStep(1);
                    else handleNextStep();
                  }}
                >
                  {step > s.n && <Check className="size-3.5 text-trust" />}
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* STEP 1: IDENTITAS PERANGKAT */}
          <div className={!existing && step !== 1 ? "hidden" : "block"}>
            <FormSection
              stepNumber={1}
              title="Identitas perangkat"
              summary={`${values.brand} ${values.model} · ${values.variant} (${values.year})`}
              collapsible={!!existing}
              defaultOpen={!existing}
            >
              <div className="space-y-4">
                {/* Visual Segmented Picker untuk Jenis Perangkat */}
                <div>
                  <span className="mb-1.5 block text-xs font-medium">Jenis perangkat</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { value: "hp", label: "Handphone", icon: Smartphone },
                      { value: "laptop", label: "Laptop", icon: Laptop },
                    ].map(({ value, label, icon: Icon }) => {
                      const active = values.kind === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => form.setValue("kind", value as "hp" | "laptop")}
                          className={`flex h-11 touch-manipulation items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors ${
                            active
                              ? "border-brand bg-brand-soft/60 text-brand"
                              : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="size-4" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {field("brand", "Merek", "text", "Apple")}
                  {field("model", "Model", "text", "iPhone 13")}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {field("variant", "Varian / Kapasitas", "text", "128 GB")}
                  {field(
                    "serial",
                    values.kind === "hp" ? "IMEI (15 digit)" : "Nomor Serial",
                    "text",
                    "356789...",
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[130px_1fr] sm:gap-4">
                  {field("year", "Tahun beli", "number")}

                  {/* Input Harga Beli dengan Pemisah Titik Ribuan */}
                  <Controller
                    control={form.control}
                    name="purchasePrice"
                    render={({ field: priceField }) => (
                      <label className="field">
                        Harga beli (Rp)
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="12.999.000"
                          value={formatDots(priceField.value)}
                          onBlur={priceField.onBlur}
                          onChange={(e) => {
                            const rawDigits = e.target.value.replace(/\D/g, "");
                            priceField.onChange(rawDigits ? Number(rawDigits) : 0);
                          }}
                        />
                        {form.formState.errors.purchasePrice && (
                          <span className="field-error">
                            {form.formState.errors.purchasePrice.message}
                          </span>
                        )}
                      </label>
                    )}
                  />
                </div>
              </div>
            </FormSection>
          </div>

          {/* STEP 2: KONDISI & FOTO */}
          <div className={!existing && step !== 2 ? "hidden" : "block"}>
            <FormSection
              stepNumber={2}
              title="Kondisi & foto"
              summary={`Baterai ${values.battery}% · ${conditionLabels[values.condition] || values.condition}`}
              collapsible={!!existing}
              defaultOpen={!existing}
            >
              <div className="space-y-5">
                <div>
                  <Upload
                    label="Foto perangkat"
                    required
                    value={image}
                    onChange={(url) => {
                      setImage(url);
                      setImageError("");
                    }}
                  />
                  {imageError && <p className="field-error mt-1.5 text-xs">{imageError}</p>}

                  {/* Quick Sample Pills */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Sparkles className="size-3" /> Foto demo:
                    </span>
                    {[
                      { label: "iPhone", url: iphone },
                      { label: "Samsung", url: galaxy },
                      { label: "MacBook", url: macbook },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.label}
                        onClick={() => {
                          setImage(item.url);
                          setImageError("");
                        }}
                        className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium hover:bg-muted"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr]">
                  {field("battery", "Baterai (%)", "number")}

                  <div>
                    <span className="mb-1.5 block text-xs font-medium">Kondisi fisik</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "mulus", label: "Mulus" },
                        { value: "lecet", label: "Lecet" },
                        { value: "rusak", label: "Retak" },
                      ].map((item) => {
                        const active = values.condition === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() =>
                              form.setValue("condition", item.value as "mulus" | "lecet" | "rusak")
                            }
                            className={`h-10 touch-manipulation rounded-xl border text-xs font-medium transition-colors ${
                              active
                                ? "border-brand bg-brand-soft/60 font-semibold text-brand"
                                : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-xs">
                  <input
                    type="checkbox"
                    {...form.register("unlocked")}
                    className="size-4 rounded"
                  />
                  <span>
                    Bebas kunci akun{" "}
                    <span className="text-muted-foreground">(iCloud / FRP / MDM)</span>
                  </span>
                </label>
              </div>
            </FormSection>
          </div>

          {/* STEP 3: RIWAYAT PERANGKAT (Hanya saat mode edit / existing) */}
          {existing && (
            <FormSection
              stepNumber={3}
              title="Riwayat perangkat"
              summary={
                existing.records.length
                  ? `${existing.records.length} catatan tersimpan`
                  : "Belum ada catatan riwayat"
              }
              badge={
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {existing.records.length}
                </span>
              }
              collapsible={true}
              defaultOpen={true}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Catat servis atau ganti komponen untuk naikkan skor.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 shrink-0"
                  onClick={() => setRecordOpen(true)}
                >
                  <Plus className="size-3.5" />
                  Tambah
                </Button>
              </div>

              {existing.records.length ? (
                <div className="space-y-3">
                  {[...existing.records].reverse().map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3"
                    >
                      <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <h3 className="text-xs font-semibold">{recordNames[r.type]}</h3>
                          <LevelChip level={r.level} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {dateLabel(r.date)}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">
                          {r.description}
                        </p>
                        {r.level === 2 && (
                          <button
                            type="button"
                            className="mt-2 block text-xs font-medium text-brand underline-offset-4 hover:underline"
                            onClick={() => {
                              void requestVerification(r.id);
                            }}
                          >
                            Ajukan verifikasi mitra
                          </button>
                        )}
                        {r.level >= 3 && (
                          <button
                            type="button"
                            className="mt-2 text-xs font-medium text-brand underline-offset-4 hover:underline"
                            onClick={() => {
                              setCorrection(r);
                              setCorrectionText(r.description);
                            }}
                          >
                            Ajukan koreksi catatan
                          </button>
                        )}
                        {r.correctionOf && (
                          <p className="mt-1.5 rounded bg-document-soft px-2 py-1 text-[11px] text-document">
                            Koreksi: {r.correctionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                  Belum ada catatan. Ketuk <strong>+ Tambah</strong> di atas untuk memulai.
                </div>
              )}
            </FormSection>
          )}

          {/* OWNER TOOLS (Collapsed by default agar ringkas) */}
          {existing && (
            <FormSection
              title="Pengaturan & alat pemilik"
              summary="Privasi data, transfer, atau hapus paspor"
              collapsible={true}
              defaultOpen={false}
            >
              <OwnerTools device={existing} />
            </FormSection>
          )}

          {/* INLINE ACTIONS (Selalu terlihat di akhir form pada mobile & desktop) */}
          <div className="hidden gap-3 pt-2 lg:flex">
    {!existing && step === 2 && (
      <Button
        key="inline-back"
        type="button"
        variant="outline"
        className="h-12 touch-manipulation"
        onClick={() => setStep(1)}
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Button>
    )}
    {!existing && step === 1 ? (
      <Button
        key="inline-next"
        type="button"
        className="h-12 flex-1 touch-manipulation font-semibold"
        onClick={handleNextStep}
      >
        Lanjut: Kondisi & Foto
        <ArrowRight className="size-4" />
      </Button>
    ) : (
      <Button
        key="inline-save"
        type="submit"
        className="h-12 flex-1 touch-manipulation font-semibold"
      >
        <Save className="size-4" />
        Simpan paspor
      </Button>
    )}
    {existing && (
      <Button
        type="button"
        asChild
        variant="outline"
        className="h-12 touch-manipulation"
      >
        <Link to="/devices/$id/listing" params={() => ({ id: existing.id })}>
          Buat listing
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    )}
  </div>

          {/* MOBILE STICKY BOTTOM ACTION BAR */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] backdrop-blur-md lg:hidden">
            <div className="mx-auto flex max-w-lg items-center gap-2.5">
              {!existing && step === 2 && (
                <Button
                  key="sticky-back"
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-12 shrink-0 touch-manipulation"
                  aria-label="Kembali ke langkah 1"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="size-5" />
                </Button>
              )}

              {!existing && step === 1 ? (
                <Button
                  key="sticky-next"
                  type="button"
                  className="h-12 flex-1 touch-manipulation text-sm font-semibold"
                  onClick={handleNextStep}
                >
                  Lanjut: Kondisi & Foto
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  key="sticky-save"
                  type="submit"
                  className="h-12 flex-1 touch-manipulation text-sm font-semibold"
                >
                  <Save className="size-4" />
                  Simpan paspor
                </Button>
              )}

              {existing && (
                <Button
                  type="button"
                  asChild
                  variant="outline"
                  className="h-12 shrink-0 touch-manipulation"
                >
                  <Link to="/devices/$id/listing" params={() => ({ id: existing.id })}>
                    Listing
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>

          </div>
        </form>

        {/* DESKTOP SIDEBAR CHECKLIST */}
        <aside className="sticky top-6 hidden lg:block">
          <Checklist device={preview} />
          <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-muted/50 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-trust" />
            <span>Lengkapi foto dan bukti catatan untuk meningkatkan skor kepercayaan.</span>
          </div>
        </aside>
      </div>

      {/* DIALOG KOREKSI CATATAN */}
      <Dialog
        open={!!correction}
        onOpenChange={(o) => {
          if (!o) setCorrection(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogTitle>Koreksi catatan</DialogTitle>
          <DialogDescription className="text-xs">
            Catatan asli tetap tersimpan sebagai jejak audit.
          </DialogDescription>
          <form
            className="space-y-4"
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
                rows={3}
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
                rows={2}
                minLength={5}
                required
                placeholder="Jelaskan mengapa catatan perlu dikoreksi..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
              />
            </label>
            <Button type="submit" className="h-11 w-full">
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
