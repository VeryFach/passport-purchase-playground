import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Fingerprint, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo-provider";
import { readDemoAccounts } from "@/lib/supabase/env";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => typeof search.next === "string" ? { next: search.next } : {},
  head: () => pageHead("Masuk ke akun", "Satu akun untuk membeli dan menjual perangkat Paspor Digital."),
  component: Login,
});

function Login() {
  const { user, signIn, signUp, signOut } = useDemo();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const demoAccounts = readDemoAccounts();
  const go = (role: "user" | "mitra") => {
    if (next === "/mitra") navigate({ to: "/mitra" });
    else if (next === "/devices") navigate({ to: "/devices" });
    else if (next?.startsWith("/p/")) navigate({ to: "/p/$id", params: { id: next.slice(3) } });
    else if (next?.startsWith("/devices/") && next.endsWith("/listing")) navigate({ to: "/devices/$id/listing", params: { id: next.split("/")[2] || "" } });
    else if (next === "/devices/new") navigate({ to: "/devices/new" });
    else if (next?.startsWith("/devices/")) navigate({ to: "/devices/$id", params: { id: next.slice(9) } });
    else navigate({ to: role === "mitra" ? "/mitra" : "/" });
  };
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (register) { await signUp(name || email.split("@")[0] || "Pengguna", email, password); toast.success("Akun dibuat. Anda dapat membeli dan menjual dengan akun ini."); }
      else { await signIn(email, password); toast.success("Berhasil masuk."); }
      go("user");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Autentikasi gagal."); }
    finally { setBusy(false); }
  };
  return <main className="page-container reading-screen max-w-md py-12">
    <Link to="/" className="mb-8 inline-flex items-center gap-1 text-xs text-muted-foreground">← Kembali ke jelajahi</Link>
    <Fingerprint className="mb-5 size-11 text-brand" />
    <h1 className="text-[28px] font-semibold">{user ? "Akun Anda" : register ? "Buat akun baru" : "Selamat datang kembali"}</h1>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">{user ? `${user.name} · ${user.role === "mitra" ? "Mitra verifikasi" : "Pengguna"}` : "Satu akun untuk membeli dan menjual perangkat. Tidak perlu mendaftar toko."}</p>
    {user && <Button className="mt-5" variant="outline" onClick={signOut}>Keluar dari akun</Button>}
    <div className="my-7 flex border-b border-border"><Button variant="ghost" onClick={() => setRegister(false)} className={!register ? "text-brand" : "text-muted-foreground"}>Masuk</Button><Button variant="ghost" onClick={() => setRegister(true)} className={register ? "text-brand" : "text-muted-foreground"}>Daftar</Button></div>
    <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-4">
      {register && <label className="field">Nama lengkap<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>}
      <label className="field">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" autoComplete="email" /></label>
      <label className="field">Password<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={register ? "new-password" : "current-password"} /></label>
      <Button type="submit" className="h-11 w-full" disabled={busy}>{register ? "Buat akun" : "Masuk"}<ArrowRight /></Button>
    </form>
    <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">Akun pengguna baru otomatis berperan <strong>user</strong> dan dapat langsung membeli maupun menjual. Peran mitra hanya diberikan oleh pengelola.</p>
    {demoAccounts.length > 0 && <><div className="my-7 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />atau masuk cepat<div className="h-px flex-1 bg-border" /></div><div className="space-y-3">{demoAccounts.map((account) => { const Icon = account.role === "mitra" ? ShieldCheck : UserRound; return <Button key={account.email} variant="outline" className="h-12 w-full justify-between bg-card shadow-none" disabled={busy} onClick={() => { setEmail(account.email); setPassword(account.password); setBusy(true); signIn(account.email, account.password).then(() => go(account.role)).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Autentikasi gagal.")).finally(() => setBusy(false)); }}><span className="flex items-center gap-3"><Icon />{account.label}</span><ArrowRight /></Button>; })}</div></>}
  </main>;
}
