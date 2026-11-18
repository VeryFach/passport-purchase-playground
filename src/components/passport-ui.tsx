import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronLeft,
  Circle,
  FileText,
  Fingerprint,
  Home,
  Laptop,
  LogOut,
  Plus,
  Quote,
  ShieldCheck,
  Smartphone,
  UserRound,
  Heart,
  GitCompareArrows,
  ShoppingBag,
  Battery,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-provider";
import { cn } from "@/lib/utils";
import { estimate, priceLabel, rupiah, scoreLabel, trustScore, type Device } from "@/lib/passport";
import navHome from "@/assets/figma/nav-home.svg";
import navDevices from "@/assets/figma/nav-devices.svg";
import navActivity from "@/assets/figma/nav-activity.svg";
import navAccount from "@/assets/figma/nav-account.svg";
import arrowRight from "@/assets/figma/arrow-right.svg";
export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-bold text-lg">
      <span className="grid size-9 place-items-center rounded-lg bg-logo-accent text-primary-foreground">
        <Fingerprint className="size-6" />
      </span>
      <span>
        paspor<span className="font-normal text-muted-foreground">digital</span>
        <span className="text-logo-accent">.</span>
      </span>
    </Link>
  );
}
export function AppHeader() {
  const { user, signOut } = useDemo();
  const path = useLocation().pathname;
  const mobileItems =
    user?.role === "partner"
      ? [
          { to: "/", label: "Beranda", asset: navHome },
          { to: "/mitra", label: "Mitra", asset: navDevices },
          { to: "/orders", label: "Aktivitas", asset: navActivity },
          { to: "/account", label: "Akun", asset: navAccount },
        ]
      : user?.role === "admin"
        ? [
            { to: "/", label: "Beranda", asset: navHome },
            { to: "/admin", label: "Tinjauan", asset: navDevices },
            { to: "/orders", label: "Aktivitas", asset: navActivity },
            { to: "/account", label: "Akun", asset: navAccount },
          ]
        : [
            { to: "/", label: "Beranda", asset: navHome },
            { to: "/devices", label: "Perangkat", asset: navDevices },
            { to: "/orders", label: "Aktivitas", asset: navActivity },
            { to: "/account", label: "Akun", asset: navAccount },
          ];
  return (
    <>
      <header className="sticky top-0 z-30 bg-card lg:border-b lg:border-border">
        <div className="page-container grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:justify-between lg:h-[68px]">
          <Logo />
          <nav aria-label="Navigasi utama" className="hidden h-full items-center gap-8 lg:flex">
            {user?.role === "admin" ? (
              <Link to="/admin" className="text-sm font-semibold text-foreground">
                Peninjauan
              </Link>
            ) : user?.role === "partner" ? (
              <Link to="/mitra" className="text-sm font-semibold text-foreground">
                Dasbor Mitra
              </Link>
            ) : (
              <>
                <Link
                  to="/"
                  className={cn(
                    "flex h-full items-center gap-2 border-b-2 text-sm",
                    path === "/"
                      ? "border-foreground text-foreground font-semibold"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  <Home className="size-4" />
                  Beranda
                </Link>
                <Link
                  to="/devices"
                  className={cn(
                    "flex h-full items-center gap-2 border-b-2 text-sm",
                    path.startsWith("/devices")
                      ? "border-foreground text-foreground font-semibold"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  <Smartphone className="size-4" />
                  Perangkat Saya
                </Link>
              </>
            )}
            <Link
              to="/orders"
              className={cn(
                "flex h-full items-center border-b-2 text-sm",
                path.startsWith("/orders")
                  ? "border-foreground font-semibold text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              Aktivitas
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-md bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground sm:block">
              DEMO
            </span>
            {user ? (
              <>
                <Link to="/login" className="flex items-center gap-2 text-sm">
                  <span className="grid size-9 place-items-center rounded-full bg-muted text-foreground font-semibold">
                    {user.name[0]}
                  </span>
                  <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Keluar"
                  aria-label="Keluar"
                  onClick={signOut}
                >
                  <LogOut />
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-4">
                <Link to="/login" aria-label="Masuk">
                  <UserRound />
                  <span className="hidden sm:inline">Masuk</span>
                  <ArrowUpRight className="hidden sm:block" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-40 grid h-[83px] grid-cols-4 border-t border-border bg-card px-3 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {mobileItems.map(({ to, label, asset }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 pt-2 text-sm",
                active ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              <img
                src={asset}
                alt=""
                width={32}
                height={32}
                className={cn("size-8", active ? "brightness-0" : to === "/" ? "opacity-35" : "")}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
export function PageHeading({
  title,
  subtitle,
  back = true,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 grid grid-cols-1 items-start gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        {back && (
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground"
          >
            <ChevronLeft className="size-4" />
            Kembali ke jelajahi
          </Link>
        )}
        <h1 className="text-[28px] font-bold tracking-tight md:text-[36px]">{title}</h1>
        {subtitle && (
          <p className="mt-3 break-words text-base leading-7 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
export function ScoreRing({ score, large = false }: { score: number; large?: boolean }) {
  const [shown, setShown] = useState(score);
  const displayed = useRef(score);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(score);
      displayed.current = score;
      return;
    }
    const start = performance.now();
    const from = displayed.current;
    let raf = 0;
    const tick = (time: number) => {
      const progress = Math.min((time - start) / 600, 1);
      const next = Math.round(from + (score - from) * (1 - (1 - progress) ** 3));
      displayed.current = next;
      setShown(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  return (
    <div
      role="img"
      aria-label={`Skor Kepercayaan ${score} dari 100`}
      className={cn(
        "score-ring",
        large && "large",
        score >= 70 ? "text-trust" : score >= 40 ? "text-document" : "text-muted-foreground",
      )}
    >
      <svg viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="currentColor"
          opacity="0.12"
          strokeWidth="7"
        />
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={270.2}
          strokeDashoffset={270.2 * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <span>{shown}</span>
    </div>
  );
}
export function LevelChip({ level }: { level: 1 | 2 | 3 | 4 }) {
  const Icon = level >= 3 ? ShieldCheck : level === 2 ? FileText : Quote;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
        level >= 3
          ? "bg-trust-soft text-trust"
          : level === 2
            ? "bg-document-soft text-document"
            : "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {level === 4
        ? "Terinspeksi"
        : level === 3
          ? "Terdiagnosis"
          : level === 2
            ? "Berdokumen"
            : "Klaim penjual"}
    </span>
  );
}
export function PriceBadge({ label }: { label: string }) {
  const Icon = label === "Murah" ? ArrowDown : label === "Mahal" ? ArrowUp : Circle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
        label === "Murah"
          ? "bg-bargain-soft text-bargain"
          : label === "Mahal"
            ? "bg-expensive-soft text-expensive"
            : "bg-muted text-foreground",
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
export function PassportCard({ device, owned = false }: { device: Device; owned?: boolean }) {
  const { saved, comparison, toggleSaved, toggleCompare } = useDemo();
  const score = trustScore(device),
    e = estimate(device),
    verified = device.records.filter((r) => r.level >= 3).length;
  return (
    <article className="passport-card reading-screen overflow-hidden rounded-xl border border-border bg-card">
      <Link to={owned ? "/devices/$id" : "/p/$id"} params={{ id: device.id }} className="block">
        <div className="relative aspect-[1.6] overflow-hidden bg-photo">
          <img
            src={device.image}
            alt={`${device.brand} ${device.model}`}
            width={1024}
            height={768}
            loading="lazy"
            className="photo-image"
          />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-card/95 px-2.5 py-1 text-xs font-semibold">
            {device.kind === "hp" ? (
              <Smartphone className="size-3" />
            ) : (
              <Laptop className="size-3" />
            )}
            {device.kind === "hp" ? "Handphone" : "Laptop"}
          </span>
          {device.status !== "aktif" && (
            <span className="absolute right-4 top-4 rounded bg-card px-2 py-1 text-xs">
              {device.status === "draf" ? "Draf" : "Terjual"}
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="min-w-0 text-lg font-bold tracking-tight">{device.model}</h2>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{device.variant}</p>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <p className="min-w-0 text-xl font-bold tabular-nums">
              {device.price ? rupiah(device.price) : "Belum ditayangkan"}
            </p>
            {e && device.price && <PriceBadge label={priceLabel(device.price, e)} />}
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
            <ScoreRing score={score} />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-xs font-semibold",
                  score >= 70
                    ? "text-trust"
                    : score >= 40
                      ? "text-document"
                      : "text-muted-foreground",
                )}
              >
                {scoreLabel(score)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {verified > 0 ? `${verified} catatan tingkat L3/L4` : "Belum ada verifikasi mitra"}
              </p>
            </div>
            {verified > 0 ? (
              <ShieldCheck className="size-5 text-trust" />
            ) : (
              <FileText className="size-5 text-muted-foreground" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <span>
            {device.privacy?.showLocation === false ? "Lokasi tidak dibagikan" : device.location}
          </span>
          <span>{device.records.length} catatan riwayat</span>
        </div>
      </Link>
      {!owned && (
        <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => toggleSaved(device.id)}
            aria-pressed={saved.includes(device.id)}
          >
            <Heart className={saved.includes(device.id) ? "fill-brand text-brand" : ""} />
            {saved.includes(device.id) ? "Tersimpan" : "Simpan"}
          </Button>
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => toggleCompare(device.id)}
            aria-pressed={comparison.includes(device.id)}
          >
            <GitCompareArrows />
            {comparison.includes(device.id) ? "Dipilih" : "Bandingkan"}
          </Button>
        </div>
      )}
    </article>
  );
}
export function FeaturedPassportCard({ device }: { device: Device }) {
  const score = trustScore(device);
  return (
    <article className="featured-card">
      <Link to="/p/$id" params={{ id: device.id }} className="block">
        <img
          src={device.image}
          alt={`${device.brand} ${device.model}`}
          width={227}
          height={126}
          loading="lazy"
          className="featured-card-image"
        />
        <span className="featured-card-title">
          {device.model}
          <img src={arrowRight} alt="" width={16} height={16} />
        </span>
        <span className="featured-card-subtitle">{device.variant}</span>
        <span className="featured-card-price">
          {device.price ? rupiah(device.price) : "Harga belum tersedia"}
        </span>
        <span className="featured-card-trust">
          Skor {score}/100 · {scoreLabel(score)} · {device.records.length} catatan
        </span>
      </Link>
    </article>
  );
}
export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="grid justify-items-center gap-4 py-20 text-center">
      <Fingerprint className="size-10 text-muted-foreground" />
      <p className="text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
export function Checklist({ device }: { device: Device }) {
  const score = trustScore(device);
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-4">
        <ScoreRing score={score} />
        <div>
          <h2 className="font-semibold">Skor Kepercayaan</h2>
          <p className="mt-1 text-xs text-muted-foreground">{score} dari 100 poin</p>
        </div>
      </div>
      {/* Concrete score rules are shared with the demo domain. */}
      <ChecklistRows device={device} />
      <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
        Skor kelengkapan data, bukan jaminan kondisi fisik.
      </p>
    </div>
  );
}
import { scoreItems } from "@/lib/passport";
function ChecklistRows({ device }: { device: Device }) {
  return (
    <div className="space-y-4">
      {scoreItems(device).map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs">
          {item.points > 0 ? (
            <Check className="size-4 text-trust" />
          ) : (
            <Plus className="size-4 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1">{item.label}</span>
          <span className="text-muted-foreground">
            {item.points}/{item.max}
          </span>
        </div>
      ))}
    </div>
  );
}
