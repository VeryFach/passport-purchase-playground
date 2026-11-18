import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDemo } from "./demo-provider";
import { dateLabel, type Device } from "@/lib/passport";
export function OwnerTools({ device }: { device: Device }) {
  const { updateDevice, bookInspection, inspections } = useDemo();
  const [open, setOpen] = useState(false),
    [date, setDate] = useState("2026-11-20"),
    [location, setLocation] = useState("Mitra Servis Jakarta");
  const scheduled = inspections.find((i) => i.deviceId === device.id);
  return (
    <section className="mt-8 border-t border-border py-7">
      <h2 className="mb-5 text-lg font-semibold">Rawat sekarang, jual dengan yakin nanti</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          Pengingat servis
          <input
            type="date"
            value={device.serviceDue || ""}
            onChange={(e) => updateDevice(device.id, (d) => ({ ...d, serviceDue: e.target.value }))}
          />
        </label>
        <label className="field">
          Garansi berlaku sampai
          <input
            type="date"
            value={device.warrantyUntil || ""}
            onChange={(e) =>
              updateDevice(device.id, (d) => ({ ...d, warrantyUntil: e.target.value }))
            }
          />
        </label>
      </div>
      <label className="field mt-5">
        Kelengkapan perangkat
        <input
          value={device.accessories || ""}
          placeholder="Kotak, charger, kabel..."
          onChange={(e) => updateDevice(device.id, (d) => ({ ...d, accessories: e.target.value }))}
        />
      </label>
      <div className="mt-7 border-y border-border py-5">
        <h3 className="font-semibold">Pemeriksaan identitas dan kunci</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Tidak terhubung layanan IMEI atau diagnostik resmi. Hasil di bawah hanya skenario demo.
        </p>
        <label className="field mt-4">
          Status pemeriksaan demo
          <select
            value={device.identityStatus || "unknown"}
            onChange={(e) => {
              const value = e.target.value;
              if (
                value === "unknown" ||
                value === "checked" ||
                value === "locked" ||
                value === "blocked"
              )
                updateDevice(device.id, (d) => ({ ...d, identityStatus: value }));
            }}
          >
            <option value="unknown">Belum diperiksa</option>
            <option value="checked">Identitas sesuai (simulasi)</option>
            <option value="locked">Terkunci</option>
            <option value="blocked">Terblokir</option>
          </select>
        </label>
      </div>
      {scheduled ? (
        <p className="mt-5 flex items-start gap-3 rounded-lg bg-trust-soft p-4 text-sm">
          <CalendarDays className="size-5 shrink-0" />
          Inspeksi {dateLabel(scheduled.date)} · {scheduled.location} ·{" "}
          {scheduled.status === "menunggu" ? "Menunggu" : "Selesai"}
        </p>
      ) : (
        <Button variant="outline" className="mt-5 h-12 w-full" onClick={() => setOpen(true)}>
          <ShieldCheck />
          Jadwalkan inspeksi demo
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Jadwalkan inspeksi</DialogTitle>
          <DialogDescription>
            Pemesanan demo, bukan janji temu dengan mitra sungguhan.
          </DialogDescription>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              bookInspection(device.id, location, date);
              setOpen(false);
              toast.success("Inspeksi demo dijadwalkan");
            }}
          >
            <label className="field">
              Lokasi inspeksi
              <select value={location} onChange={(e) => setLocation(e.target.value)}>
                <option>Mitra Servis Jakarta</option>
                <option>Pemeriksaan jarak jauh</option>
              </select>
            </label>
            <label className="field">
              Tanggal
              <input
                type="date"
                min="2026-11-18"
                value={date}
                required
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <Button type="submit" className="h-12 w-full">
              Konfirmasi jadwal
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
