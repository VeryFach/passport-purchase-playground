import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Fingerprint, GitCompareArrows, Heart, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDemo } from "@/components/demo-provider";
import { EmptyState, FeaturedPassportCard, PassportCard } from "@/components/passport-ui";
import { galaxy, iphone, macbook } from "@/lib/demo-data";
import { trustScore } from "@/lib/passport";
import searchIcon from "@/assets/figma/search.svg";
import quickTime from "@/assets/figma/quick-time.svg";
import arrowRight from "@/assets/figma/arrow-right.svg";
import ringOuter from "@/assets/figma/banner-ring-outer.svg";
import ringMiddle from "@/assets/figma/banner-ring-middle.svg";
import ringInner from "@/assets/figma/banner-ring-inner.svg";
import bannerBell from "@/assets/figma/banner-bell.svg";

export function HomeScreen() {
  const { devices, comparison, saved, user, orders } = useDemo();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | "hp" | "laptop">("all");
  const [onlySaved, setOnlySaved] = useState(false);
  const [minBattery, setMinBattery] = useState(0);
  const [source, setSource] = useState("all");
  const [minimum, setMinimum] = useState(0);
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("recommended");
  const [filters, setFilters] = useState(false);
  const active = devices.filter((device) => device.status === "aktif");
  const owned = user ? devices.filter((device) => device.owner === user.id) : [];
  const visibleOrders = user
    ? orders.filter((order) => order.buyer === user.id || order.seller === user.id)
    : [];
  const listings = active
    .filter(
      (device) =>
        (!onlySaved || saved.includes(device.id)) &&
        (kind === "all" || device.kind === kind) &&
        `${device.brand} ${device.model}`.toLowerCase().includes(search.trim().toLowerCase()) &&
        device.battery >= minBattery &&
        trustScore(device) >= minimum &&
        (source === "all" || device.records.some((record) => record.level >= Number(source))) &&
        (!maxPrice || (device.price || 0) <= Number(maxPrice)),
    )
    .sort((a, b) =>
      sort === "lowest"
        ? (a.price || 0) - (b.price || 0)
        : sort === "trust"
          ? trustScore(b) - trustScore(a)
          : 0,
    );
  const reset = () => {
    setSearch("");
    setKind("all");
    setOnlySaved(false);
    setMinBattery(0);
    setSource("all");
    setMinimum(0);
    setMaxPrice("");
  };
  const filterCount =
    Number(minBattery > 0) +
    Number(source !== "all") +
    Number(minimum > 0) +
    Number(Boolean(maxPrice));
  const scrollToListings = () =>
    document.getElementById("pilihan-perangkat")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  const categoryItems = [
    {
      label: "HP",
      description: "Smartphone",
      kind: "hp" as const,
      image: iphone,
      count: active.filter((device) => device.kind === "hp").length,
    },
    {
      label: "Laptop",
      description: "Laptop",
      kind: "laptop" as const,
      image: macbook,
      count: active.filter((device) => device.kind === "laptop").length,
    },
  ];
  const filterFields = (
    <div className="space-y-5">
      <label className="field">
        Harga maksimum (Rp)
        <input
          type="number"
          min="0"
          value={maxPrice}
          placeholder="Tanpa batas"
          onChange={(event) => setMaxPrice(event.target.value)}
        />
      </label>
      <label className="field">
        Skor minimum: {minimum}
        <input
          aria-label="Skor minimum"
          type="range"
          min="0"
          max="100"
          value={minimum}
          onChange={(event) => setMinimum(Number(event.target.value))}
        />
      </label>
      <label className="field">
        Baterai minimum: {minBattery}%
        <input
          type="range"
          min="0"
          max="100"
          value={minBattery}
          onChange={(event) => setMinBattery(Number(event.target.value))}
        />
      </label>
      <label className="field">
        Sumber bukti
        <select value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="all">Semua sumber</option>
          <option value="2">Ada dokumen</option>
          <option value="3">Ada diagnostik</option>
          <option value="4">Ada inspeksi</option>
        </select>
      </label>
      <Button variant="outline" className="w-full" onClick={reset}>
        Reset filter
      </Button>
    </div>
  );
  return (
    <main className="home-shell page-container">
      <div className="home-top">
        <div className="home-top-primary">
          <form
            className="home-search"
            role="search"
            data-review="search"
            onSubmit={(event) => {
              event.preventDefault();
              scrollToListings();
            }}
          >
            <img src={searchIcon} alt="" width={16} height={16} />
            <input
              aria-label="Cari perangkat"
              type="search"
              placeholder="Cari perangkat"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="button"
              className="home-search-filter"
              onClick={() => setFilters(true)}
              aria-label={`Buka filter${filterCount ? `, ${filterCount} aktif` : ""}`}
            >
              <SlidersHorizontal aria-hidden="true" size={16} />
              Filter
              {filterCount > 0 && <span className="home-filter-count">{filterCount}</span>}
            </button>
          </form>
          <div className="home-quick-list" aria-label="Akses cepat">
            <Link to="/devices" className="home-quick-row">
              <img src={quickTime} alt="" width={24} height={24} />
              <span className="home-quick-copy">
                <strong>Perangkat saya</strong>
                <span>
                  {owned.length
                    ? `${owned.length} paspor perangkat tersimpan. Kelola riwayat dan bukti.`
                    : "Kelola paspor, bukti servis, dan catatan perangkat."}
                </span>
              </span>
            </Link>
            <Link to="/orders" className="home-quick-row">
              <img src={quickTime} alt="" width={24} height={24} />
              <span className="home-quick-copy">
                <strong>Aktivitas transaksi</strong>
                <span>
                  {visibleOrders.length
                    ? `${visibleOrders.length} transaksi demo. Periksa status dan langkah berikutnya.`
                    : "Pantau pembelian dan proses peninjauan perangkat."}
                </span>
              </span>
            </Link>
          </div>
        </div>
        <Link to="/devices/new" className="home-banner" data-review="banner">
          <span className="home-banner-copy">
            <strong>
              Buat paspor
              <br />
              perangkatmu
            </strong>
            <span>
              Mulai sekarang <img src={arrowRight} alt="" width={16} height={16} />
            </span>
          </span>
          <img src={ringOuter} alt="" width={183} height={183} className="home-banner-outer" />
          <img src={ringMiddle} alt="" width={123} height={123} className="home-banner-middle" />
          <img src={ringInner} alt="" width={83} height={83} className="home-banner-inner" />
          <img src={bannerBell} alt="" width={32} height={37} className="home-banner-bell" />
        </Link>
      </div>
      <div className="home-section-divider" aria-hidden="true" />
      <section className="home-category-section" aria-labelledby="home-category-title">
        <div className="home-section-heading">
          <h1 id="home-category-title">Jelajahi perangkat</h1>
          <a href="#semua-perangkat">Semua</a>
        </div>
        <div className="home-category-list">
          {categoryItems.map((item) => (
            <button
              key={item.kind}
              type="button"
              className="home-category-item"
              aria-label={`Lihat ${item.description}`}
              aria-pressed={kind === item.kind}
              onClick={() => {
                setKind(item.kind);
                scrollToListings();
              }}
            >
              <span className="home-category-picture">
                <img src={item.image} alt="" width={64} height={52} />
                <span className="home-category-badge">{item.count} unit</span>
              </span>
              <span>{item.label}</span>
            </button>
          ))}
          <Link to="/devices" className="home-category-item" aria-label="Perangkat saya">
            <span className="home-category-picture">
              <img src={galaxy} alt="" width={64} height={52} />
            </span>
            <span>Perangkat</span>
          </Link>
          <Link to="/devices/new" className="home-category-item" aria-label="Buat paspor">
            <span className="home-category-picture">
              <Fingerprint aria-hidden="true" size={38} strokeWidth={1.8} />
            </span>
            <span>Paspor</span>
          </Link>
        </div>
      </section>
      <section
        id="pilihan-perangkat"
        className="home-feature-section"
        aria-labelledby="home-feature-title"
      >
        <div className="home-section-heading">
          <h2 id="home-feature-title">Pilihan berpaspor</h2>
          <a href="#semua-perangkat">Semua</a>
        </div>
        {listings.length ? (
          <div className="home-feature-scroller">
            {listings.map((device) => (
              <FeaturedPassportCard key={device.id} device={device} />
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada perangkat yang cocok.">
            <Button variant="outline" onClick={reset}>
              Reset pencarian
            </Button>
          </EmptyState>
        )}
      </section>
      <section id="semua-perangkat" className="home-all-section" aria-labelledby="home-all-title">
        <div className="home-all-heading">
          <div>
            <h2 id="home-all-title">Semua perangkat</h2>
            <p>{listings.length} listing sesuai pilihan</p>
          </div>
          <div className="home-all-actions">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Lihat perangkat tersimpan"
              aria-pressed={onlySaved}
              onClick={() => setOnlySaved(!onlySaved)}
            >
              <Heart className={onlySaved ? "fill-trust text-trust" : ""} />
            </Button>
            <Button variant="outline" onClick={() => setFilters(true)}>
              <SlidersHorizontal />
              Filter
            </Button>
          </div>
        </div>
        <div className="home-list-toolbar">
          <span>Bandingkan kondisi dan bukti sebelum membeli.</span>
          <label>
            Urutkan{" "}
            <select
              aria-label="Urutkan perangkat"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="recommended">Rekomendasi</option>
              <option value="lowest">Harga terendah</option>
              <option value="trust">Skor tertinggi</option>
            </select>
            <ChevronDown aria-hidden="true" size={14} />
          </label>
        </div>
        {listings.length ? (
          <div className="home-all-grid">
            {listings.map((device) => (
              <PassportCard key={device.id} device={device} />
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada listing yang cocok. Coba ubah filter.">
            <Button variant="outline" onClick={reset}>
              Reset filter
            </Button>
          </EmptyState>
        )}
      </section>
      <footer className="home-footer">
        <span>© 2026 Paspor Digital</span>
        <span>Data contoh · Transaksi dan verifikasi simulasi</span>
      </footer>
      {comparison.length > 0 && (
        <div className="home-comparison">
          <span>{comparison.length} perangkat dipilih</span>
          <Button asChild>
            <Link to="/compare">
              <GitCompareArrows />
              Bandingkan
            </Link>
          </Button>
        </div>
      )}
      <Dialog open={filters} onOpenChange={setFilters}>
        <DialogContent className="max-h-[85vh] max-w-sm overflow-y-auto">
          <DialogTitle>Filter perangkat</DialogTitle>
          <DialogDescription>
            Sesuaikan anggaran, kondisi baterai, dan sumber bukti.
          </DialogDescription>
          {filterFields}
          <Button
            onClick={() => {
              setFilters(false);
              scrollToListings();
            }}
          >
            Tampilkan {listings.length} perangkat
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
