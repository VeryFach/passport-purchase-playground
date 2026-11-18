-- =====================================================================
-- DUMMY SEED DATA UNTUK DIGITAL PASSPORT & MARKETPLACE
-- =====================================================================
-- File: supabase/seed.sql
-- Kompatibel dengan migrasi 001_digital_passport_mvp_v02 & 002_c2c_role_guards
-- Dapat dijalankan langsung di Supabase SQL Editor atau via Supabase CLI (`supabase db reset` / `supabase db seed`).
-- =====================================================================

begin;

-- Matikan sementara trigger penjaga selama seeding agar data riwayat L1/L2/L3 dapat diisi langsung
alter table public.history_records disable trigger guard_history_insert;
alter table public.devices disable trigger guard_device_update;

-- =====================================================================
-- 1. AUTH USERS & PROFILES DUMMY
-- =====================================================================
-- Disediakan akun penjual, pembeli, dan 2 mitra resmi terverifikasi.
-- Password demo untuk semua akun: Password123!
-- Hash dibuat real-time pakai crypt() + gen_salt() dari pgcrypto
-- (pgcrypto sudah aktif otomatis di semua project Supabase)
-- =====================================================================

-- Fungsi helper agar hash digenerate sekali lalu dipakai semua baris
do $$
declare
  _hash text := crypt('Password123!', gen_salt('bf', 10));
begin
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    -- Akun Penjual 1: Budi Santoso
    (
      'a1111111-1111-4111-8111-111111111111',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'budi.santoso@example.com',
      _hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Budi Santoso"}'::jsonb,
      now() - interval '90 days',
      now()
    ),
    -- Akun Pembeli 1: Siti Rahmawati
    (
      'a2222222-2222-4222-8222-222222222222',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'siti.rahma@example.com',
      _hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Siti Rahmawati"}'::jsonb,
      now() - interval '80 days',
      now()
    ),
    -- Akun Penjual 2: Andi Wijaya (Gadget Enthusiast)
    (
      'a3333333-3333-4333-8333-333333333333',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'andi.wijaya@example.com',
      _hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Andi Wijaya"}'::jsonb,
      now() - interval '60 days',
      now()
    ),
    -- Akun Penjual 3: Reza Pratama (Laptop Specialist)
    (
      'a4444444-4444-4444-8444-444444444444',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'reza.pratama@example.com',
      _hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Reza Pratama"}'::jsonb,
      now() - interval '45 days',
      now()
    ),
    -- Akun Mitra 1: Mitra Servis Resmi Jakarta
    (
      'b1111111-1111-4111-8111-111111111111',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'mitra.jakarta@example.com',
      _hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Mitra Servis Resmi Jakarta"}'::jsonb,
      now() - interval '120 days',
      now()
    ),
    -- Akun Mitra 2: Gadget Care Bandung
    (
      'b2222222-2222-4222-8222-222222222222',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'mitra.bandung@example.com',
      _hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Mitra Gadget Care Bandung"}'::jsonb,
      now() - interval '100 days',
      now()
    )
  on conflict (id) do update set
    encrypted_password  = excluded.encrypted_password,
    email_confirmed_at  = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
    raw_user_meta_data  = excluded.raw_user_meta_data,
    updated_at          = now();
end $$;

-- Update / upsert data profiles
insert into public.profiles (id, full_name, avatar_url, phone, role)
values
  ('a1111111-1111-4111-8111-111111111111', 'Budi Santoso', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80', '081234567890', 'user'),
  ('a2222222-2222-4222-8222-222222222222', 'Siti Rahmawati', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80', '081298765432', 'user'),
  ('a3333333-3333-4333-8333-333333333333', 'Andi Wijaya', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&h=200&q=80', '081377889900', 'user'),
  ('a4444444-4444-4444-8444-444444444444', 'Reza Pratama', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200&q=80', '081511223344', 'user'),
  ('b1111111-1111-4111-8111-111111111111', 'Mitra Servis Resmi Jakarta', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&h=200&q=80', '0215550192', 'mitra'),
  ('b2222222-2222-4222-8222-222222222222', 'Mitra Gadget Care Bandung', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&h=200&q=80', '0227770144', 'mitra')
on conflict (id) do update set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  phone = excluded.phone,
  role = excluded.role;

-- =====================================================================
-- 2. MARKET PRICES (DATABASE HARGA PASAR REFERENSI)
-- =====================================================================

insert into public.market_prices (category, brand, model, variant, retail_price, used_price_1y, used_price_2y, used_price_3y, source, is_demo)
values
  -- Apple Smartphones
  ('smartphone', 'Apple', 'iPhone 15 Pro', '128 GB · Natural Titanium', 20999000, 16500000, 14200000, 12000000, 'Market Aggregate 2026', true),
  ('smartphone', 'Apple', 'iPhone 15', '128 GB · Blue', 16499000, 12800000, 10500000, 8900000, 'Market Aggregate 2026', true),
  ('smartphone', 'Apple', 'iPhone 14 Pro', '128 GB · Deep Purple', 18999000, 14200000, 11800000, 9800000, 'Market Aggregate 2026', true),
  ('smartphone', 'Apple', 'iPhone 14', '128 GB · Starlight', 14999000, 10800000, 8900000, 7500000, 'Market Aggregate 2026', true),
  ('smartphone', 'Apple', 'iPhone 13', '128 GB · Midnight', 12999000, 8500000, 6800000, 5800000, 'Market Aggregate 2026', true),
  ('smartphone', 'Apple', 'iPhone 13 mini', '128 GB · Pink', 11999000, 7500000, 5800000, 4800000, 'Market Aggregate 2026', true),
  ('smartphone', 'Apple', 'iPhone 12', '64 GB · Black', 11999000, 6500000, 4900000, 3900000, 'Market Aggregate 2026', true),
  ('smartphone', 'Apple', 'iPhone 11', '64 GB · White', 8999000, 4800000, 3600000, 2800000, 'Market Aggregate 2026', true),

  -- Samsung Smartphones
  ('smartphone', 'Samsung', 'Galaxy S24 Ultra', '256 GB · Titanium Gray', 21999000, 17500000, 14800000, 12500000, 'Market Aggregate 2026', true),
  ('smartphone', 'Samsung', 'Galaxy S23 Ultra', '256 GB · Phantom Black', 19999000, 13800000, 11200000, 9200000, 'Market Aggregate 2026', true),
  ('smartphone', 'Samsung', 'Galaxy S23', '256 GB · Green', 13999000, 8200000, 6400000, 5200000, 'Market Aggregate 2026', true),
  ('smartphone', 'Samsung', 'Galaxy Z Flip 5', '256 GB · Mint', 15999000, 9800000, 7600000, 6100000, 'Market Aggregate 2026', true),
  ('smartphone', 'Samsung', 'Galaxy A54', '128 GB · Awesome Lime', 5999000, 3900000, 3100000, 2400000, 'Market Aggregate 2026', true),

  -- Google & Xiaomi
  ('smartphone', 'Google', 'Pixel 8 Pro', '128 GB · Obsidian', 16999000, 11900000, 9500000, 7900000, 'Market Aggregate 2026', true),
  ('smartphone', 'Xiaomi', 'Xiaomi 13T', '256 GB · Alpine Blue', 6499000, 4800000, 3700000, 2900000, 'Market Aggregate 2026', true),

  -- Apple Laptops
  ('laptop', 'Apple', 'MacBook Air M1', '8 GB / 256 GB · Space Gray', 15999000, 10500000, 8600000, 7200000, 'Market Aggregate 2026', true),
  ('laptop', 'Apple', 'MacBook Air M2', '8 GB / 256 GB · Midnight', 17999000, 12900000, 10800000, 9200000, 'Market Aggregate 2026', true),
  ('laptop', 'Apple', 'MacBook Pro M1', '8 GB / 512 GB · Silver', 21999000, 13500000, 11000000, 9500000, 'Market Aggregate 2026', true),
  ('laptop', 'Apple', 'MacBook Pro 14 M2 Pro', '16 GB / 512 GB · Space Gray', 31999000, 24000000, 20500000, 17800000, 'Market Aggregate 2026', true),

  -- Windows Laptops
  ('laptop', 'Lenovo', 'ThinkPad X1 Carbon Gen 9', '16 GB / 512 GB · Black', 24999000, 14500000, 11500000, 8900000, 'Market Aggregate 2026', true),
  ('laptop', 'Lenovo', 'IdeaPad Slim 3', '8 GB / 256 GB · Abyss Blue', 7499000, 5200000, 4100000, 3200000, 'Market Aggregate 2026', true),
  ('laptop', 'Dell', 'XPS 13 9310', '16 GB / 512 GB · Platinum Silver', 22999000, 13800000, 10900000, 8600000, 'Market Aggregate 2026', true),
  ('laptop', 'ASUS', 'ROG Zephyrus G14', '16 GB / 1 TB · Eclipse Gray', 26999000, 17500000, 14000000, 11500000, 'Market Aggregate 2026', true)
on conflict (category, lower(btrim(brand)), lower(btrim(model)), lower(btrim(variant))) do update set
  retail_price = excluded.retail_price,
  used_price_1y = excluded.used_price_1y,
  used_price_2y = excluded.used_price_2y,
  used_price_3y = excluded.used_price_3y,
  updated_at = now();

-- =====================================================================
-- 3. DEVICES (PERANGKAT DENGAN PASPOR DIGITAL)
-- =====================================================================

insert into public.devices (
  id,
  owner_id,
  passport_code,
  category,
  brand,
  model,
  variant,
  serial_number,
  imei,
  specifications,
  purchase_date,
  purchase_price,
  battery_health,
  physical_condition,
  photo_url,
  lock_status,
  trust_score,
  created_at
)
values
  -- Perangkat 1: iPhone 13 (Skor Tinggi, Terverifikasi Mitra)
  (
    'c1111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111',
    'DSP-ID-2023-IPH13-001',
    'smartphone',
    'Apple',
    'iPhone 13',
    '128 GB · Midnight',
    'FD9Z8K30MD6R',
    '351234567890482',
    '{"storage":"128 GB","ram":"4 GB","cpu":"Apple A15 Bionic","gpu":"Apple 4-Core GPU","os":"iOS 17.5","location":"Jakarta Selatan","accessories":"Kotak, charger 20W original, dan kabel C to Lightning","serviceDue":"2026-12-18","warrantyUntil":"2024-06-10","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2023-06-10',
    12999000,
    91,
    'like_new',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    92,
    now() - interval '60 days'
  ),

  -- Perangkat 2: MacBook Air M1 (Mulus, Riwayat Lengkap)
  (
    'c2222222-2222-4222-8222-222222222222',
    'a1111111-1111-4111-8111-111111111111',
    'DSP-ID-2022-MBA-M1-002',
    'laptop',
    'Apple',
    'MacBook Air M1',
    '8 GB / 256 GB · Space Gray',
    'C02D8K4Q6L41',
    null,
    '{"storage":"256 GB SSD","ram":"8 GB Unified","cpu":"Apple M1 8-Core","gpu":"7-Core GPU","os":"macOS Sonoma","location":"Bandung","accessories":"Fullset kotak, adapter 30W USB-C original, kabel MagSafe/Type-C","serviceDue":"2027-01-10","warrantyUntil":"2023-11-20","identityStatus":"checked","showLocation":true,"showPurchasePrice":false}'::jsonb,
    '2022-11-20',
    15999000,
    94,
    'like_new',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    89,
    now() - interval '50 days'
  ),

  -- Perangkat 3: Samsung Galaxy S23 (Lecet Halus, Baterai Prima)
  (
    'c3333333-3333-4333-8333-333333333333',
    'a3333333-3333-4333-8333-333333333333',
    'DSP-ID-2023-S23-003',
    'smartphone',
    'Samsung',
    'Galaxy S23',
    '256 GB · Green',
    'R5CW3018FJK',
    '351234567890483',
    '{"storage":"256 GB","ram":"8 GB","cpu":"Snapdragon 8 Gen 2 for Galaxy","gpu":"Adreno 740","os":"One UI 6.1 (Android 14)","location":"Surabaya","accessories":"Unit HP, kabel data C-to-C, dusbook resmi SEIN","serviceDue":"2026-10-05","warrantyUntil":"2024-05-15","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2023-05-15',
    13999000,
    88,
    'light_wear',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    78,
    now() - interval '40 days'
  ),

  -- Perangkat 4: iPhone 14 Pro (Like New, Titanium Feel)
  (
    'c4444444-4444-4444-8444-444444444444',
    'a3333333-3333-4333-8333-333333333333',
    'DSP-ID-2023-IPH14P-004',
    'smartphone',
    'Apple',
    'iPhone 14 Pro',
    '128 GB · Deep Purple',
    'H7K8L9M0N1P2',
    '352345678901234',
    '{"storage":"128 GB","ram":"6 GB","cpu":"Apple A16 Bionic","gpu":"Apple 5-Core GPU","os":"iOS 17.4","location":"Jakarta Barat","accessories":"Lengkap box garansi iBox, tempered glass terpasang, case Spigen","serviceDue":"2027-03-01","warrantyUntil":"2024-09-28","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2023-09-28',
    18999000,
    95,
    'like_new',
    'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    96,
    now() - interval '35 days'
  ),

  -- Perangkat 5: MacBook Pro M1 13" (Penyimpanan Besar 512GB)
  (
    'c5555555-5555-4555-8555-555555555555',
    'a4444444-4444-4444-8444-444444444444',
    'DSP-ID-2021-MBP-M1-005',
    'laptop',
    'Apple',
    'MacBook Pro M1',
    '8 GB / 512 GB · Silver',
    'C02XY9ZP1K99',
    null,
    '{"storage":"512 GB SSD","ram":"8 GB Unified","cpu":"Apple M1 8-Core","gpu":"8-Core GPU","os":"macOS Sonoma","location":"Tangerang Selatan","accessories":"Charger Apple 61W bawaan, dusbook","serviceDue":"2026-08-15","warrantyUntil":"2022-12-10","identityStatus":"checked","showLocation":true,"showPurchasePrice":false}'::jsonb,
    '2021-12-10',
    21999000,
    86,
    'light_wear',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    83,
    now() - interval '30 days'
  ),

  -- Perangkat 6: Samsung Galaxy A54 (Midrange Favorit)
  (
    'c6666666-6666-4666-8666-666666666666',
    'a1111111-1111-4111-8111-111111111111',
    'DSP-ID-2023-A54-006',
    'smartphone',
    'Samsung',
    'Galaxy A54',
    '128 GB · Awesome Lime',
    'R5CW7890ABC',
    '351234567890484',
    '{"storage":"128 GB","ram":"8 GB","cpu":"Exynos 1380","gpu":"Mali-G68 MP5","os":"One UI 6.0","location":"Yogyakarta","accessories":"Dusbook ori SEIN, kabel C-to-C, softcase bawaan","serviceDue":"2026-11-20","warrantyUntil":"2024-07-01","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2023-07-01',
    5999000,
    91,
    'like_new',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    81,
    now() - interval '25 days'
  ),

  -- Perangkat 7: ThinkPad X1 Carbon Gen 9 (Laptop Bisnis Tangguh)
  (
    'c7777777-7777-4777-8777-777777777777',
    'a4444444-4444-4444-8444-444444444444',
    'DSP-ID-2022-TP-X1-007',
    'laptop',
    'Lenovo',
    'ThinkPad X1 Carbon Gen 9',
    '16 GB / 512 GB · Black',
    'PF2X9Y8199',
    null,
    '{"storage":"512 GB NVMe SSD","ram":"16 GB LPDDR4x","cpu":"Intel Core i7-1165G7","gpu":"Intel Iris Xe","os":"Windows 11 Pro Original","location":"Jakarta Pusat","accessories":"Charger 65W ThinkPad Type-C original, tas laptop Lenovo","serviceDue":"2027-02-14","warrantyUntil":"2025-03-30","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2022-03-30',
    24999000,
    90,
    'like_new',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    94,
    now() - interval '20 days'
  ),

  -- Perangkat 8: iPhone 15 Pro (Flagship Terkini)
  (
    'c8888888-8888-4888-8888-888888888888',
    'a3333333-3333-4333-8333-333333333333',
    'DSP-ID-2024-IPH15P-008',
    'smartphone',
    'Apple',
    'iPhone 15 Pro',
    '128 GB · Natural Titanium',
    'J4M5N6P7Q8R9',
    '353456789012345',
    '{"storage":"128 GB","ram":"8 GB","cpu":"Apple A17 Pro (3nm)","gpu":"Apple 6-Core GPU Ray Tracing","os":"iOS 17.5.1","location":"Jakarta Selatan","accessories":"Fullset bawaan pabrik, nota Digimap asli, tempered glass Nilkin","serviceDue":"2027-06-01","warrantyUntil":"2025-02-10","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2024-02-10',
    20999000,
    99,
    'like_new',
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    98,
    now() - interval '18 days'
  ),

  -- Perangkat 9: Samsung Galaxy S24 Ultra (AI Flagship)
  (
    'c9999999-9999-4999-8999-999999999999',
    'a1111111-1111-4111-8111-111111111111',
    'DSP-ID-2024-S24U-009',
    'smartphone',
    'Samsung',
    'Galaxy S24 Ultra',
    '256 GB · Titanium Gray',
    'R5CW9912001',
    '354567890123456',
    '{"storage":"256 GB","ram":"12 GB","cpu":"Snapdragon 8 Gen 3 for Galaxy","gpu":"Adreno 750","os":"One UI 6.1 (Galaxy AI)","location":"Surabaya","accessories":"S-Pen original, kabel data type C bawaan, kotak ori garansi SEIN","serviceDue":"2027-05-15","warrantyUntil":"2025-03-01","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2024-03-01',
    21999000,
    98,
    'like_new',
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    95,
    now() - interval '15 days'
  ),

  -- Perangkat 10: Dell XPS 13 9310 (Layar InfinityEdge)
  (
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a4444444-4444-4444-8444-444444444444',
    'DSP-ID-2022-DELL-XPS-010',
    'laptop',
    'Dell',
    'XPS 13 9310',
    '16 GB / 512 GB · Platinum Silver',
    'DEL9912048XPS',
    null,
    '{"storage":"512 GB PCIe NVMe","ram":"16 GB 4267MHz LPDDR4x","cpu":"Intel Core i7-1185G7","gpu":"Intel Iris Xe","os":"Windows 11 Home","location":"Semarang","accessories":"Charger Dell 45W Type-C original, dongle USB-C to USB-A","serviceDue":"2026-09-10","warrantyUntil":"2023-10-15","identityStatus":"checked","showLocation":true,"showPurchasePrice":false}'::jsonb,
    '2022-04-12',
    22999000,
    87,
    'light_wear',
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    76,
    now() - interval '14 days'
  ),

  -- Perangkat 11: ASUS ROG Zephyrus G14 (Laptop Gaming Portabel)
  (
    'cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'a3333333-3333-4333-8333-333333333333',
    'DSP-ID-2023-ROG-G14-011',
    'laptop',
    'ASUS',
    'ROG Zephyrus G14',
    '16 GB / 1 TB · Eclipse Gray',
    'M4NRKD019827ROG',
    null,
    '{"storage":"1 TB NVMe SSD","ram":"16 GB DDR5","cpu":"AMD Ryzen 9 7940HS","gpu":"NVIDIA GeForce RTX 4060 8GB","os":"Windows 11 Home","location":"Malang","accessories":"Charger 240W original + Charger 100W PD Type-C, tas punggung ROG","serviceDue":"2027-04-20","warrantyUntil":"2025-06-20","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2023-06-20',
    26999000,
    93,
    'like_new',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    91,
    now() - interval '12 days'
  ),

  -- Perangkat 12: iPhone 12 (Budget Friendly, Ada Catatan Pemakaian)
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'a1111111-1111-4111-8111-111111111111',
    'DSP-ID-2021-IPH12-012',
    'smartphone',
    'Apple',
    'iPhone 12',
    '64 GB · Black',
    'DNPF89L0012A',
    '351234567890485',
    '{"storage":"64 GB","ram":"4 GB","cpu":"Apple A14 Bionic","gpu":"Apple 4-Core GPU","os":"iOS 17.2","location":"Depok","accessories":"Batangan unit HP + kabel pihak ketiga","serviceDue":"2025-12-01","warrantyUntil":"2022-05-10","identityStatus":"unknown","showLocation":true,"showPurchasePrice":false}'::jsonb,
    '2021-05-10',
    11999000,
    78,
    'damaged',
    'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    42,
    now() - interval '10 days'
  ),

  -- Perangkat 13: Samsung Galaxy Z Flip 5 (Foldable Stylish)
  (
    'cddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'a3333333-3333-4333-8333-333333333333',
    'DSP-ID-2023-ZFLIP5-013',
    'smartphone',
    'Samsung',
    'Galaxy Z Flip 5',
    '256 GB · Mint',
    'R5CW4455ZFL',
    '355678901234567',
    '{"storage":"256 GB","ram":"8 GB","cpu":"Snapdragon 8 Gen 2","gpu":"Adreno 740","os":"One UI 6.1","location":"Denpasar, Bali","accessories":"Kotak lengkap, casing transparan Samsung Ring, kabel bawaan","serviceDue":"2026-12-25","warrantyUntil":"2024-08-30","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2023-08-30',
    15999000,
    92,
    'like_new',
    'https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    88,
    now() - interval '8 days'
  ),

  -- Perangkat 14: MacBook Air M2 13.6" (Desain Flat Modern)
  (
    'ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'a4444444-4444-4444-8444-444444444444',
    'DSP-ID-2023-MBA-M2-014',
    'laptop',
    'Apple',
    'MacBook Air M2',
    '8 GB / 256 GB · Midnight',
    'H02M2MIDNIGHT9',
    null,
    '{"storage":"256 GB SSD","ram":"8 GB Unified","cpu":"Apple M2 8-Core","gpu":"8-Core GPU","os":"macOS Sonoma","location":"Jakarta Selatan","accessories":"Kotak resmi iBox, charger Dual Port 35W original, kabel braided MagSafe 3","serviceDue":"2027-08-10","warrantyUntil":"2024-11-15","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2023-11-15',
    17999000,
    97,
    'like_new',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    93,
    now() - interval '5 days'
  ),

  -- Perangkat 15: Xiaomi 13T (Leica Optics)
  (
    'cfffffff-ffff-4fff-8fff-ffffffffffff',
    'a1111111-1111-4111-8111-111111111111',
    'DSP-ID-2023-MI13T-015',
    'smartphone',
    'Xiaomi',
    'Xiaomi 13T',
    '256 GB · Alpine Blue',
    'XMI13TALP9921',
    '356789012345678',
    '{"storage":"256 GB","ram":"12 GB","cpu":"MediaTek Dimensity 8200-Ultra","gpu":"Mali-G610 MC6","os":"HyperOS (Android 14)","location":"Bogor","accessories":"Charger 67W HyperCharge original, case transparan, dus garansi resmi","serviceDue":"2026-10-10","warrantyUntil":"2025-01-20","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2023-10-20',
    6499000,
    94,
    'like_new',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    85,
    now() - interval '3 days'
  ),

  -- Perangkat 16: iPhone 13 mini (Unit Terjual / Riwayat Koleksi)
  (
    'c0000000-0000-4000-8000-000000000016',
    'a2222222-2222-4222-8222-222222222222', -- Sudah berpindah ke pembeli (Siti Rahmawati)
    'DSP-ID-2022-IPH13M-016',
    'smartphone',
    'Apple',
    'iPhone 13 mini',
    '128 GB · Pink',
    'F37G8H9J0K1L',
    '351234567890486',
    '{"storage":"128 GB","ram":"4 GB","cpu":"Apple A15 Bionic","gpu":"Apple 4-Core GPU","os":"iOS 17.4","location":"Jakarta Timur","accessories":"Unit dan kotak original","serviceDue":"2026-06-01","warrantyUntil":"2023-08-10","identityStatus":"checked","showLocation":true,"showPurchasePrice":true}'::jsonb,
    '2022-08-10',
    11999000,
    85,
    'light_wear',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80',
    'claimed_unlocked',
    84,
    now() - interval '90 days'
  )
on conflict (id) do update set
  owner_id = excluded.owner_id,
  brand = excluded.brand,
  model = excluded.model,
  variant = excluded.variant,
  specifications = excluded.specifications,
  purchase_price = excluded.purchase_price,
  battery_health = excluded.battery_health,
  physical_condition = excluded.physical_condition,
  photo_url = excluded.photo_url,
  trust_score = excluded.trust_score,
  lock_status = excluded.lock_status;

-- =====================================================================
-- 4. HISTORY RECORDS (RIWAYAT PASPOR DIGITAL DENGAN LEVEL L1, L2, L3)
-- =====================================================================
-- Aturan constraint database:
-- L1: verification_status = 'not_requested', evidence_url null / ada
-- L2: verification_status = 'not_requested' / 'pending', evidence_url wajib ada
-- L3: verification_status = 'verified', evidence_url wajib ada, verifier_id wajib ada, verified_at wajib ada
-- =====================================================================

insert into public.history_records (
  id,
  device_id,
  created_by,
  type,
  title,
  description,
  event_date,
  evidence_url,
  details,
  level,
  part_original,
  verification_status,
  verifier_id,
  verification_note,
  requested_at,
  verified_at,
  is_public
)
values
  -- Riwayat Device 1 (iPhone 13 - Budi Santoso)
  (
    'd1111111-1111-4111-8111-111111111111',
    'c1111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111',
    'purchase',
    'Pembelian Resmi iBox Grand Indonesia',
    'Unit dibeli dalam kondisi baru bergaransi resmi Apple Indonesia (TAM/iBox). Invoice fisik dan box lengkap.',
    '2023-06-10',
    'a1111111-1111-4111-8111-111111111111/invoice-ibox-2023.jpg',
    '{"retailer":"iBox Grand Indonesia","invoiceNumber":"INV-IBX-998120","warranty":"1 Year Official TAM"}'::jsonb,
    3,
    true,
    'verified',
    'b1111111-1111-4111-8111-111111111111',
    'Invoice resmi dan nomor seri telah dicocokkan dengan database garansi Apple. Valid.',
    now() - interval '55 days',
    now() - interval '54 days',
    true
  ),
  (
    'd1111111-1111-4111-8111-111111111112',
    'c1111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111',
    'battery',
    'Diagnostik Kesehatan Baterai (91%)',
    'Hasil pengujian siklus baterai menunjukkan 412 cycle count, retensi daya prima dan tidak ada throttling.',
    '2024-03-12',
    'a1111111-1111-4111-8111-111111111111/battery-diagnostic-report.jpg',
    '{"cycleCount":412,"healthPercent":91,"nominalCapacity":3240}'::jsonb,
    3,
    true,
    'verified',
    'b1111111-1111-4111-8111-111111111111',
    'Pengujian hardware diagnostik Apple AST2 berhasil. Baterai original dalam batas sehat normal.',
    now() - interval '50 days',
    now() - interval '49 days',
    true
  ),
  (
    'd1111111-1111-4111-8111-111111111113',
    'c1111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111',
    'service',
    'Inspeksi Menyeluruh Layar & Komponen',
    'Pemeriksaan True Tone, Face ID, respon sentuh, microphone, dan speaker stereo. Seluruh fungsi 100% normal.',
    '2024-04-05',
    'a1111111-1111-4111-8111-111111111111/full-inspection-certificate.jpg',
    '{"faceId":true,"trueTone":true,"touchResponsive":true,"speakerOk":true}'::jsonb,
    3,
    true,
    'verified',
    'b1111111-1111-4111-8111-111111111111',
    'Semua sensor biometrik dan layar asli tanpa pernah dibongkar pihak ketiga.',
    now() - interval '45 days',
    now() - interval '44 days',
    true
  ),

  -- Riwayat Device 2 (MacBook Air M1 - Budi Santoso)
  (
    'd2222222-2222-4222-8222-222222222221',
    'c2222222-2222-4222-8222-222222222222',
    'a1111111-1111-4111-8111-111111111111',
    'purchase',
    'Pembelian Pertama di Digimap Bandung',
    'Pembelian baru tangan pertama. Invoice kasir dan nomor seri match di situs Apple Coverage.',
    '2022-11-20',
    'a1111111-1111-4111-8111-111111111111/digimap-receipt-mba.jpg',
    '{"retailer":"Digimap Bandung Indah Plaza","pricePaid":15999000}'::jsonb,
    3,
    true,
    'verified',
    'b2222222-2222-4222-8222-222222222222',
    'Terverifikasi resmi. Serial C02D8K4Q6L41 terdaftar di garansi resmi Digimap.',
    now() - interval '40 days',
    now() - interval '39 days',
    true
  ),
  (
    'd2222222-2222-4222-8222-222222222222',
    'c2222222-2222-4222-8222-222222222222',
    'a1111111-1111-4111-8111-111111111111',
    'battery',
    'Cek Siklus Baterai (185 Cycle, 94%)',
    'Penggunaan mayoritas menggunakan adaptor daya dengan pembatas charging 80%, battery health terawat sangat baik.',
    '2024-02-18',
    'a1111111-1111-4111-8111-111111111111/coconut-battery-mba.jpg',
    '{"cycles":185,"health":94,"temperature":"28C"}'::jsonb,
    2,
    true,
    'not_requested',
    null,
    null,
    null,
    null,
    true
  ),

  -- Riwayat Device 3 (Samsung Galaxy S23 - Andi Wijaya)
  (
    'd3333333-3333-4333-8333-333333333331',
    'c3333333-3333-4333-8333-333333333333',
    'a3333333-3333-4333-8333-333333333333',
    'purchase',
    'Pembelian Samsung Experience Store Surabaya',
    'Unit resmi SEIN Indonesia dual nano SIM + eSIM aktif. Box asli dan struk pembelian ada.',
    '2023-05-15',
    'a3333333-3333-4333-8333-333333333333/samsung-store-surabaya-inv.jpg',
    '{"store":"Samsung Store Tunjungan Plaza"}'::jsonb,
    3,
    true,
    'verified',
    'b1111111-1111-4111-8111-111111111111',
    'IMEI 1 & 2 terdaftar di database Kemenperin dan CEIR. Kondisi hardware standar SEIN.',
    now() - interval '30 days',
    now() - interval '29 days',
    true
  ),
  (
    'd3333333-3333-4333-8333-333333333332',
    'c3333333-3333-4333-8333-333333333333',
    'a3333333-3333-4333-8333-333333333333',
    'damage',
    'Baret Halus Pemakaian di Bezel Samping',
    'Ada lecet mikro pada sudut kanan bawah akibat gesekan case debu, layar dan kamera mulus tanpa cacat.',
    '2023-11-10',
    null,
    '{"severity":"minor","location":"bottom-right bezel"}'::jsonb,
    1,
    true,
    'not_requested',
    null,
    null,
    null,
    null,
    true
  ),

  -- Riwayat Device 4 (iPhone 14 Pro - Andi Wijaya)
  (
    'd4444444-4444-4444-8444-444444444441',
    'c4444444-4444-4444-8444-444444444444',
    'a3333333-3333-4333-8333-333333333333',
    'purchase',
    'Pembelian iBox Senayan City Jakarta',
    'Pembelian unit baru varian Deep Purple 128GB. Bukti nota fisik dan nomor seri dicatat.',
    '2023-09-28',
    'a3333333-3333-4333-8333-333333333333/ibox-sency-invoice.jpg',
    '{"retailer":"iBox Senayan City"}'::jsonb,
    3,
    true,
    'verified',
    'b1111111-1111-4111-8111-111111111111',
    'Kamera Dynamic Island, sensor LiDAR, dan 120Hz ProMotion diuji normal 100%.',
    now() - interval '25 days',
    now() - interval '24 days',
    true
  ),

  -- Riwayat Device 7 (ThinkPad X1 Carbon - Reza Pratama)
  (
    'd7777777-7777-4777-8777-777777777771',
    'c7777777-7777-4777-8777-777777777777',
    'a4444444-4444-4444-8444-444444444444',
    'purchase',
    'Pengadaan Resmi Lenovo Indonesia (Premier Support)',
    'Unit laptop kerja enterprise bergaransi Lenovo Premier Onsite Warranty hingga 2025.',
    '2022-03-30',
    'a4444444-4444-4444-8444-444444444444/lenovo-po-support.jpg',
    '{"warrantyTier":"Lenovo Premier Support 3-Year"}'::jsonb,
    3,
    true,
    'verified',
    'b2222222-2222-4222-8222-222222222222',
    'Validasi barcode serial number dan status garansi aktif hingga Maret 2025.',
    now() - interval '18 days',
    now() - interval '17 days',
    true
  ),
  (
    'd7777777-7777-4777-8777-777777777772',
    'c7777777-7777-4777-8777-777777777777',
    'a4444444-4444-4444-8444-444444444444',
    'service',
    'Pembersihan Thermal Paste & Fan Internal',
    'Perawatan berkala di service center: fan dibersihkan dari debu dan penggantian thermal paste Arctic MX-4.',
    '2023-12-05',
    'a4444444-4444-4444-8444-444444444444/service-thermal-receipt.jpg',
    '{"temperatureAfter":"Max 68C full stress test"}'::jsonb,
    3,
    true,
    'verified',
    'b2222222-2222-4222-8222-222222222222',
    'Inspeksi motherboard bersih tanpa korosi, fan hening dan suhu stabil.',
    now() - interval '15 days',
    now() - interval '14 days',
    true
  ),

  -- Riwayat Device 8 (iPhone 15 Pro - Andi Wijaya)
  (
    'd8888888-8888-4888-8888-888888888881',
    'c8888888-8888-4888-8888-888888888888',
    'a3333333-3333-4333-8333-333333333333',
    'purchase',
    'Pembelian Digimap Central Park Mall',
    'Garansi aktif hingga Februari 2025. Faktur PPN resmi dan nota pembayaran lunas.',
    '2024-02-10',
    'a3333333-3333-4333-8333-333333333333/digimap-cp-faktur.jpg',
    '{"retailer":"Digimap CP","imeiMatched":true}'::jsonb,
    3,
    true,
    'verified',
    'b1111111-1111-4111-8111-111111111111',
    'Unit baru like-new. Status klaim garansi AppleCare terverifikasi.',
    now() - interval '12 days',
    now() - interval '11 days',
    true
  ),

  -- Riwayat Device 16 (iPhone 13 mini - Terjual ke Siti Rahmawati)
  (
    'd0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000016',
    'a1111111-1111-4111-8111-111111111111',
    'purchase',
    'Pembelian iBox Pondok Indah Mall',
    'Pembelian awal oleh Budi Santoso tahun 2022.',
    '2022-08-10',
    'a1111111-1111-4111-8111-111111111111/ibox-pim-nota.jpg',
    '{"originalOwner":"Budi Santoso"}'::jsonb,
    3,
    true,
    'verified',
    'b1111111-1111-4111-8111-111111111111',
    'Verifikasi riwayat pertama sebelum transaksi jual-beli.',
    now() - interval '90 days',
    now() - interval '89 days',
    true
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000016',
    'a2222222-2222-4222-8222-222222222222',
    'transfer',
    'Transfer Kepemilikan Digital Passport',
    'Paspor berpindah tangan melalui transaksi simulasi marketplace dari Budi Santoso ke Siti Rahmawati.',
    '2024-03-01',
    null,
    '{"previousOwner":"a1111111-1111-4111-8111-111111111111","newOwner":"a2222222-2222-4222-8222-222222222222","method":"marketplace_simulation"}'::jsonb,
    1,
    true,
    'not_requested',
    null,
    null,
    null,
    null,
    true
  )
on conflict (id) do nothing;

-- =====================================================================
-- 5. LISTINGS (PASAR JUAL-BELI TAYANG AKTIF & TERJUAL)
-- =====================================================================
-- Label harga terhitung otomatis via formula generated column:
-- price < estimated_min => 'cheap' (Murah)
-- price > estimated_max => 'expensive' (Mahal)
-- selain itu => 'fair' (Wajar)
-- =====================================================================

insert into public.listings (
  id,
  device_id,
  seller_id,
  title,
  description,
  price,
  estimated_min,
  estimated_max,
  estimated_base_price,
  passport_premium,
  ai_explanation,
  photos,
  status,
  created_at
)
values
  -- Listing 1: iPhone 13 (Aktif - Harga Wajar, Paspor Lengkap L3)
  (
    'e1111111-1111-4111-8111-111111111111',
    'c1111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111',
    'iPhone 13 128GB Midnight - Fullset iBox Terverifikasi Mitra L3',
    'Dijual santai iPhone 13 warna Midnight pemakaian pribadi tangan pertama. Kondisi fisik 98% mulus terpasang tempered glass dari hari pertama. Baterai sehat 91% tidak pernah drop. Paspor Digital lengkap dengan sertifikat inspeksi Mitra Servis Jakarta. Bonus case original Apple.',
    6000000,
    5800000,
    6400000,
    5800000,
    200000,
    '{"recommendation":"fair","summary":"Harga sangat bersahabat didukung skor paspor 92 dan verifikasi tingkat L3 dari Mitra Resmi. Baterai original 91% memberikan nilai premi paspor Rp200.000 di atas pasar biasa."}'::jsonb,
    '["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '7 days'
  ),

  -- Listing 2: MacBook Air M1 (Aktif - Harga Wajar / Rekomendasi)
  (
    'e2222222-2222-4222-8222-222222222222',
    'c2222222-2222-4222-8222-222222222222',
    'a1111111-1111-4111-8111-111111111111',
    'MacBook Air M1 2020 Space Gray 8/256GB Like New Mulus',
    'MacBook Air M1 ex kantor desain, pemakaian ringan ngetik dan browsing. Keyboard empuk, layar jernih tanpa dead pixel, trackpad responsif. Baterai masih 94% awet seharian. Kelengkapan fullset original.',
    8900000,
    8400000,
    9200000,
    8500000,
    400000,
    '{"recommendation":"fair","summary":"Estimasi harga pasar Rp8.500.000 dengan premi riwayat resmi Rp400.000 karena battery health 94% dan kepemilikan terdaftar."}'::jsonb,
    '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '6 days'
  ),

  -- Listing 3: Samsung Galaxy S23 (Aktif - Murah / Bargain)
  (
    'e3333333-3333-4333-8333-333333333333',
    'c3333333-3333-4333-8333-333333333333',
    'a3333333-3333-4333-8333-333333333333',
    'Samsung Galaxy S23 256GB Green SEIN - Butuh Dana Cepat',
    'Jual cepat Galaxy S23 kapasitas besar 256GB warna hijau segar. Garansi resmi SEIN, kamera tajam 50MP, layar Dynamic AMOLED 120Hz super smooth. Ada sedikit tanda pemakaian di bezel bawah, fungsi 100% aman.',
    5700000,
    6200000,
    6900000,
    6400000,
    150000,
    '{"recommendation":"bargain","summary":"Harga di bawah batas wajar pasar (Rp5.700.000 vs min Rp6.200.000). Sangat hemat untuk pembeli yang mencari performa Snapdragon 8 Gen 2."}'::jsonb,
    '["https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '5 days'
  ),

  -- Listing 4: iPhone 14 Pro (Aktif - Premium Eksklusif)
  (
    'e4444444-4444-4444-8444-444444444444',
    'c4444444-4444-4444-8444-444444444444',
    'a3333333-3333-4333-8333-333333333333',
    'iPhone 14 Pro 128GB Deep Purple iBox Skor Paspor 96 Tertinggi',
    'Unit kolektor Apple varian warna terfavorit Deep Purple. Kondisi 99% tanpa gores. Baterai super prima 95%. Seluruh bukti nota iBox dan pengecekan hardware mitra terverifikasi di paspor.',
    12500000,
    11500000,
    12400000,
    11800000,
    700000,
    '{"recommendation":"expensive","summary":"Harga berada pada tier premium karena skor kepercayaan 96 dan kondisi baterai 95% yang sangat langka untuk seri 14 Pro."}'::jsonb,
    '["https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '4 days'
  ),

  -- Listing 5: MacBook Pro M1 512GB (Aktif - Harga Wajar)
  (
    'e5555555-5555-4555-8555-555555555555',
    'c5555555-5555-4555-8555-555555555555',
    'a4444444-4444-4444-8444-444444444444',
    'MacBook Pro 13 M1 Touch Bar 8GB RAM 512GB SSD Silver',
    'MacBook Pro dengan Touch Bar interaktif dan storage lega 512GB. Baterai tahan lebih dari 15 jam kerja. Tidak ada penyok, speaker menggelegar, kipas aktif bikin render lancar jaya.',
    11500000,
    10500000,
    11800000,
    11000000,
    500000,
    '{"recommendation":"fair","summary":"Harga pas di rentang tengah pasar. Storage 512GB bawaan pabrik memberikan kenyamanan jangka panjang bagi pengguna kreatif."}'::jsonb,
    '["https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '4 days'
  ),

  -- Listing 6: Samsung Galaxy A54 (Aktif - Best Value)
  (
    'e6666666-6666-4666-8666-666666666666',
    'c6666666-6666-4666-8666-666666666666',
    'a1111111-1111-4111-8111-111111111111',
    'Samsung Galaxy A54 5G 8/128GB Awesome Lime Garansi SEIN',
    'HP harian andalan dengan sertifikasi tahan air IP67 dan baterai besar 5000mAh. Warna Awesome Lime kekinian. Dijual karena ganti ke S24.',
    3200000,
    3000000,
    3500000,
    3100000,
    100000,
    '{"recommendation":"fair","summary":"Harga stabil dan paspor terverifikasi satu tangan pertama."}'::jsonb,
    '["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '3 days'
  ),

  -- Listing 7: ThinkPad X1 Carbon Gen 9 (Aktif - Laptop Bisnis Premium)
  (
    'e7777777-7777-4777-8777-777777777777',
    'c7777777-7777-4777-8777-777777777777',
    'a4444444-4444-4444-8444-444444444444',
    'Lenovo ThinkPad X1 Carbon Gen 9 i7 16GB 512GB Garansi Premier 2025',
    'Laptop legendaris para profesional dan coder. Berat cuma 1.13 kg bodi carbon fiber standar militer MIL-STD-810H. Layar 16:10 nyaman untuk dokumen dan coding.',
    12800000,
    11500000,
    13200000,
    11800000,
    1000000,
    '{"recommendation":"fair","summary":"Skor paspor 94 dengan garansi resmi Lenovo Premier Support yang masih berjalan hingga 2025 memberikan jaminan tinggi."}'::jsonb,
    '["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '3 days'
  ),

  -- Listing 8: iPhone 15 Pro (Aktif - Natural Titanium)
  (
    'e8888888-8888-4888-8888-888888888888',
    'c8888888-8888-4888-8888-888888888888',
    'a3333333-3333-4333-8333-333333333333',
    'iPhone 15 Pro 128GB Natural Titanium Like New Baterai 99%',
    'Pemakaian baru 4 bulan sangat terawat. Garansi Digimap hingga awal 2025. Bodi titanium ringan dengan port USB-C universal.',
    16800000,
    16000000,
    17500000,
    16500000,
    300000,
    '{"recommendation":"fair","summary":"Kondisi nyaris sempurna dengan battery health 99% dan garansi distributor resmi aktif."}'::jsonb,
    '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '2 days'
  ),

  -- Listing 9: Samsung Galaxy S24 Ultra (Aktif - Galaxy AI)
  (
    'e9999999-9999-4999-8999-999999999999',
    'c9999999-9999-4999-8999-999999999999',
    'a1111111-1111-4111-8111-111111111111',
    'Samsung Galaxy S24 Ultra 12/256GB Titanium Gray SEIN Garansi Panjang',
    'Flagship monster Samsung dengan fitur Galaxy AI terupdate. Kamera zoom 100x dan layar anti-reflektif Gorilla Armor paling jernih di bawah sinar matahari.',
    17900000,
    17000000,
    18800000,
    17500000,
    400000,
    '{"recommendation":"fair","summary":"Unit resmi Indonesia dengan kelengkapan komplit dan status kepemilikan terverifikasi."}'::jsonb,
    '["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '2 days'
  ),

  -- Listing 10: Dell XPS 13 (Aktif - Bargain / Murah)
  (
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a4444444-4444-4444-8444-444444444444',
    'Dell XPS 13 9310 Intel i7 RAM 16GB SSD 512GB Layar FHD+ InfinityEdge',
    'Ultrabook premium terfavorit bagi pencinta portabilitas. Bodi aluminium CNC dan palm rest carbon fiber mewah.',
    10200000,
    10800000,
    12200000,
    11200000,
    0,
    '{"recommendation":"bargain","summary":"Harga di bawah estimasi terendah pasar untuk XPS seri i7 16GB. Kesempatan langka bagi yang mencari laptop tipis kencang."}'::jsonb,
    '["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '1 day'
  ),

  -- Listing 11: ASUS ROG Zephyrus G14 (Aktif - Gaming Portable)
  (
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'a3333333-3333-4333-8333-333333333333',
    'ASUS ROG Zephyrus G14 Ryzen 9 RTX 4060 16GB 1TB QHD+ 165Hz',
    'Laptop gaming 14 inci paling ringkas dan bertenaga. Cocok untuk arsitek, video editor 4K, dan gamer berat. Kondisi mulus bebas kendala.',
    17200000,
    16500000,
    18200000,
    17000000,
    200000,
    '{"recommendation":"fair","summary":"Harga kompetitif untuk laptop gaming RTX 4060 dengan histori pemakaian terawat."}'::jsonb,
    '["https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '1 day'
  ),

  -- Listing 12: Samsung Galaxy Z Flip 5 (Aktif - Flip Phone)
  (
    'eddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'cddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'a3333333-3333-4333-8333-333333333333',
    'Samsung Galaxy Z Flip 5 8/256GB Mint - Layar Lipat Aman Mulus',
    'Layar lipat tanpa lipatan mencolok, engsel Flex Hinge rapat dan kokoh. Flex Window luar lebar praktis untuk balas chat dan selfie tanpa buka HP.',
    8900000,
    8200000,
    9500000,
    8600000,
    300000,
    '{"recommendation":"fair","summary":"Harga wajar di kisaran pasar dengan kondisi engsel dan layar lipat telah terinspeksi normal."}'::jsonb,
    '["https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '12 hours'
  ),

  -- Listing 13: MacBook Air M2 (Aktif - Midnight Edition)
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'a4444444-4444-4444-8444-444444444444',
    'MacBook Air M2 8/256GB Midnight Garansi iBox Resmi Mulus 99%',
    'Unit favorit M2 Midnight. Baterai 97% tahan belasan jam. Kamera 1080p FaceTime HD bening untuk meeting Zoom. MagSafe 3 terpasang kuat.',
    13200000,
    12500000,
    13800000,
    12800000,
    400000,
    '{"recommendation":"fair","summary":"Skor paspor 93 dengan kondisi bodi midnight terawat minim sidik jari."}'::jsonb,
    '["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '6 hours'
  ),

  -- Listing 14: Xiaomi 13T (Aktif - Kamera Leica)
  (
    'efffffff-ffff-4fff-8fff-ffffffffffff',
    'cfffffff-ffff-4fff-8fff-ffffffffffff',
    'a1111111-1111-4111-8111-111111111111',
    'Xiaomi 13T 12/256GB Alpine Blue Kulit Sintetis - Lensa Leica Asli',
    'Smartphone fotografi hasil racikan Leica. Back cover kulit sintetis biru elegan tahan cipratan air IP68. Layar AMOLED CrystalRes 144Hz.',
    4700000,
    4400000,
    5100000,
    4600000,
    100000,
    '{"recommendation":"fair","summary":"Harga pas di tengah estimasi pasar untuk varian 12GB RAM."}'::jsonb,
    '["https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'active',
    now() - interval '2 hours'
  ),

  -- Listing 15: iPhone 13 mini (Sudah Terjual / Status 'sold')
  (
    'e0000000-0000-4000-8000-000000000015',
    'c0000000-0000-4000-8000-000000000016',
    'a1111111-1111-4111-8111-111111111111',
    'iPhone 13 mini 128GB Pink Terawat (Terjual via Simulasi)',
    'Listing riwayat transaksi sukses. Telah terjual ke Siti Rahmawati.',
    4500000,
    4400000,
    4900000,
    4500000,
    0,
    '{"recommendation":"fair","summary":"Transaksi selesai melalui simulasi pembelian."}'::jsonb,
    '["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'sold',
    now() - interval '30 days'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  estimated_min = excluded.estimated_min,
  estimated_max = excluded.estimated_max,
  estimated_base_price = excluded.estimated_base_price,
  passport_premium = excluded.passport_premium,
  ai_explanation = excluded.ai_explanation,
  photos = excluded.photos,
  status = excluded.status;

-- =====================================================================
-- 6. TRANSACTIONS (SIMULASI TRANSAKSI PEMBELIAN)
-- =====================================================================

insert into public.transactions (
  id,
  listing_id,
  buyer_id,
  seller_id,
  total_price,
  listing_snapshot,
  status,
  is_simulation,
  created_at,
  completed_at
)
values
  (
    'f0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000015',
    'a2222222-2222-4222-8222-222222222222', -- Pembeli: Siti Rahmawati
    'a1111111-1111-4111-8111-111111111111', -- Penjual: Budi Santoso
    4500000,
    '{
      "listing_id": "e0000000-0000-4000-8000-000000000015",
      "device_id": "c0000000-0000-4000-8000-000000000016",
      "title": "iPhone 13 mini 128GB Pink Terawat (Terjual via Simulasi)",
      "price": 4500000,
      "passport": {
        "brand": "Apple",
        "model": "iPhone 13 mini",
        "variant": "128 GB · Pink",
        "category": "smartphone",
        "battery_health": 85,
        "physical_condition": "light_wear",
        "trust_score": 84,
        "passport_code": "DSP-ID-2022-IPH13M-016"
      }
    }'::jsonb,
    'completed',
    true,
    now() - interval '25 days',
    now() - interval '25 days'
  )
on conflict (listing_id) do nothing;

-- =====================================================================
-- KEMBALIKAN TRIGGER SETELAH SEED SELESAI
-- =====================================================================
alter table public.history_records enable trigger guard_history_insert;
alter table public.devices enable trigger guard_device_update;

commit;

-- =====================================================================
-- INFORMASI SELESAI
-- =====================================================================
-- Data dummy berhasil ditambahkan:
-- - 6 Pengguna (4 Penjual/Pembeli + 2 Mitra Verifikasi Resmi)
-- - 24 Data Harga Pasar Referensi (Smartphones & Laptops)
-- - 16 Perangkat dengan Gambar HD Unsplash & Spesifikasi Lengkap
-- - 10+ Riwayat Paspor Digital (L1 Mandiri, L2 Bukti Nota, L3 Mitra Resmi)
-- - 15 Listing Marketplace (14 Aktif beragam kategori Murah/Wajar/Mahal + 1 Terjual)
-- - 1 Simulasi Transaksi Sukses
-- =====================================================================
