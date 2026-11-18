import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Fingerprint, ShieldCheck, ShoppingBag, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo-provider";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search["next"] === "string" ? { next: search["next"] } : {},
  head: () =>
    pageHead("Masuk ke akun", "Masuk ke akun demo penjual, pembeli, atau mitra Paspor Digital."),
  component: Login,
});
function Login() {
  const { user, signIn, signOut } = useDemo();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [register, setRegister] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const enter = (role: "seller" | "buyer" | "partner" | "admin", customName?: string) => {
    signIn(role, customName);
    if (next?.startsWith("/chat/")) navigate({ to: "/chat/$id", params: { id: next.slice(6) } });
    else if (next === "/admin") navigate({ to: "/admin" });
    else if (next === "/devices") navigate({ to: "/devices" });
    else if (next?.startsWith("/p/")) navigate({ to: "/p/$id", params: { id: next.slice(3) } });
    else if (next?.startsWith("/devices/") && next.endsWith("/listing"))
      navigate({ to: "/devices/$id/listing", params: { id: next.split("/")[2] || "" } });
    else if (next === "/devices/new") navigate({ to: "/devices/new" });
    else if (next?.startsWith("/devices/"))
      navigate({ to: "/devices/$id", params: { id: next.slice(9) } });
    else
      navigate({
        to:
          role === "admin"
            ? "/admin"
            : role === "partner"
              ? "/mitra"
              : role === "seller"
                ? "/devices"
                : "/",
      });
  };
  return (
    <main className="page-container reading-screen max-w-md py-12">
      <Link to="/" className="mb-8 inline-flex items-center gap-1 text-xs text-muted-foreground">
        ← Kembali ke jelajahi
      </Link>
      <Fingerprint className="mb-5 size-11 text-brand" />
      <h1 className="text-[28px] font-semibold">
        {user ? "Akun demo Anda" : register ? "Buat akun baru" : "Selamat datang kembali"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {user
          ? `${user.name} · ${user.role === "partner" ? "Mitra" : user.role === "seller" ? "Penjual" : "Pembeli"}`
          : "Satu akun untuk menyimpan riwayat dan menemukan perangkat terpercaya."}
      </p>
      {user && (
        <Button className="mt-5" variant="outline" onClick={signOut}>
          Keluar dari akun
        </Button>
      )}
      <div className="my-7 flex border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setRegister(false)}
          className={!register ? "text-brand" : "text-muted-foreground"}
        >
          Masuk
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRegister(true)}
          className={register ? "text-brand" : "text-muted-foreground"}
        >
          Daftar
        </Button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enter("seller", name || email.split("@")[0]);
        }}
        className="space-y-4"
      >
        {register && (
          <label className="field">
            Nama lengkap
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
        )}
        <label className="field">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            autoComplete="email"
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={register ? "new-password" : "current-password"}
          />
        </label>
        <Button type="submit" className="h-11 w-full">
          {register ? "Buat akun demo" : "Masuk demo"}
          <ArrowRight />
        </Button>
      </form>
      <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
        Akun simulasi, bukan autentikasi sungguhan. Jangan gunakan password asli.
      </p>
      <div className="my-7 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        atau masuk cepat
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-3">
        {[
          { role: "seller" as const, label: "Penjual", Icon: Smartphone },
          { role: "buyer" as const, label: "Pembeli", Icon: ShoppingBag },
          { role: "partner" as const, label: "Mitra", Icon: ShieldCheck },
          { role: "admin" as const, label: "Admin", Icon: ShieldCheck },
        ].map(({ role, label, Icon }) => (
          <Button
            key={role}
            variant="outline"
            className="h-12 w-full justify-between bg-card shadow-none"
            onClick={() => enter(role)}
          >
            <span className="flex items-center gap-3">
              <Icon />
              Masuk cepat: {label}
            </span>
            <ArrowRight />
          </Button>
        ))}
      </div>
    </main>
  );
}
