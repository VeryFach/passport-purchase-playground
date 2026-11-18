import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-provider";
import { EmptyState, PageHeading, ScoreRing } from "./passport-ui";
import { estimate, rupiah, shortPrice, trustScore } from "@/lib/passport";
export function ComparisonScreen() {
  const { devices, comparison, toggleCompare } = useDemo();
  const selected = devices.filter((d) => comparison.includes(d.id));
  return (
    <main className="page-container reading-screen py-9">
      <PageHeading
        title="Bandingkan perangkat"
        subtitle="Lihat perbedaan harga, kondisi, dan bukti. Maksimal 3 perangkat."
      />
      {selected.length ? (
        <div className="grid gap-7 md:grid-cols-3">
          {selected.map((d) => {
            const e = estimate(d);
            return (
              <article
                key={d.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="relative aspect-[1.5] bg-photo">
                  <img src={d.image} alt={d.model} className="photo-image" />
                  <Button
                    className="absolute right-3 top-3 bg-card"
                    variant="outline"
                    size="icon"
                    aria-label={`Hapus ${d.model} dari perbandingan`}
                    onClick={() => toggleCompare(d.id)}
                  >
                    <X />
                  </Button>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold">{d.model}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{d.variant}</p>
                  <p className="my-5 text-2xl font-bold">{rupiah(d.price || 0)}</p>
                  <div className="flex items-center gap-4 border-y border-border py-5">
                    <ScoreRing score={trustScore(d)} />
                    <p className="text-sm">
                      Skor kelengkapan data
                      <br />
                      <span className="text-muted-foreground">Bukan jaminan kondisi</span>
                    </p>
                  </div>
                  <dl className="space-y-5 py-6">
                    {[
                      ["Baterai", `${d.battery}% · Input perangkat`],
                      [
                        "Kondisi",
                        d.condition === "mulus"
                          ? "Mulus"
                          : d.condition === "lecet"
                            ? "Lecet ringan"
                            : "Retak / penyok",
                      ],
                      [
                        "Part non-original",
                        String(
                          d.records.filter((r) => r.type === "ganti_part" && !r.original).length,
                        ),
                      ],
                      [
                        "Bukti riwayat",
                        `${d.records.filter((r) => r.level >= 2).length} catatan berdokumen`,
                      ],
                      [
                        "Inspeksi",
                        d.records.some((r) => r.level === 4)
                          ? "Ada hasil inspeksi demo"
                          : "Belum terinspeksi",
                      ],
                      [
                        "Harga wajar",
                        e ? `${shortPrice(e.min)} – ${shortPrice(e.max)}` : "Belum tersedia",
                      ],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-sm text-muted-foreground">{label}</dt>
                        <dd className="mt-2 font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <Button asChild className="h-12 w-full">
                    <Link to="/p/$id" params={{ id: d.id }}>
                      Lihat paspor
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Belum ada perangkat untuk dibandingkan.">
          <Button asChild>
            <Link to="/">Pilih perangkat</Link>
          </Button>
        </EmptyState>
      )}
    </main>
  );
}
