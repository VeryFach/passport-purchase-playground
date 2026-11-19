// supabase/seed.mjs
// Jalankan: node supabase/seed.mjs
// Butuh: SUPABASE_SERVICE_ROLE_KEY dan VITE_SUPABASE_URL di .env
//
// Baca .env manual karena ini plain Node (bukan Vite)
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// ── load .env ──────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  VITE_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env");
  process.exit(1);
}

// Admin client — bypass RLS, bisa buat user auth
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── helper ─────────────────────────────────────────────────────────────────
let errors = 0;
function ok(label) { console.log(`  ✅ ${label}`); }
function fail(label, err) { console.error(`  ❌ ${label}:`, err?.message ?? err); errors++; }

async function upsertUser({ id, email, fullName, phone, role }) {
  // Cek apakah sudah ada di auth.users lewat listUsers (admin)
  // Supabase Admin API tidak punya upsert user by ID langsung,
  // jadi kita coba createUser dulu; kalau duplicate, update passwordnya.
  const { error: ce } = await supabase.auth.admin.createUser({
    user_metadata: { full_name: fullName },
    email,
    password: "Password123!",
    email_confirm: true,
    ...(id ? { id } : {}),
  });

  if (ce && !ce.message.includes("already been registered") && !ce.message.includes("already exists")) {
    fail(`createUser ${email}`, ce);
    return;
  }

  // Kalau sudah ada, update password biar selalu Password123!
  if (ce) {
    // cari user by email
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === email);
    if (existing) {
      const { error: ue } = await supabase.auth.admin.updateUserById(existing.id, {
        password: "Password123!",
        email_confirm: true,
      });
      if (ue) fail(`updatePassword ${email}`, ue);
      else ok(`Updated password: ${email}`);
    }
  } else {
    ok(`Created user: ${email}`);
  }

  // Upsert profile (pakai service role, bypass RLS)
  const { data: list2 } = await supabase.auth.admin.listUsers();
  const user = list2?.users?.find((u) => u.email === email);
  if (!user) return;

  const { error: pe } = await supabase.from("profiles").upsert(
    { id: user.id, full_name: fullName, phone, role },
    { onConflict: "id" }
  );
  if (pe) fail(`profile ${email}`, pe);
  else ok(`Profile upserted: ${fullName} [${role}]`);
}

// ── data definisi ──────────────────────────────────────────────────────────

const USERS = [
  { email: "budi.santoso@example.com",   fullName: "Budi Santoso",              phone: "081234567890", role: "user",  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80" },
  { email: "siti.rahma@example.com",     fullName: "Siti Rahmawati",            phone: "081298765432", role: "user",  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80" },
  { email: "andi.wijaya@example.com",    fullName: "Andi Wijaya",               phone: "081377889900", role: "user",  avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80" },
  { email: "reza.pratama@example.com",   fullName: "Reza Pratama",              phone: "081511223344", role: "user",  avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200&q=80" },
  { email: "mitra.jakarta@example.com",  fullName: "Mitra Servis Resmi Jakarta",phone: "0215550192",   role: "mitra", avatar: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&h=200&q=80" },
  { email: "mitra.bandung@example.com",  fullName: "Mitra Gadget Care Bandung", phone: "0227770144",   role: "mitra", avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&h=200&q=80" },
];

const MARKET_PRICES = [
  { category: "smartphone", brand: "Apple",   model: "iPhone 15 Pro",          variant: "128 GB · Natural Titanium", retail_price: 20999000, used_price_1y: 16500000, used_price_2y: 14200000, used_price_3y: 12000000 },
  { category: "smartphone", brand: "Apple",   model: "iPhone 15",              variant: "128 GB · Blue",             retail_price: 16499000, used_price_1y: 12800000, used_price_2y: 10500000, used_price_3y:  8900000 },
  { category: "smartphone", brand: "Apple",   model: "iPhone 14 Pro",          variant: "128 GB · Deep Purple",      retail_price: 18999000, used_price_1y: 14200000, used_price_2y: 11800000, used_price_3y:  9800000 },
  { category: "smartphone", brand: "Apple",   model: "iPhone 14",              variant: "128 GB · Starlight",        retail_price: 14999000, used_price_1y: 10800000, used_price_2y:  8900000, used_price_3y:  7500000 },
  { category: "smartphone", brand: "Apple",   model: "iPhone 13",              variant: "128 GB · Midnight",         retail_price: 12999000, used_price_1y:  8500000, used_price_2y:  6800000, used_price_3y:  5800000 },
  { category: "smartphone", brand: "Apple",   model: "iPhone 13 mini",         variant: "128 GB · Pink",             retail_price: 11999000, used_price_1y:  7500000, used_price_2y:  5800000, used_price_3y:  4800000 },
  { category: "smartphone", brand: "Apple",   model: "iPhone 12",              variant: "64 GB · Black",             retail_price: 11999000, used_price_1y:  6500000, used_price_2y:  4900000, used_price_3y:  3900000 },
  { category: "smartphone", brand: "Apple",   model: "iPhone 11",              variant: "64 GB · White",             retail_price:  8999000, used_price_1y:  4800000, used_price_2y:  3600000, used_price_3y:  2800000 },
  { category: "smartphone", brand: "Samsung", model: "Galaxy S24 Ultra",       variant: "256 GB · Titanium Gray",   retail_price: 21999000, used_price_1y: 17500000, used_price_2y: 14800000, used_price_3y: 12500000 },
  { category: "smartphone", brand: "Samsung", model: "Galaxy S23 Ultra",       variant: "256 GB · Phantom Black",   retail_price: 19999000, used_price_1y: 13800000, used_price_2y: 11200000, used_price_3y:  9200000 },
  { category: "smartphone", brand: "Samsung", model: "Galaxy S23",             variant: "256 GB · Green",            retail_price: 13999000, used_price_1y:  8200000, used_price_2y:  6400000, used_price_3y:  5200000 },
  { category: "smartphone", brand: "Samsung", model: "Galaxy Z Flip 5",        variant: "256 GB · Mint",             retail_price: 15999000, used_price_1y:  9800000, used_price_2y:  7600000, used_price_3y:  6100000 },
  { category: "smartphone", brand: "Samsung", model: "Galaxy A54",             variant: "128 GB · Awesome Lime",    retail_price:  5999000, used_price_1y:  3900000, used_price_2y:  3100000, used_price_3y:  2400000 },
  { category: "smartphone", brand: "Google",  model: "Pixel 8 Pro",            variant: "128 GB · Obsidian",         retail_price: 16999000, used_price_1y: 11900000, used_price_2y:  9500000, used_price_3y:  7900000 },
  { category: "smartphone", brand: "Xiaomi",  model: "Xiaomi 13T",             variant: "256 GB · Alpine Blue",      retail_price:  6499000, used_price_1y:  4800000, used_price_2y:  3700000, used_price_3y:  2900000 },
  { category: "laptop",     brand: "Apple",   model: "MacBook Air M1",         variant: "8 GB / 256 GB · Space Gray",retail_price: 15999000, used_price_1y: 10500000, used_price_2y:  8600000, used_price_3y:  7200000 },
  { category: "laptop",     brand: "Apple",   model: "MacBook Air M2",         variant: "8 GB / 256 GB · Midnight", retail_price: 17999000, used_price_1y: 12900000, used_price_2y: 10800000, used_price_3y:  9200000 },
  { category: "laptop",     brand: "Apple",   model: "MacBook Pro M1",         variant: "8 GB / 512 GB · Silver",   retail_price: 21999000, used_price_1y: 13500000, used_price_2y: 11000000, used_price_3y:  9500000 },
  { category: "laptop",     brand: "Apple",   model: "MacBook Pro 14 M2 Pro",  variant: "16 GB / 512 GB · Space Gray",retail_price:31999000, used_price_1y: 24000000, used_price_2y: 20500000, used_price_3y: 17800000 },
  { category: "laptop",     brand: "Lenovo",  model: "ThinkPad X1 Carbon Gen 9",variant:"16 GB / 512 GB · Black",  retail_price: 24999000, used_price_1y: 14500000, used_price_2y: 11500000, used_price_3y:  8900000 },
  { category: "laptop",     brand: "Lenovo",  model: "IdeaPad Slim 3",         variant: "8 GB / 256 GB · Abyss Blue",retail_price: 7499000, used_price_1y:  5200000, used_price_2y:  4100000, used_price_3y:  3200000 },
  { category: "laptop",     brand: "Dell",    model: "XPS 13 9310",            variant: "16 GB / 512 GB · Platinum Silver",retail_price:22999000,used_price_1y:13800000,used_price_2y:10900000,used_price_3y: 8600000 },
  { category: "laptop",     brand: "ASUS",    model: "ROG Zephyrus G14",       variant: "16 GB / 1 TB · Eclipse Gray",retail_price:26999000, used_price_1y: 17500000, used_price_2y: 14000000, used_price_3y: 11500000 },
];

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀  Supabase Seed Script\n");

  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log("👤  Membuat akun demo…");
  for (const u of USERS) await upsertUser(u);

  // Ambil semua user biar bisa map email → uuid
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 50 });
  const byEmail = Object.fromEntries(authUsers.map((u) => [u.email, u.id]));

  // Update avatar di profiles (kolom yang bisa diupdate)
  for (const u of USERS) {
    const uid = byEmail[u.email];
    if (!uid) continue;
    const { error } = await supabase.from("profiles").upsert(
      { id: uid, full_name: u.fullName, avatar_url: u.avatar, phone: u.phone, role: u.role },
      { onConflict: "id" }
    );
    if (error) fail(`avatar ${u.email}`, error);
  }

  const BUDI   = byEmail["budi.santoso@example.com"];
  const SITI   = byEmail["siti.rahma@example.com"];
  const ANDI   = byEmail["andi.wijaya@example.com"];
  const REZA   = byEmail["reza.pratama@example.com"];
  const MITRA1 = byEmail["mitra.jakarta@example.com"];
  const MITRA2 = byEmail["mitra.bandung@example.com"];

  if (!BUDI || !SITI || !ANDI || !REZA || !MITRA1 || !MITRA2) {
    console.error("❌  Gagal resolve UUID user. Hentikan seed.");
    process.exit(1);
  }

  // ── 2. Market prices ──────────────────────────────────────────────────────
  console.log("\n📊  Mengisi harga pasar referensi…");
  const { data: existingMarkets } = await supabase.from("market_prices").select("category, brand, model, variant");
  const existingSet = new Set(
    (existingMarkets ?? []).map((m) => `${m.category}_${m.brand.toLowerCase()}_${m.model.toLowerCase()}_${(m.variant || "").toLowerCase()}`)
  );
  const newMarkets = MARKET_PRICES.filter(
    (m) => !existingSet.has(`${m.category}_${m.brand.toLowerCase()}_${m.model.toLowerCase()}_${(m.variant || "").toLowerCase()}`)
  );
  if (newMarkets.length > 0) {
    const { error: mpe } = await supabase.from("market_prices").insert(
      newMarkets.map((r) => ({ ...r, source: "Market Aggregate 2026", is_demo: true }))
    );
    if (mpe) fail("market_prices insert", mpe);
    else ok(`${newMarkets.length} harga pasar baru ditambahkan`);
  } else {
    ok(`Harga pasar sudah terisi (${existingMarkets?.length ?? 0} model)`);
  }

  // ── 3. Devices ────────────────────────────────────────────────────────────
  console.log("\n📱  Menyimpan perangkat…");

  const DEVICES = [
    {
      owner_email: "budi.santoso@example.com",
      passport_code: "DSP-ID-2023-IPH13-001",
      category: "smartphone", brand: "Apple", model: "iPhone 13",
      variant: "128 GB · Midnight", serial_number: "FD9Z8K30MD6R", imei: "351234567890482",
      specifications: { storage:"128 GB",ram:"4 GB",cpu:"Apple A15 Bionic",gpu:"Apple 4-Core GPU",os:"iOS 17.5",location:"Jakarta Selatan",accessories:"Kotak, charger 20W original, dan kabel C to Lightning",serviceDue:"2026-12-18",warrantyUntil:"2024-06-10",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-06-10", purchase_price: 12999000, battery_health: 91,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 92,
    },
    {
      owner_email: "budi.santoso@example.com",
      passport_code: "DSP-ID-2022-MBA-M1-002",
      category: "laptop", brand: "Apple", model: "MacBook Air M1",
      variant: "8 GB / 256 GB · Space Gray", serial_number: "C02D8K4Q6L41",
      specifications: { storage:"256 GB SSD",ram:"8 GB Unified",cpu:"Apple M1 8-Core",gpu:"7-Core GPU",os:"macOS Sonoma",location:"Bandung",accessories:"Fullset kotak, adapter 30W USB-C original, kabel MagSafe",serviceDue:"2027-01-10",warrantyUntil:"2023-11-20",identityStatus:"checked",showLocation:true,showPurchasePrice:false },
      purchase_date: "2022-11-20", purchase_price: 15999000, battery_health: 94,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 89,
    },
    {
      owner_email: "andi.wijaya@example.com",
      passport_code: "DSP-ID-2023-S23-003",
      category: "smartphone", brand: "Samsung", model: "Galaxy S23",
      variant: "256 GB · Green", serial_number: "R5CW3018FJK", imei: "351234567890483",
      specifications: { storage:"256 GB",ram:"8 GB",cpu:"Snapdragon 8 Gen 2 for Galaxy",gpu:"Adreno 740",os:"One UI 6.1 (Android 14)",location:"Surabaya",accessories:"Unit HP, kabel data C-to-C, dusbook resmi SEIN",serviceDue:"2026-10-05",warrantyUntil:"2024-05-15",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-05-15", purchase_price: 13999000, battery_health: 88,
      physical_condition: "light_wear",
      photo_url: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 78,
    },
    {
      owner_email: "andi.wijaya@example.com",
      passport_code: "DSP-ID-2023-IPH14P-004",
      category: "smartphone", brand: "Apple", model: "iPhone 14 Pro",
      variant: "128 GB · Deep Purple", serial_number: "H7K8L9M0N1P2", imei: "352345678901234",
      specifications: { storage:"128 GB",ram:"6 GB",cpu:"Apple A16 Bionic",gpu:"Apple 5-Core GPU",os:"iOS 17.4",location:"Jakarta Barat",accessories:"Lengkap box garansi iBox, tempered glass terpasang, case Spigen",serviceDue:"2027-03-01",warrantyUntil:"2024-09-28",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-09-28", purchase_price: 18999000, battery_health: 95,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 96,
    },
    {
      owner_email: "reza.pratama@example.com",
      passport_code: "DSP-ID-2021-MBP-M1-005",
      category: "laptop", brand: "Apple", model: "MacBook Pro M1",
      variant: "8 GB / 512 GB · Silver", serial_number: "C02XY9ZP1K99",
      specifications: { storage:"512 GB SSD",ram:"8 GB Unified",cpu:"Apple M1 8-Core",gpu:"8-Core GPU",os:"macOS Sonoma",location:"Tangerang Selatan",accessories:"Charger Apple 61W bawaan, dusbook",serviceDue:"2026-08-15",warrantyUntil:"2022-12-10",identityStatus:"checked",showLocation:true,showPurchasePrice:false },
      purchase_date: "2021-12-10", purchase_price: 21999000, battery_health: 86,
      physical_condition: "light_wear",
      photo_url: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 83,
    },
    {
      owner_email: "budi.santoso@example.com",
      passport_code: "DSP-ID-2023-A54-006",
      category: "smartphone", brand: "Samsung", model: "Galaxy A54",
      variant: "128 GB · Awesome Lime", serial_number: "R5CW7890ABC", imei: "351234567890484",
      specifications: { storage:"128 GB",ram:"8 GB",cpu:"Exynos 1380",gpu:"Mali-G68 MP5",os:"One UI 6.0",location:"Yogyakarta",accessories:"Dusbook ori SEIN, kabel C-to-C, softcase bawaan",serviceDue:"2026-11-20",warrantyUntil:"2024-07-01",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-07-01", purchase_price: 5999000, battery_health: 91,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 81,
    },
    {
      owner_email: "reza.pratama@example.com",
      passport_code: "DSP-ID-2022-TP-X1-007",
      category: "laptop", brand: "Lenovo", model: "ThinkPad X1 Carbon Gen 9",
      variant: "16 GB / 512 GB · Black", serial_number: "PF2X9Y8199",
      specifications: { storage:"512 GB NVMe SSD",ram:"16 GB LPDDR4x",cpu:"Intel Core i7-1165G7",gpu:"Intel Iris Xe",os:"Windows 11 Pro Original",location:"Jakarta Pusat",accessories:"Charger 65W ThinkPad Type-C original, tas laptop Lenovo",serviceDue:"2027-02-14",warrantyUntil:"2025-03-30",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2022-03-30", purchase_price: 24999000, battery_health: 90,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 94,
    },
    {
      owner_email: "andi.wijaya@example.com",
      passport_code: "DSP-ID-2024-IPH15P-008",
      category: "smartphone", brand: "Apple", model: "iPhone 15 Pro",
      variant: "128 GB · Natural Titanium", serial_number: "J4M5N6P7Q8R9", imei: "353456789012345",
      specifications: { storage:"128 GB",ram:"8 GB",cpu:"Apple A17 Pro (3nm)",gpu:"Apple 6-Core GPU Ray Tracing",os:"iOS 17.5.1",location:"Jakarta Selatan",accessories:"Fullset bawaan pabrik, nota Digimap asli, tempered glass Nilkin",serviceDue:"2027-06-01",warrantyUntil:"2025-02-10",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2024-02-10", purchase_price: 20999000, battery_health: 99,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 98,
    },
    {
      owner_email: "budi.santoso@example.com",
      passport_code: "DSP-ID-2024-S24U-009",
      category: "smartphone", brand: "Samsung", model: "Galaxy S24 Ultra",
      variant: "256 GB · Titanium Gray", serial_number: "R5CW9912001", imei: "354567890123456",
      specifications: { storage:"256 GB",ram:"12 GB",cpu:"Snapdragon 8 Gen 3 for Galaxy",gpu:"Adreno 750",os:"One UI 6.1 (Galaxy AI)",location:"Surabaya",accessories:"S-Pen original, kabel data type C bawaan, kotak ori garansi SEIN",serviceDue:"2027-05-15",warrantyUntil:"2025-03-01",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2024-03-01", purchase_price: 21999000, battery_health: 98,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 95,
    },
    {
      owner_email: "reza.pratama@example.com",
      passport_code: "DSP-ID-2022-DELL-XPS-010",
      category: "laptop", brand: "Dell", model: "XPS 13 9310",
      variant: "16 GB / 512 GB · Platinum Silver", serial_number: "DEL9912048XPS",
      specifications: { storage:"512 GB PCIe NVMe",ram:"16 GB 4267MHz LPDDR4x",cpu:"Intel Core i7-1185G7",gpu:"Intel Iris Xe",os:"Windows 11 Home",location:"Semarang",accessories:"Charger Dell 45W Type-C original, dongle USB-C to USB-A",serviceDue:"2026-09-10",warrantyUntil:"2023-10-15",identityStatus:"checked",showLocation:true,showPurchasePrice:false },
      purchase_date: "2022-04-12", purchase_price: 22999000, battery_health: 87,
      physical_condition: "light_wear",
      photo_url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 76,
    },
    {
      owner_email: "andi.wijaya@example.com",
      passport_code: "DSP-ID-2023-ROG-G14-011",
      category: "laptop", brand: "ASUS", model: "ROG Zephyrus G14",
      variant: "16 GB / 1 TB · Eclipse Gray", serial_number: "M4NRKD019827ROG",
      specifications: { storage:"1 TB NVMe SSD",ram:"16 GB DDR5",cpu:"AMD Ryzen 9 7940HS",gpu:"NVIDIA GeForce RTX 4060 8GB",os:"Windows 11 Home",location:"Malang",accessories:"Charger 240W original + Charger 100W PD Type-C, tas punggung ROG",serviceDue:"2027-04-20",warrantyUntil:"2025-06-20",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-06-20", purchase_price: 26999000, battery_health: 93,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 91,
    },
    {
      owner_email: "budi.santoso@example.com",
      passport_code: "DSP-ID-2021-IPH12-012",
      category: "smartphone", brand: "Apple", model: "iPhone 12",
      variant: "64 GB · Black", serial_number: "DNPF89L0012A", imei: "351234567890485",
      specifications: { storage:"64 GB",ram:"4 GB",cpu:"Apple A14 Bionic",gpu:"Apple 4-Core GPU",os:"iOS 17.2",location:"Depok",accessories:"Batangan unit HP + kabel pihak ketiga",serviceDue:"2025-12-01",warrantyUntil:"2022-05-10",identityStatus:"unknown",showLocation:true,showPurchasePrice:false },
      purchase_date: "2021-05-10", purchase_price: 11999000, battery_health: 78,
      physical_condition: "damaged",
      photo_url: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 42,
    },
    {
      owner_email: "andi.wijaya@example.com",
      passport_code: "DSP-ID-2023-ZFLIP5-013",
      category: "smartphone", brand: "Samsung", model: "Galaxy Z Flip 5",
      variant: "256 GB · Mint", serial_number: "R5CW4455ZFL", imei: "355678901234567",
      specifications: { storage:"256 GB",ram:"8 GB",cpu:"Snapdragon 8 Gen 2",gpu:"Adreno 740",os:"One UI 6.1",location:"Denpasar, Bali",accessories:"Kotak lengkap, casing transparan Samsung Ring, kabel bawaan",serviceDue:"2026-12-25",warrantyUntil:"2024-08-30",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-08-30", purchase_price: 15999000, battery_health: 92,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 88,
    },
    {
      owner_email: "reza.pratama@example.com",
      passport_code: "DSP-ID-2023-MBA-M2-014",
      category: "laptop", brand: "Apple", model: "MacBook Air M2",
      variant: "8 GB / 256 GB · Midnight", serial_number: "H02M2MIDNIGHT9",
      specifications: { storage:"256 GB SSD",ram:"8 GB Unified",cpu:"Apple M2 8-Core",gpu:"8-Core GPU",os:"macOS Sonoma",location:"Jakarta Selatan",accessories:"Kotak resmi iBox, charger Dual Port 35W original, kabel braided MagSafe 3",serviceDue:"2027-08-10",warrantyUntil:"2024-11-15",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-11-15", purchase_price: 17999000, battery_health: 97,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 93,
    },
    {
      owner_email: "budi.santoso@example.com",
      passport_code: "DSP-ID-2023-MI13T-015",
      category: "smartphone", brand: "Xiaomi", model: "Xiaomi 13T",
      variant: "256 GB · Alpine Blue", serial_number: "XMI13TALP9921", imei: "356789012345678",
      specifications: { storage:"256 GB",ram:"12 GB",cpu:"MediaTek Dimensity 8200-Ultra",gpu:"Mali-G610 MC6",os:"HyperOS (Android 14)",location:"Bogor",accessories:"Charger 67W HyperCharge original, case transparan, dus garansi resmi",serviceDue:"2026-10-10",warrantyUntil:"2025-01-20",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-10-20", purchase_price: 6499000, battery_health: 94,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 85,
    },

    // ── 6 PERANGKAT DRAF UNTUK ANTREAN REVIEW MITRA ──────────────────────────
    // 1. iPad Pro 11 M2 (Budi Santoso)
    {
      owner_email: "budi.santoso@example.com",
      passport_code: "DSP-REV-2024-IPAD-001",
      category: "laptop", brand: "Apple", model: "iPad Pro 11 M2",
      variant: "128 GB · Space Gray Wi-Fi", serial_number: "DMPM2IPADPRO11",
      specifications: { storage:"128 GB",ram:"8 GB",cpu:"Apple M2 8-Core",gpu:"10-Core GPU",os:"iPadOS 17.5",location:"Jakarta Selatan",accessories:"Unit iPad, charger 20W original, box iBox",serviceDue:"2027-04-10",warrantyUntil:"2025-02-15",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2024-02-15", purchase_price: 15499000, battery_health: 98,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 75,
    },
    // 2. MacBook Pro 14 M2 Pro (Reza Pratama)
    {
      owner_email: "reza.pratama@example.com",
      passport_code: "DSP-REV-2023-MBP14-002",
      category: "laptop", brand: "Apple", model: "MacBook Pro 14 M2 Pro",
      variant: "16 GB / 512 GB · Space Gray", serial_number: "C02M2PRO14INCH",
      specifications: { storage:"512 GB SSD",ram:"16 GB Unified",cpu:"Apple M2 Pro 10-Core",gpu:"16-Core GPU",os:"macOS Sonoma",location:"Jakarta Barat",accessories:"Fullset charger 67W MagSafe 3, dus iBox",serviceDue:"2027-07-20",warrantyUntil:"2024-10-30",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-10-30", purchase_price: 31999000, battery_health: 96,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 80,
    },
    // 3. Samsung Galaxy Z Fold 5 (Andi Wijaya)
    {
      owner_email: "andi.wijaya@example.com",
      passport_code: "DSP-REV-2023-ZFOLD5-003",
      category: "smartphone", brand: "Samsung", model: "Galaxy Z Fold 5",
      variant: "256 GB · Icy Blue", serial_number: "R5CWZFOLD5SEIN", imei: "359999012345671",
      specifications: { storage:"256 GB",ram:"12 GB",cpu:"Snapdragon 8 Gen 2 for Galaxy",gpu:"Adreno 740",os:"One UI 6.1",location:"Surabaya",accessories:"Kabel C-to-C, dusbook resmi SEIN, S-Pen Fold Edition",serviceDue:"2026-12-10",warrantyUntil:"2024-09-15",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-09-15", purchase_price: 24999000, battery_health: 94,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 78,
    },
    // 4. iPhone 15 Plus (Siti Rahmawati)
    {
      owner_email: "siti.rahma@example.com",
      passport_code: "DSP-REV-2024-IPH15PL-004",
      category: "smartphone", brand: "Apple", model: "iPhone 15",
      variant: "128 GB · Pink", serial_number: "F15PLUSIBOX004", imei: "359999012345672",
      specifications: { storage:"128 GB",ram:"6 GB",cpu:"Apple A16 Bionic",gpu:"5-Core GPU",os:"iOS 17.5",location:"Bandung",accessories:"Kotak iBox, kabel C-to-C braided bawaan",serviceDue:"2027-05-01",warrantyUntil:"2025-01-10",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2024-01-10", purchase_price: 18499000, battery_health: 97,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 72,
    },
    // 5. Lenovo Legion Slim 5 (Reza Pratama)
    {
      owner_email: "reza.pratama@example.com",
      passport_code: "DSP-REV-2023-LEGION-005",
      category: "laptop", brand: "Lenovo", model: "IdeaPad Slim 3",
      variant: "16 GB / 512 GB · Storm Grey", serial_number: "PF2LEGIONSLIM5",
      specifications: { storage:"512 GB NVMe",ram:"16 GB DDR5",cpu:"AMD Ryzen 7 7840HS",gpu:"RTX 4060 8GB",os:"Windows 11 Home",location:"Tangerang",accessories:"Charger 230W bawaan, tas laptop Lenovo Legion",serviceDue:"2027-08-15",warrantyUntil:"2025-05-20",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-05-20", purchase_price: 19999000, battery_health: 92,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 74,
    },
    // 6. Google Pixel 8 Pro (Andi Wijaya)
    {
      owner_email: "andi.wijaya@example.com",
      passport_code: "DSP-REV-2023-PIXEL8P-006",
      category: "smartphone", brand: "Google", model: "Pixel 8 Pro",
      variant: "128 GB · Obsidian", serial_number: "G8PROOBSIDIAN6", imei: "359999012345673",
      specifications: { storage:"128 GB",ram:"12 GB",cpu:"Google Tensor G3",gpu:"Immortalis-G715s",os:"Android 14",location:"Jakarta Pusat",accessories:"Kabel data Google original, bukti bayar IMEI Bea Cukai",serviceDue:"2027-02-10",warrantyUntil:"2024-11-05",identityStatus:"checked",showLocation:true,showPurchasePrice:true },
      purchase_date: "2023-11-05", purchase_price: 16999000, battery_health: 95,
      physical_condition: "like_new",
      photo_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80",
      lock_status: "claimed_unlocked", trust_score: 76,
    },
  ];

  // Insert devices, return map passport_code → device id
  const deviceIdMap = {};
  for (const d of DEVICES) {
    const ownerId = byEmail[d.owner_email];

    // Cek apakah perangkat sudah ada di DB agar tidak memicu trigger guard_device_update
    const { data: existingDev } = await supabase
      .from("devices")
      .select("id, passport_code")
      .eq("passport_code", d.passport_code)
      .maybeSingle();

    if (existingDev) {
      deviceIdMap[d.passport_code] = existingDev.id;
      ok(`Device exists: ${d.brand} ${d.model} (${d.passport_code})`);
      continue;
    }

    const row = {
      owner_id: ownerId,
      passport_code: d.passport_code,
      category: d.category,
      brand: d.brand,
      model: d.model,
      variant: d.variant,
      serial_number: d.serial_number ?? null,
      imei: d.imei ?? null,
      specifications: d.specifications,
      purchase_date: d.purchase_date,
      purchase_price: d.purchase_price,
      battery_health: d.battery_health,
      physical_condition: d.physical_condition,
      photo_url: d.photo_url,
      lock_status: d.lock_status,
      trust_score: d.trust_score,
    };
    const { data, error } = await supabase
      .from("devices")
      .insert(row)
      .select("id, passport_code")
      .single();
    if (error) { fail(`device ${d.passport_code}`, error); continue; }
    deviceIdMap[d.passport_code] = data.id;
    ok(`Device created: ${d.brand} ${d.model} (${d.passport_code})`);
  }

  // ── 4. History records ────────────────────────────────────────────────────
  console.log("\n📋  Menyimpan riwayat paspor…");

  // Ambil device id by passport code helper
  const devId = (code) => deviceIdMap[code];

  const HISTORIES = [
    // iPhone 13 — 3 record L3 terverifikasi mitra
    { device: "DSP-ID-2023-IPH13-001", created_by: BUDI, type: "purchase", title: "Pembelian Resmi iBox Grand Indonesia", description: "Unit dibeli dalam kondisi baru bergaransi resmi Apple Indonesia (TAM/iBox). Invoice fisik dan box lengkap.", event_date: "2023-06-10", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA1, verification_note: "Invoice resmi dan nomor seri telah dicocokkan dengan database garansi Apple. Valid.", is_public: true },
    { device: "DSP-ID-2023-IPH13-001", created_by: BUDI, type: "battery",  title: "Diagnostik Kesehatan Baterai (91%)", description: "Hasil pengujian siklus baterai menunjukkan 412 cycle count, retensi daya prima dan tidak ada throttling.", event_date: "2024-03-12", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA1, verification_note: "Pengujian hardware diagnostik Apple AST2 berhasil. Baterai original dalam batas sehat normal.", is_public: true },
    { device: "DSP-ID-2023-IPH13-001", created_by: BUDI, type: "service",  title: "Inspeksi Menyeluruh Layar & Komponen", description: "Pemeriksaan True Tone, Face ID, respon sentuh, microphone, dan speaker stereo. Seluruh fungsi 100% normal.", event_date: "2024-04-05", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA1, verification_note: "Semua sensor biometrik dan layar asli tanpa pernah dibongkar pihak ketiga.", is_public: true },
    // MacBook Air M1 — L3 beli + L2 baterai
    { device: "DSP-ID-2022-MBA-M1-002", created_by: BUDI, type: "purchase", title: "Pembelian Pertama di Digimap Bandung", description: "Pembelian baru tangan pertama. Invoice kasir dan nomor seri match di situs Apple Coverage.", event_date: "2022-11-20", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA2, verification_note: "Terverifikasi resmi. Serial C02D8K4Q6L41 terdaftar di garansi resmi Digimap.", is_public: true },
    { device: "DSP-ID-2022-MBA-M1-002", created_by: BUDI, type: "battery",  title: "Cek Siklus Baterai (185 Cycle, 94%)", description: "Penggunaan mayoritas menggunakan adaptor daya dengan pembatas charging 80%, battery health terawat sangat baik.", event_date: "2024-02-18", level: 2, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },
    // Galaxy S23 — L3 beli + L1 damage
    { device: "DSP-ID-2023-S23-003", created_by: ANDI, type: "purchase", title: "Pembelian Samsung Experience Store Surabaya", description: "Unit resmi SEIN Indonesia dual nano SIM + eSIM aktif. Box asli dan struk pembelian ada.", event_date: "2023-05-15", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA1, verification_note: "IMEI 1 & 2 terdaftar di database Kemenperin dan CEIR. Kondisi hardware standar SEIN.", is_public: true },
    { device: "DSP-ID-2023-S23-003", created_by: ANDI, type: "damage",   title: "Baret Halus Pemakaian di Bezel Samping", description: "Ada lecet mikro pada sudut kanan bawah akibat gesekan case debu, layar dan kamera mulus tanpa cacat.", event_date: "2023-11-10", level: 1, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },
    // iPhone 14 Pro — L3
    { device: "DSP-ID-2023-IPH14P-004", created_by: ANDI, type: "purchase", title: "Pembelian iBox Senayan City Jakarta", description: "Pembelian unit baru varian Deep Purple 128GB. Bukti nota fisik dan nomor seri dicatat.", event_date: "2023-09-28", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA1, verification_note: "Kamera Dynamic Island, sensor LiDAR, dan 120Hz ProMotion diuji normal 100%.", is_public: true },
    // ThinkPad X1 Carbon — L3 beli + L3 servis
    { device: "DSP-ID-2022-TP-X1-007", created_by: REZA, type: "purchase", title: "Pengadaan Resmi Lenovo Indonesia (Premier Support)", description: "Unit laptop kerja enterprise bergaransi Lenovo Premier Onsite Warranty hingga 2025.", event_date: "2022-03-30", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA2, verification_note: "Validasi barcode serial number dan status garansi aktif hingga Maret 2025.", is_public: true },
    { device: "DSP-ID-2022-TP-X1-007", created_by: REZA, type: "service",  title: "Pembersihan Thermal Paste & Fan Internal", description: "Perawatan berkala di service center: fan dibersihkan dari debu dan penggantian thermal paste Arctic MX-4.", event_date: "2023-12-05", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA2, verification_note: "Inspeksi motherboard bersih tanpa korosi, fan hening dan suhu stabil.", is_public: true },
    // iPhone 15 Pro — L3
    { device: "DSP-ID-2024-IPH15P-008", created_by: ANDI, type: "purchase", title: "Pembelian Digimap Central Park Mall", description: "Garansi aktif hingga Februari 2025. Faktur PPN resmi dan nota pembayaran lunas.", event_date: "2024-02-10", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA1, verification_note: "Unit baru like-new. Status klaim garansi AppleCare terverifikasi.", is_public: true },
    // Samsung Galaxy S24 Ultra — L2
    { device: "DSP-ID-2024-S24U-009", created_by: BUDI, type: "purchase", title: "Pembelian Samsung Store Tunjungan Plaza Surabaya", description: "SEIN garansi resmi. Nota dan kartu garansi tersedia.", event_date: "2024-03-01", level: 2, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },
    // Galaxy A54 — L2
    { device: "DSP-ID-2023-A54-006", created_by: BUDI, type: "purchase", title: "Pembelian Erafone Yogyakarta", description: "Unit SEIN garansi resmi tangan pertama. Nota dan dusbook lengkap tersedia.", event_date: "2023-07-01", level: 2, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },
    // Galaxy Z Flip 5 — L2
    { device: "DSP-ID-2023-ZFLIP5-013", created_by: ANDI, type: "purchase", title: "Pembelian Samsung Galaxy Z Flip 5 di Samsung Store Bali", description: "Unit SEIN resmi, nota pembelian asli tersedia. Engsel teruji di service center Bali.", event_date: "2023-08-30", level: 2, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },
    // MacBook Air M2 — L3
    { device: "DSP-ID-2023-MBA-M2-014", created_by: REZA, type: "purchase", title: "Pembelian MacBook Air M2 iBox ITC Fatmawati", description: "Nota resmi iBox dan garansi Apple Indonesia 1 tahun aktif.", event_date: "2023-11-15", level: 3, part_original: true, verification_status: "verified", verifier_id: MITRA1, verification_note: "Verifikasi serial dan aktivasi Apple ID berhasil. Perangkat tidak pernah diperbaiki.", is_public: true },
    // ROG Zephyrus G14 — L2
    { device: "DSP-ID-2023-ROG-G14-011", created_by: ANDI, type: "purchase", title: "Pembelian ASUS Store Malang", description: "Unit baru langsung dari toko resmi ASUS. Garansi resmi 2 tahun ASUS Indonesia aktif.", event_date: "2023-06-20", level: 2, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },
    // Xiaomi 13T — L1
    { device: "DSP-ID-2023-MI13T-015", created_by: BUDI, type: "purchase", title: "Pembelian Xiaomi Store Bogor", description: "Unit global ROM, garansi distributor resmi. Nota belanja tersedia.", event_date: "2023-10-20", level: 1, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },
    // MacBook Pro M1 — L2
    { device: "DSP-ID-2021-MBP-M1-005", created_by: REZA, type: "purchase", title: "Pembelian MacBook Pro M1 Resmi", description: "Unit pembelian baru tangan pertama dari Digimap Tangerang City.", event_date: "2021-12-10", level: 2, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },
    // iPhone 12 — L1 (kondisi jelek, trust score rendah)
    { device: "DSP-ID-2021-IPH12-012", created_by: BUDI, type: "purchase", title: "Dibeli dari Teman, Nota Tidak Tersedia", description: "Pembelian second hand dari teman, tidak ada nota pembelian asli maupun dusbook.", event_date: "2021-05-10", level: 1, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },
    // Dell XPS 13 — L2
    { device: "DSP-ID-2022-DELL-XPS-010", created_by: REZA, type: "purchase", title: "Pembelian Dell XPS 13 iBox Semarang", description: "Nota resmi dari iBox Semarang dan garansi Dell 1 tahun aktif.", event_date: "2022-04-12", level: 2, part_original: true, verification_status: "not_requested", verifier_id: null, verification_note: null, is_public: true },

    // ── 6 DATA MENUNGGU REVIEW MITRA (PENDING VERIFICATION) ──────────────────
    // 1. iPad Pro 11 M2 (Budi Santoso)
    {
      device: "DSP-REV-2024-IPAD-001",
      created_by: BUDI,
      type: "purchase",
      title: "Verifikasi Nota Pembelian Resmi Digimap Grand Indonesia",
      description: "Permohonan verifikasi nota pembelian resmi Digimap Grand Indonesia senilai Rp15.499.000. Invoice terlampir lengkap dengan stempel lunas dan serial matching.",
      event_date: "2024-02-15",
      level: 2,
      part_original: true,
      verification_status: "pending",
      verifier_id: MITRA1,
      verification_note: null,
      is_public: true,
      evidence_path: `${BUDI}/nota-ipad-pro-m2.jpg`,
    },
    // 2. MacBook Pro 14 M2 Pro (Reza Pratama)
    {
      device: "DSP-REV-2023-MBP14-002",
      created_by: REZA,
      type: "battery",
      title: "Pemeriksaan Siklus Baterai & Kapasitas Real 96%",
      description: "Laporan diagnostik battery report Apple: cycle count 85, battery health 96%. Mohon mitra memvalidasi kesehatan sel baterai sebelum tayang di marketplace.",
      event_date: "2024-03-20",
      level: 2,
      part_original: true,
      verification_status: "pending",
      verifier_id: MITRA2,
      verification_note: null,
      is_public: true,
      evidence_path: `${REZA}/diagnostik-baterai-mbp14.jpg`,
    },
    // 3. Samsung Galaxy Z Fold 5 (Andi Wijaya)
    {
      device: "DSP-REV-2023-ZFOLD5-003",
      created_by: ANDI,
      type: "service",
      title: "Uji Ketahanan Engsel Flex Hinge & Sensor Layar Lipat",
      description: "Pemeriksaan resmi di Samsung Service Center: engsel Flex Hinge rapat 100%, layar Ultra Thin Glass mulus tanpa crease tajam, sensor lipat responsif.",
      event_date: "2024-02-28",
      level: 2,
      part_original: true,
      verification_status: "pending",
      verifier_id: MITRA1,
      verification_note: null,
      is_public: true,
      evidence_path: `${ANDI}/servis-engsel-zfold5.jpg`,
    },
    // 4. iPhone 15 Plus (Siti Rahmawati)
    {
      device: "DSP-REV-2024-IPH15PL-004",
      created_by: SITI,
      type: "part_replacement",
      title: "Penggantian Back Glass Resmi di Apple Authorized Service",
      description: "Back glass retak halus diganti di Mitra Resmi Apple dengan spare part original. True Tone, MagSafe wireless charging, dan segel tahan air diuji aman.",
      event_date: "2024-03-15",
      level: 2,
      part_original: true,
      verification_status: "pending",
      verifier_id: MITRA2,
      verification_note: null,
      is_public: true,
      evidence_path: `${SITI}/ganti-part-backglass-iph15.jpg`,
    },
    // 5. Lenovo Legion Slim 5 (Reza Pratama)
    {
      device: "DSP-REV-2023-LEGION-005",
      created_by: REZA,
      type: "service",
      title: "Sertifikat Pembersihan Dual Fan & Liquid Metal Repaste",
      description: "Perawatan termal berkala di Authorized Lenovo: fan dibersihkan dari debu, penggantian liquid metal pendingin CPU/GPU, suhu saat gaming stabil di 71C.",
      event_date: "2024-04-05",
      level: 2,
      part_original: true,
      verification_status: "pending",
      verifier_id: MITRA1,
      verification_note: null,
      is_public: true,
      evidence_path: `${REZA}/servis-termal-legion.jpg`,
    },
    // 6. Google Pixel 8 Pro (Andi Wijaya)
    {
      device: "DSP-REV-2023-PIXEL8P-006",
      created_by: ANDI,
      type: "purchase",
      title: "Verifikasi Bukti Bayar Pajak Bea Cukai & Pendaftaran IMEI",
      description: "Unit beli di Google Store SG resmi dibawa masuk ke Indonesia. Bukti pembayaran SPPBMCP Bea Cukai Bandara Soekarno-Hatta dan status IMEI aktif di database CEIR.",
      event_date: "2023-11-20",
      level: 2,
      part_original: true,
      verification_status: "pending",
      verifier_id: MITRA2,
      verification_note: null,
      is_public: true,
      evidence_path: `${ANDI}/bukti-pajak-imei-pixel8pro.jpg`,
    },
  ];

  // Load sample receipt image for storage upload
  const receiptBuffer = readFileSync(resolve(__dir, "../src/assets/receipt.jpg"));

  // Ambil daftar device yang sedang memiliki active listing agar tidak melanggar guard_history_insert
  const { data: activeListings } = await supabase
    .from("listings")
    .select("device_id")
    .eq("status", "active");
  const activeDeviceIds = new Set((activeListings ?? []).map((l) => l.device_id));

  // Set evidence_url dummy untuk level >= 2 dan upload file bukti agar terlihat oleh mitra
  for (const h of HISTORIES) {
    const did = devId(h.device);
    if (!did) { fail(`history skip — device not found: ${h.device}`); continue; }

    // Jika perangkat sedang tayang aktif dan riwayat ini belum ada, lewati agar tidak error guard_history_insert
    if (activeDeviceIds.has(did)) {
      const { data: ex } = await supabase
        .from("history_records")
        .select("id")
        .eq("device_id", did)
        .eq("title", h.title)
        .maybeSingle();
      if (!ex) {
        // Lewati penambahan riwayat baru pada perangkat yang sedang aktif tayang
        continue;
      }
    }

    const needsEvidence = h.level >= 2;
    const evidenceUrl = h.evidence_path ?? (needsEvidence ? `${h.created_by}/evidence-${h.device.slice(-8)}-${h.type}.jpg` : null);
    const requestedAt = h.verification_status !== "not_requested" ? new Date(h.event_date).toISOString() : null;
    const verifiedAt  = h.verification_status === "verified" ? new Date(h.event_date).toISOString() : null;

    if (evidenceUrl) {
      await supabase.storage.from("device-evidence").upload(evidenceUrl, receiptBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
    }

    const row = {
      device_id: did,
      created_by: h.created_by,
      type: h.type,
      title: h.title,
      description: h.description,
      event_date: h.event_date,
      evidence_url: evidenceUrl,
      details: {},
      level: h.level,
      part_original: h.part_original,
      verification_status: h.verification_status,
      verifier_id: h.verifier_id ?? null,
      verification_note: h.verification_note ?? null,
      requested_at: requestedAt,
      verified_at: verifiedAt,
      is_public: h.is_public,
    };

    // Cek apakah riwayat dengan judul ini sudah ada untuk device ini
    const { data: existingHist } = await supabase
      .from("history_records")
      .select("id")
      .eq("device_id", did)
      .eq("title", h.title)
      .maybeSingle();

    if (existingHist) {
      ok(`History exists: [${h.verification_status}] ${h.title.slice(0, 45)}…`);
      continue;
    }

    const { error } = await supabase.from("history_records").insert(row);
    if (error) {
      fail(`history ${h.type} @ ${h.device}`, error);
    } else {
      ok(`History created: [${h.verification_status}] ${h.title.slice(0, 45)}…`);
    }
  }

  // ── 5. Listings ───────────────────────────────────────────────────────────
  console.log("\n🏪  Membuat listing marketplace…");

  const LISTINGS = [
    { device: "DSP-ID-2023-IPH13-001",   seller_email: "budi.santoso@example.com",  title: "iPhone 13 128GB Midnight - Fullset iBox Terverifikasi Mitra L3",           description: "Dijual santai iPhone 13 warna Midnight pemakaian pribadi tangan pertama. Kondisi fisik 98% mulus terpasang tempered glass dari hari pertama. Baterai sehat 91% tidak pernah drop. Paspor Digital lengkap dengan sertifikat inspeksi Mitra Servis Jakarta. Bonus case original Apple.", price: 6000000, estimated_min: 5800000, estimated_max: 6400000, estimated_base_price: 5800000, passport_premium: 200000, photos: ["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2022-MBA-M1-002",  seller_email: "budi.santoso@example.com",  title: "MacBook Air M1 2020 Space Gray 8/256GB Like New Mulus",                    description: "MacBook Air M1 ex kantor desain, pemakaian ringan ngetik dan browsing. Keyboard empuk, layar jernih tanpa dead pixel, trackpad responsif. Baterai masih 94% awet seharian. Kelengkapan fullset original.", price: 8900000, estimated_min: 8400000, estimated_max: 9200000, estimated_base_price: 8500000, passport_premium: 400000, photos: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2023-S23-003",     seller_email: "andi.wijaya@example.com",   title: "Samsung Galaxy S23 256GB Green SEIN - Butuh Dana Cepat",                   description: "Jual cepat Galaxy S23 kapasitas besar 256GB warna hijau segar. Garansi resmi SEIN, kamera tajam 50MP, layar Dynamic AMOLED 120Hz super smooth. Ada sedikit tanda pemakaian di bezel bawah, fungsi 100% aman.", price: 5700000, estimated_min: 6200000, estimated_max: 6900000, estimated_base_price: 6400000, passport_premium: 150000, photos: ["https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2023-IPH14P-004",  seller_email: "andi.wijaya@example.com",   title: "iPhone 14 Pro 128GB Deep Purple iBox Skor Paspor 96",                     description: "Unit kolektor Apple varian warna terfavorit Deep Purple. Kondisi 99% tanpa gores. Baterai super prima 95%. Seluruh bukti nota iBox dan pengecekan hardware mitra terverifikasi di paspor.", price: 12500000, estimated_min: 11500000, estimated_max: 12400000, estimated_base_price: 11800000, passport_premium: 700000, photos: ["https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2021-MBP-M1-005",  seller_email: "reza.pratama@example.com",  title: "MacBook Pro 13 M1 Touch Bar 8GB RAM 512GB SSD Silver",                    description: "MacBook Pro dengan Touch Bar interaktif dan storage lega 512GB. Baterai tahan lebih dari 15 jam kerja. Tidak ada penyok, speaker menggelegar, kipas aktif bikin render lancar jaya.", price: 11500000, estimated_min: 10500000, estimated_max: 11800000, estimated_base_price: 11000000, passport_premium: 500000, photos: ["https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2023-A54-006",     seller_email: "budi.santoso@example.com",  title: "Samsung Galaxy A54 5G 8/128GB Awesome Lime Garansi SEIN",                 description: "HP harian andalan dengan sertifikasi tahan air IP67 dan baterai besar 5000mAh. Warna Awesome Lime kekinian. Dijual karena ganti ke S24.", price: 3200000, estimated_min: 3000000, estimated_max: 3500000, estimated_base_price: 3100000, passport_premium: 100000, photos: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2022-TP-X1-007",   seller_email: "reza.pratama@example.com",  title: "Lenovo ThinkPad X1 Carbon Gen 9 i7 16GB 512GB Garansi Premier 2025",     description: "Laptop legendaris para profesional dan coder. Berat cuma 1.13 kg bodi carbon fiber standar militer MIL-STD-810H. Layar 16:10 nyaman untuk dokumen dan coding.", price: 12800000, estimated_min: 11500000, estimated_max: 13200000, estimated_base_price: 11800000, passport_premium: 1000000, photos: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2024-IPH15P-008",  seller_email: "andi.wijaya@example.com",   title: "iPhone 15 Pro 128GB Natural Titanium Like New Baterai 99%",               description: "Pemakaian baru 4 bulan sangat terawat. Garansi Digimap hingga awal 2025. Bodi titanium ringan dengan port USB-C universal.", price: 16800000, estimated_min: 16000000, estimated_max: 17500000, estimated_base_price: 16500000, passport_premium: 300000, photos: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2024-S24U-009",    seller_email: "budi.santoso@example.com",  title: "Samsung Galaxy S24 Ultra 12/256GB Titanium Gray SEIN Garansi Panjang",    description: "Flagship monster Samsung dengan fitur Galaxy AI terupdate. Kamera zoom 100x dan layar anti-reflektif Gorilla Armor paling jernih di bawah sinar matahari.", price: 17900000, estimated_min: 17000000, estimated_max: 18800000, estimated_base_price: 17500000, passport_premium: 400000, photos: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2022-DELL-XPS-010",seller_email: "reza.pratama@example.com",  title: "Dell XPS 13 9310 Intel i7 RAM 16GB SSD 512GB Layar FHD+ InfinityEdge",   description: "Ultrabook premium terfavorit bagi pencinta portabilitas. Bodi aluminium CNC dan palm rest carbon fiber mewah.", price: 10200000, estimated_min: 10800000, estimated_max: 12200000, estimated_base_price: 11200000, passport_premium: 0, photos: ["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2023-ROG-G14-011", seller_email: "andi.wijaya@example.com",   title: "ASUS ROG Zephyrus G14 Ryzen 9 RTX 4060 16GB 1TB QHD+ 165Hz",            description: "Laptop gaming 14 inci paling ringkas dan bertenaga. Cocok untuk arsitek, video editor 4K, dan gamer berat. Kondisi mulus bebas kendala.", price: 17200000, estimated_min: 16500000, estimated_max: 18200000, estimated_base_price: 17000000, passport_premium: 200000, photos: ["https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2023-ZFLIP5-013",  seller_email: "andi.wijaya@example.com",   title: "Samsung Galaxy Z Flip 5 8/256GB Mint - Layar Lipat Aman Mulus",          description: "Layar lipat tanpa lipatan mencolok, engsel Flex Hinge rapat dan kokoh. Flex Window luar lebar praktis untuk balas chat dan selfie tanpa buka HP.", price: 8900000, estimated_min: 8200000, estimated_max: 9500000, estimated_base_price: 8600000, passport_premium: 300000, photos: ["https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2023-MBA-M2-014",  seller_email: "reza.pratama@example.com",  title: "MacBook Air M2 8/256GB Midnight Garansi iBox Resmi Mulus 99%",           description: "Unit favorit M2 Midnight. Baterai 97% tahan belasan jam. Kamera 1080p FaceTime HD bening untuk meeting Zoom. MagSafe 3 terpasang kuat.", price: 13200000, estimated_min: 12500000, estimated_max: 13800000, estimated_base_price: 12800000, passport_premium: 400000, photos: ["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"], status: "active" },
    { device: "DSP-ID-2023-MI13T-015",   seller_email: "budi.santoso@example.com",  title: "Xiaomi 13T 12/256GB Alpine Blue Kulit Sintetis - Lensa Leica Asli",       description: "Smartphone fotografi hasil racikan Leica. Back cover kulit sintetis biru elegan tahan cipratan air IP68. Layar AMOLED CrystalRes 144Hz.", price: 4700000, estimated_min: 4400000, estimated_max: 5100000, estimated_base_price: 4600000, passport_premium: 100000, photos: ["https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80"], status: "active" },
  ];

  const listingIdMap = {};
  for (const l of LISTINGS) {
    const did = devId(l.device);
    const sid = byEmail[l.seller_email];
    if (!did || !sid) { fail(`listing skip — device/seller not found: ${l.device}`); continue; }

    // Cek kalau sudah ada listing active untuk device ini
    const { data: existing } = await supabase
      .from("listings")
      .select("id, status")
      .eq("device_id", did)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      ok(`Listing sudah ada: ${l.title.slice(0, 40)}…`);
      listingIdMap[l.device] = existing.id;
      continue;
    }

    const { data, error } = await supabase
      .from("listings")
      .insert({
        device_id: did,
        seller_id: sid,
        title: l.title,
        description: l.description,
        price: l.price,
        estimated_min: l.estimated_min,
        estimated_max: l.estimated_max,
        estimated_base_price: l.estimated_base_price,
        passport_premium: l.passport_premium,
        photos: l.photos,
        status: l.status,
      })
      .select("id")
      .single();

    if (error) { fail(`listing ${l.device}`, error); continue; }
    listingIdMap[l.device] = data.id;
    ok(`Listing: ${l.title.slice(0, 50)}…`);
  }

  // ── 6. Simulasi transaksi (iPhone 12 — anggap sudah terjual ke Siti) ──────
  console.log("\n💳  Simulasi transaksi…");
  // Untuk transaksi, device iPhone 12 tidak punya listing aktif (trust rendah, demo saja skip)
  // Kita simulasi transaksi iPhone 13 mini yang menjadi milik Siti
  // Karena ini tabel transactions butuh listing_id yang valid & unik, kita skip jika sudah ada

  // ── Selesai ───────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  if (errors === 0) {
    console.log(`✅  Seed selesai tanpa error!`);
  } else {
    console.log(`⚠️   Seed selesai dengan ${errors} error (cek log di atas).`);
  }

  // ── Test Login Verification ────────────────────────────────────────────────
  console.log("\n🔐  Menguji verifikasi login demo…");
  const anonClient = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: testAuth, error: testErr } = await anonClient.auth.signInWithPassword({
    email: "budi.santoso@example.com",
    password: "Password123!",
  });
  if (testErr) {
    console.log(`  ⚠️  Login test gagal: ${testErr.message}`);
  } else {
    console.log(`  🎉  Login test BERHASIL! User: ${testAuth.user?.email}`);
  }

  console.log("\n📋  Akun demo siap digunakan:");
  console.log("    Email                         | Password      | Role");
  console.log("    ──────────────────────────────|───────────────|───────");
  for (const u of USERS) {
    console.log(`    ${u.email.padEnd(30)} | Password123!  | ${u.role}`);
  }
  console.log("");
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
