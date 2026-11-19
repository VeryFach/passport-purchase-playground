import { useDemo } from "./demo-provider";
import type { Device } from "@/lib/passport";
export function OwnerTools({ device }: { device: Device }) {
  const { updateDevice } = useDemo();
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
    </section>
  );
}
