import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-provider";
import { EmptyState, PageHeading, PriceBadge, ScoreRing } from "./passport-ui";
import { estimate, priceLabel, rupiah, trustScore } from "@/lib/passport";
import { canList } from "@/lib/workflows";
import { PriceSuggestion } from "./detail-screen";
export function ListingScreen({ id }: { id: string }) {
  const { devices, user, updateDevice } = useDemo();
  const d = devices.find((x) => x.id === id);
  const [price, setPrice] = useState(d?.price?.toString() || ""),
    [error, setError] = useState("");
  const navigate = useNavigate();
  if (!d || !user || d.owner !== user.id)
    return (
      <main className="page-container py-12">
        <EmptyState title="Masuk sebagai pemilik untuk menayangkan perangkat.">
          <Button asChild>
            <Link to="/login" search={{ next: `/devices/${id}/listing` }}>
              Masuk
            </Link>
          </Button>
        </EmptyState>
      </main>
    );
  const e = estimate(d);
  const publish = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canList(d)) {
      setError(
        "Perangkat terkunci, terblokir, atau tanpa klaim kunci bersih tidak dapat ditayangkan.",
      );
      return;
    }
    if (Number(price) <= 0) {
      setError("Isi harga minta lebih dari 0");
      return;
    }
    updateDevice(id, (current) => ({ ...current, price: Number(price), status: "aktif" }));
    toast.success("Listing berhasil ditayangkan");
    navigate({ to: "/p/$id", params: { id } });
  };
  return (
    <main className="page-container reading-screen max-w-4xl py-8">
      <PageHeading
        title="Tayangkan perangkat"
        subtitle="Harga yang transparan, pembeli yang lebih yakin."
      />
      <div className="mb-8 flex items-center gap-4 border-b border-border pb-6">
        <img src={d.image} alt={d.model} width={80} height={60} className="rounded-lg" />
        <div className="flex-1">
          <h2 className="font-semibold">{d.model}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{d.variant}</p>
        </div>
        <ScoreRing score={trustScore(d)} />
      </div>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <PriceSuggestion device={d} />
          {e && (
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => setPrice(String(Math.round(e.mid)))}
            >
              Pakai harga tengah · {rupiah(e.mid)}
            </Button>
          )}
        </div>
        <form onSubmit={publish} className="space-y-5">
          <h2 className="font-semibold">Harga penawaran Anda</h2>
          {!canList(d) && (
            <p className="rounded-lg bg-expensive-soft p-4 text-sm text-expensive">
              Periksa status identitas dan kunci di Kelola paspor sebelum menjual.
            </p>
          )}
          <section className="space-y-4">
            <h3 className="font-semibold">Privasi paspor publik</h3>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={d.privacy?.showLocation ?? true}
                onChange={(e) =>
                  updateDevice(id, (current) => ({
                    ...current,
                    privacy: {
                      showLocation: e.target.checked,
                      showPurchasePrice: current.privacy?.showPurchasePrice ?? false,
                    },
                  }))
                }
              />
              Tampilkan kota perangkat
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={d.privacy?.showPurchasePrice ?? false}
                onChange={(e) =>
                  updateDevice(id, (current) => ({
                    ...current,
                    privacy: {
                      showLocation: current.privacy?.showLocation ?? true,
                      showPurchasePrice: e.target.checked,
                    },
                  }))
                }
              />
              Tampilkan harga pembelian awal
            </label>
            <p className="text-sm leading-6 text-muted-foreground">
              Riwayat teknis tidak dapat disembunyikan. Nomor serial dan data pribadi tetap
              disamarkan.
            </p>
          </section>
          <label className="field">
            Harga minta (Rp)
            <input
              type="number"
              min="1"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setError("");
              }}
              placeholder="6000000"
            />
            {error && <span className="field-error">{error}</span>}
          </label>
          {e && Number(price) > 0 && (
            <div className="flex items-center justify-between border-y border-border py-4">
              <span className="text-xs text-muted-foreground">Posisi harga</span>
              <PriceBadge label={priceLabel(Number(price), e)} />
            </div>
          )}
          <p className="text-xs leading-5 text-muted-foreground">
            Paspor dan riwayat akan dapat dilihat publik. Serial perangkat tetap disamarkan.
          </p>
          <Button type="submit" className="h-12 w-full">
            Tayangkan listing
            <ArrowRight />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Data tersimpan selama sesi demo ini.
          </p>
        </form>
      </div>
    </main>
  );
}
