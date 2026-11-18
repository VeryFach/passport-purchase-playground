import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo-provider";
import { EmptyState, PageHeading } from "@/components/passport-ui";
import { anomalies } from "@/lib/workflows";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/admin")({
  head: () =>
    pageHead(
      "Peninjauan Admin",
      "Tinjau sengketa, anomali paspor, mitra, dan jejak aktivitas demo.",
    ),
  component: Admin,
});
function Admin() {
  const { user, devices, orders, orderAction, audit } = useDemo();
  const [tab, setTab] = useState("disputes"),
    [reviewed, setReviewed] = useState<string[]>([]),
    [partnerActive, setPartnerActive] = useState(true);
  if (user?.role !== "admin")
    return (
      <main className="page-container py-9">
        <EmptyState title="Masuk sebagai Admin Demo untuk meninjau laporan.">
          <Button asChild>
            <Link to="/login" search={{ next: "/admin" }}>
              Masuk
            </Link>
          </Button>
        </EmptyState>
      </main>
    );
  const disputed = orders.filter((o) => o.status === "sengketa");
  const flagged = devices.filter((d) => anomalies(d).length && !reviewed.includes(d.id));
  return (
    <main className="page-container reading-screen py-9">
      <PageHeading
        title="Peninjauan Admin"
        subtitle="Sengketa, kewajaran riwayat, dan aktivitas demo."
      />
      <p className="mb-7 text-sm text-muted-foreground">
        Portal simulasi, bukan kewenangan atau perlindungan transaksi sungguhan.
      </p>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { id: "disputes", label: `Sengketa (${disputed.length})` },
          { id: "anomalies", label: `Anomali (${flagged.length})` },
          { id: "partners", label: "Mitra" },
          { id: "audit", label: "Jejak aktivitas" },
        ].map((t) => (
          <Button
            className="h-12"
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      {tab === "disputes" &&
        (disputed.length ? (
          <div className="space-y-8">
            {disputed.map((o) => (
              <section key={o.id} className="rounded-lg border border-border bg-card p-5 md:p-6">
                <h2 className="text-lg font-semibold">
                  {devices.find((d) => d.id === o.deviceId)?.model}
                </h2>
                <p className="my-4 text-sm">{o.reason}</p>
                {o.evidence && (
                  <img src={o.evidence} alt="Bukti sengketa" className="mb-5 max-h-60 rounded-lg" />
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-12"
                    onClick={() => orderAction(o.id, "refund")}
                  >
                    Setujui pengembalian dana demo
                  </Button>
                  <Button className="h-12" onClick={() => orderAction(o.id, "release")}>
                    Lepas dana demo ke penjual
                  </Button>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState title="Tidak ada sengketa menunggu." />
        ))}
      {tab === "anomalies" &&
        (flagged.length ? (
          <div className="space-y-7">
            {flagged.map((d) => (
              <section key={d.id} className="rounded-lg border border-border bg-card p-5 md:p-6">
                <h2 className="text-lg font-semibold">{d.model}</h2>
                {anomalies(d).map((w) => (
                  <p key={w} className="mt-3 text-sm text-document">
                    {w}
                  </p>
                ))}
                <p className="mt-3 text-sm text-muted-foreground">
                  Peringatan kewajaran, bukan bukti penipuan.
                </p>
                <div className="mt-5 flex gap-3">
                  <Button asChild variant="outline">
                    <Link to="/p/$id" params={{ id: d.id }}>
                      Lihat paspor
                    </Link>
                  </Button>
                  <Button onClick={() => setReviewed((ids) => [...ids, d.id])}>
                    Tandai ditinjau
                  </Button>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState title="Tidak ada anomali menunggu." />
        ))}
      {tab === "partners" && (
        <section className="rounded-lg border border-border bg-card p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <ShieldCheck className="text-trust" />
            Mitra Servis Jakarta
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Mitra demo · Pemeriksaan perangkat dan bukti servis
          </p>
          <Button
            className="mt-6 h-12"
            variant="outline"
            onClick={() => setPartnerActive(!partnerActive)}
          >
            {partnerActive ? "Nonaktifkan status mitra demo" : "Aktifkan status mitra demo"}
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            Status direktori: {partnerActive ? "Aktif" : "Nonaktif"}. Tidak mengubah akses akun
            demo.
          </p>
        </section>
      )}
      {tab === "audit" &&
        (audit.length ? (
          <div className="space-y-5">
            {audit.map((e) => (
              <div key={e.id} className="rounded-lg border border-border bg-card p-5">
                <p className="font-medium">{e.action}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {e.actor} · {new Date(e.date).toLocaleString("id-ID")}
                </p>
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                  {e.deviceId}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada aktivitas demo." />
        ))}
    </main>
  );
}
