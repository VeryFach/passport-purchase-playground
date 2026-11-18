import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo-provider";
import { EmptyState, PageHeading, PassportCard } from "@/components/passport-ui";
import { estimate, shortPrice, dateLabel } from "@/lib/passport";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/devices/")({
  head: () =>
    pageHead("Perangkat Saya", "Kelola paspor, catatan riwayat, dan listing perangkat Anda."),
  component: Devices,
});
function Devices() {
  const { devices, user } = useDemo();
  const [status, setStatus] = useState("all");
  const owned = devices.filter(
    (d) => d.owner === user?.id && (status === "all" || d.status === status),
  );
  return (
    <main className="page-container reading-screen py-8">
      <PageHeading
        title="Perangkat saya"
        subtitle="Simpan bukti, pantau perawatan, dan siapkan nilai jual sejak sekarang."
      >
        <Button asChild className="h-11">
          <Link to="/devices/new">
            <Plus />
            Tambah perangkat
          </Link>
        </Button>
      </PageHeading>
      {user ? (
        <>
          <section className="mb-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted p-5">
              <p className="text-sm text-muted-foreground">Perangkat milik Anda</p>
              <p className="mt-2 text-2xl font-semibold">
                {devices.filter((d) => d.owner === user.id).length}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-5">
              <p className="text-sm text-muted-foreground">Estimasi nilai perangkat</p>
              <p className="mt-2 text-2xl font-semibold">
                {shortPrice(
                  devices
                    .filter((d) => d.owner === user.id)
                    .reduce((sum, d) => sum + (estimate(d)?.mid || 0), 0),
                )}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-5">
              <p className="text-sm text-muted-foreground">Pengingat mendatang</p>
              <p className="mt-2 text-base font-medium">
                {devices.filter((d) => d.owner === user.id && d.serviceDue).length} jadwal perawatan
              </p>
            </div>
          </section>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { id: "all", label: "Semua" },
              { id: "draf", label: "Draf" },
              { id: "aktif", label: "Ditayangkan" },
              { id: "terjual", label: "Dibeli" },
            ].map((item) => (
              <Button
                variant={status === item.id ? "default" : "outline"}
                key={item.id}
                onClick={() => setStatus(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {owned.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {owned.map((d) => (
                <div key={d.id}>
                  <PassportCard device={d} owned />
                  {d.serviceDue && (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Servis berikutnya · {dateLabel(d.serviceDue)}
                    </p>
                  )}
                  {d.status !== "terjual" && (
                    <Button asChild variant="outline" className="mt-3 h-11 w-full">
                      <Link to="/devices/$id/listing" params={{ id: d.id }}>
                        Jual perangkat
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Belum ada paspor. Buat paspor pertama Anda.">
              <Button asChild>
                <Link to="/devices/new">
                  <Plus />
                  Buat paspor pertama
                </Link>
              </Button>
            </EmptyState>
          )}
        </>
      ) : (
        <EmptyState title="Masuk untuk melihat perangkat dan paspor Anda.">
          <Button asChild>
            <Link to="/login" search={{ next: "/devices" }}>
              Masuk
            </Link>
          </Button>
        </EmptyState>
      )}
    </main>
  );
}
