import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-provider";
import { EmptyState, PageHeading } from "./passport-ui";
import { orderLabels } from "@/lib/workflows";
import { rupiah } from "@/lib/passport";

export function OrdersScreen() {
  const { orders, user, devices } = useDemo();
  const visible = orders.filter((order) => order.buyer === user?.id || order.seller === user?.id);
  return (
    <main className="page-container reading-screen py-9">
      <PageHeading title="Transaksi Saya" subtitle="Riwayat pembelian dan penjualan perangkat." />
      {visible.length ? (
        <div className="space-y-5">
          {visible.map((order) => {
            const device = devices.find((item) => item.id === order.deviceId);
            return (
              <Link
                to="/orders/$id"
                params={{ id: order.id }}
                key={order.id}
                className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted sm:p-5"
              >
                <img src={device?.image} alt={device?.model || "Perangkat"} className="h-16 w-[72px] rounded-lg bg-photo object-cover" />
                <div className="min-w-0">
                  <h2 className="font-bold">{device?.model || "Perangkat"}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{orderLabels[order.status]} · {rupiah(order.amount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{order.buyer === user?.id ? "Pembelian" : "Penjualan"}</p>
                </div>
                <ArrowRight className="size-5 shrink-0" />
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title={user ? "Belum ada transaksi. Temukan perangkat yang cocok untuk Anda." : "Masuk untuk melihat transaksi Anda."}>
          <Button asChild><Link to={user ? "/" : "/login"}>{user ? "Jelajahi perangkat" : "Masuk"}</Link></Button>
        </EmptyState>
      )}
      <p className="mt-8 text-sm text-muted-foreground">Pembelian di aplikasi ini adalah simulasi. Tidak ada pembayaran atau pengiriman nyata.</p>
    </main>
  );
}

export function OrderScreen({ id }: { id: string }) {
  const { orders, devices, user } = useDemo();
  const order = orders.find((item) => item.id === id);
  if (!order || !user || (user.id !== order.buyer && user.id !== order.seller)) {
    return (
      <main className="page-container py-9">
        <EmptyState title="Transaksi tidak tersedia untuk akun ini.">
          <Button asChild><Link to="/orders">Transaksi Saya</Link></Button>
        </EmptyState>
      </main>
    );
  }
  const device = devices.find((item) => item.id === order.deviceId);
  const buyer = user.id === order.buyer;
  return (
    <main className="page-container reading-screen max-w-3xl py-9">
      <PageHeading title="Pembelian selesai" subtitle="Transaksi simulasi · Paspor telah dipindahkan" />
      <div className="mb-8 grid grid-cols-[96px_minmax(0,1fr)] gap-5 border-b border-border pb-7">
        <img src={device?.image} alt={device?.model || "Perangkat"} className="w-24 rounded-lg" />
        <div>
          <h2 className="text-xl font-semibold">{device?.model || "Perangkat"}</h2>
          <p className="mt-2">{rupiah(order.amount)}</p>
          <Link to="/p/$id" params={{ id: device?.passportCode || order.deviceId }} className="mt-3 inline-flex items-center gap-2 text-sm text-brand">
            Lihat paspor <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      <section className="rounded-lg border border-border bg-card p-6">
        <CheckCircle2 className="mb-4 size-10 text-trust" />
        <h2 className="text-xl font-semibold">{buyer ? "Paspor kini milik Anda" : "Perangkat telah berpindah pemilik"}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Transaksi selesai saat tombol Beli dikonfirmasi. Riwayat teknis tetap tersimpan; data pribadi pemilik sebelumnya tidak ditampilkan.</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Simulasi: tidak ada dana yang dipindahkan atau barang yang dikirim oleh aplikasi.</p>
        {buyer && <Button asChild className="mt-5 h-12"><Link to="/devices">Lihat Perangkat Saya <ArrowRight /></Link></Button>}
      </section>
    </main>
  );
}
