import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, MessageCircle, Send, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-provider";
import { EmptyState, PageHeading } from "./passport-ui";
import { fileError, rupiah } from "@/lib/passport";
import { orderLabels, REVIEW_HOURS } from "@/lib/workflows";
export function OrdersScreen() {
  const { orders, user, devices } = useDemo();
  const visible = orders.filter((o) => o.buyer === user?.id || o.seller === user?.id);
  return (
    <main className="page-container reading-screen py-9">
      <PageHeading
        title="Pesanan Saya"
        subtitle="Pantau transaksi dan pastikan perangkat sesuai paspornya."
      />
      {visible.length ? (
        <div className="space-y-5">
          {visible.map((o) => {
            const d = devices.find((x) => x.id === o.deviceId);
            return (
              <Link
                to="/orders/$id"
                params={{ id: o.id }}
                key={o.id}
                className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted sm:p-5"
              >
                <img
                  src={d?.image}
                  alt={d?.model || "Perangkat"}
                  className="h-16 w-[72px] rounded-lg bg-photo object-cover"
                />
                <div className="min-w-0">
                  <h2 className="font-bold">{d?.model}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {orderLabels[o.status]} · {rupiah(o.amount)}
                  </p>
                </div>
                <ArrowRight className="size-5 shrink-0" />
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={
            user
              ? "Belum ada pesanan. Temukan perangkat yang cocok untuk Anda."
              : "Masuk untuk melihat pesanan Anda."
          }
        >
          <Button asChild>
            <Link to={user ? "/" : "/login"}>{user ? "Jelajahi perangkat" : "Masuk"}</Link>
          </Button>
        </EmptyState>
      )}
      <p className="mt-8 text-sm text-muted-foreground">
        Semua transaksi di sini adalah simulasi. Tidak ada dana yang dipindahkan.
      </p>
    </main>
  );
}
export function OrderScreen({ id }: { id: string }) {
  const { orders, devices, user, orderAction, rateOrder } = useDemo();
  const o = orders.find((x) => x.id === id);
  const [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(""),
    [error, setError] = useState(""),
    [dispute, setDispute] = useState(false),
    [accepted, setAccepted] = useState(false);
  if (!o || !user || (user.id !== o.buyer && user.id !== o.seller && user.role !== "admin"))
    return (
      <main className="page-container py-9">
        <EmptyState title="Pesanan tidak tersedia untuk akun ini.">
          <Button asChild>
            <Link to="/orders">Pesanan Saya</Link>
          </Button>
        </EmptyState>
      </main>
    );
  const d = devices.find((x) => x.id === o.deviceId);
  const buyer = user.id === o.buyer;
  return (
    <main className="page-container reading-screen max-w-3xl py-9">
      <PageHeading
        title={orderLabels[o.status]}
        subtitle="Pesanan perangkat · Simulasi transaksi"
      />
      <div className="mb-8 grid grid-cols-[96px_minmax(0,1fr)] gap-5 border-b border-border pb-7">
        <img src={d?.image} alt={d?.model || "Perangkat"} className="w-24 rounded-lg" />
        <div>
          <h2 className="text-xl font-semibold">{d?.model}</h2>
          <p className="mt-2">{rupiah(o.amount)}</p>
          <Link
            to="/p/$id"
            params={{ id: o.deviceId }}
            className="mt-3 inline-flex items-center gap-2 text-sm text-brand"
          >
            Lihat paspor
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      <p className="mb-8 flex items-start gap-3 rounded-lg border border-border bg-muted p-5 text-sm leading-6">
        <ShieldCheck className="size-5 shrink-0 text-foreground" />
        Dana demo ditahan sampai pembeli mengonfirmasi. Tidak ada pembayaran, pengiriman, atau
        perlindungan dana sungguhan.
      </p>
      <ol className="workflow-steps">
        <li className="complete">
          <h3 className="font-semibold">Pesanan dibuat</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Dana ditahan dalam simulasi. Sepakati serah terima dengan penjual.
          </p>
        </li>
        <li className={o.status !== "ditahan" ? "complete" : ""}>
          <h3 className="font-semibold">Terima dan periksa perangkat</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Masa tinjau {REVIEW_HOURS} jam dimulai setelah perangkat diterima.
          </p>
          {buyer && o.status === "ditahan" && (
            <Button className="mt-5 h-12" onClick={() => orderAction(id, "received")}>
              Perangkat sudah diterima
              <ArrowRight />
            </Button>
          )}
        </li>
        <li className={o.status === "selesai" ? "complete" : ""}>
          <h3 className="font-semibold">Konfirmasi kesesuaian</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Dana dilepas dan paspor berpindah setelah kondisi disetujui.
          </p>
        </li>
      </ol>
      {o.status === "ditinjau" && buyer && (
        <section className="border-t border-border py-7">
          <h2 className="text-lg font-semibold">Cocokkan dengan paspor</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Batas tinjau:{" "}
            {o.reviewStartedAt
              ? new Date(
                  new Date(o.reviewStartedAt).getTime() + REVIEW_HOURS * 3600000,
                ).toLocaleString("id-ID")
              : "—"}
            . Pada demo, tidak ada pelepasan dana otomatis.
          </p>
          <div className="my-6 space-y-4">
            {[
              "Identitas dan serial sesuai",
              "Baterai dan fungsi sesuai laporan",
              "Kondisi fisik dan part sesuai riwayat",
              "Kunci akun sudah dilepas",
            ].map((item) => (
              <label key={item} className="flex gap-3 text-sm">
                <input type="checkbox" className="size-5" />
                {item}
              </label>
            ))}
          </div>
          <label className="mb-5 flex gap-3 text-sm leading-6">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 size-5"
            />
            Saya telah memeriksa perangkat dan setuju menyelesaikan transaksi.
          </label>
          <Button
            disabled={!accepted}
            className="h-12 w-full"
            onClick={() => {
              orderAction(id, "accept");
              toast.success("Paspor berpindah ke Anda · Dana demo dilepas");
            }}
          >
            <CheckCircle2 />
            Kondisi sesuai, selesaikan
          </Button>
          <Button variant="outline" className="mt-3 h-12 w-full" onClick={() => setDispute(true)}>
            Ada ketidaksesuaian
          </Button>
          {dispute && (
            <form
              className="mt-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (reason.trim().length < 5 || !evidence) {
                  setError("Jelaskan masalah dan lampirkan foto bukti.");
                  return;
                }
                orderAction(id, "dispute", { reason, evidence });
                toast.success("Sengketa diajukan. Dana demo tetap ditahan.");
              }}
            >
              <label className="field">
                Masalah yang ditemukan
                <textarea
                  required
                  minLength={5}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </label>
              <label className="field">
                Foto bukti
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const err = fileError(f);
                    if (err) {
                      setError(err);
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") setEvidence(reader.result);
                    };
                    reader.readAsDataURL(f);
                  }}
                />
              </label>
              {evidence && (
                <img src={evidence} alt="Bukti sengketa" className="max-h-40 rounded-lg" />
              )}
              {error && <p className="field-error">{error}</p>}
              <Button type="submit" className="h-12 w-full">
                Ajukan sengketa
              </Button>
            </form>
          )}
        </section>
      )}
      {o.status === "sengketa" && (
        <section className="border-t border-border py-7">
          <h2 className="font-semibold">Menunggu peninjauan</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{o.reason}</p>
          <p className="mt-4 text-sm text-document">
            Dana demo tetap ditahan. Keputusan dibuat melalui akun Admin Demo.
          </p>
        </section>
      )}
      {o.decision && <p className="rounded-lg bg-muted p-5 text-sm">{o.decision}</p>}
      {o.status === "selesai" && (
        <section className="border-t border-border py-7">
          <CheckCircle2 className="mb-4 size-10 text-trust" />
          <h2 className="text-xl font-semibold">
            {buyer ? "Paspor kini milik Anda" : "Transaksi selesai"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Riwayat teknis tetap utuh. Identitas pribadi pemilik sebelumnya disamarkan.
          </p>
          {buyer && (
            <>
              <Button asChild className="mt-5 h-12">
                <Link to="/devices">
                  Lihat Perangkat Saya
                  <ArrowRight />
                </Link>
              </Button>
              <h3 className="mt-7 text-sm font-medium">Bagaimana pengalaman transaksi Anda?</h3>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    variant="ghost"
                    size="icon"
                    aria-label={`Beri rating ${n}`}
                    onClick={() => rateOrder(id, n)}
                  >
                    <Star
                      className={
                        n <= (o.rating || 0)
                          ? "fill-document text-document"
                          : "text-muted-foreground"
                      }
                    />
                  </Button>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
export function ChatScreen({ id }: { id: string }) {
  const { devices, user, messages, sendMessage } = useDemo();
  const d = devices.find((x) => x.id === id);
  const [text, setText] = useState(""),
    [offer, setOffer] = useState("");
  if (!d || !user)
    return (
      <main className="page-container py-9">
        <EmptyState title="Masuk untuk berdiskusi tentang perangkat.">
          <Button asChild>
            <Link to="/login" search={{ next: `/chat/${id}` }}>
              Masuk
            </Link>
          </Button>
        </EmptyState>
      </main>
    );
  const thread = messages.filter((m) => m.deviceId === id);
  return (
    <main className="page-container reading-screen max-w-2xl py-9">
      <PageHeading
        title={`Diskusi ${d.model}`}
        subtitle="Tanyakan kondisi dan sepakati penawaran sebelum membeli."
      />
      <Link
        to="/p/$id"
        params={{ id }}
        className="mb-7 grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-5"
      >
        <img src={d.image} alt={d.model} className="w-16 rounded-lg" />
        <div>
          <h2 className="font-semibold">{d.model}</h2>
          <p className="mt-1 text-sm">{rupiah(d.price || 0)}</p>
        </div>
        <ArrowRight className="size-4" />
      </Link>
      <p className="mb-6 text-sm text-muted-foreground">
        Percakapan demo antar peran. Tidak ada pesan yang dikirim ke penjual sungguhan.
      </p>
      <div className="min-h-64 space-y-4">
        {thread.length ? (
          thread.map((m) => (
            <div
              key={m.id}
              className={`max-w-[88%] rounded-lg p-4 ${m.sender === user.id ? "ml-auto bg-foreground text-background" : "bg-muted"}`}
            >
              <p
                className={`mb-2 text-xs font-semibold ${m.sender === user.id ? "text-background/70" : "text-muted-foreground"}`}
              >
                {m.sender === user.id ? "Anda" : m.sender === "seller" ? "Penjual" : "Pembeli"}
              </p>
              <p className="text-sm leading-6">{m.text}</p>
              {m.offer && <p className="mt-2 font-semibold">Penawaran {rupiah(m.offer)}</p>}
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            <MessageCircle className="mx-auto mb-3 size-8" />
            Belum ada percakapan.
          </div>
        )}
      </div>
      <form
        className="mt-6 space-y-4 border-t border-border pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(id, text, Number(offer) || undefined);
          setText("");
          setOffer("");
        }}
      >
        <label className="field">
          Pesan
          <textarea
            required
            rows={3}
            placeholder="Apakah baterai dan layar pernah diganti?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <label className="field">
          Penawaran harga (opsional)
          <input
            type="number"
            min="1"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="Rp"
          />
        </label>
        <Button className="h-12 w-full" type="submit">
          <Send />
          Kirim pesan
        </Button>
      </form>
    </main>
  );
}
