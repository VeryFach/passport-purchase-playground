# MVP Hackathon 24 Jam: Paspor Digital HP & Laptop Bekas

**Tagline:** "Carfax untuk HP dan laptop bekas." Setiap perangkat punya paspor digital berisi riwayat terverifikasi, sehingga pembeli yakin dan penjual jujur dapat harga lebih baik.

**Versi lengkap:** lihat `requirement.md`. Dokumen ini hanya mengambil yang perlu dibangun dan didemokan dalam 24 jam.

---

## 1. Masalah, Solusi, dan Nilai (ringkas untuk pitch)

| | |
|---|---|
| **Masalah** | Pembeli HP/laptop bekas tidak bisa memverifikasi kondisi asli (ganti part, baterai, riwayat servis). Penjual jujur tidak bisa membuktikan perangkatnya terawat, jadi dihargai sama dengan yang bermasalah. |
| **Akar masalah** | Informasi asimetris, riwayat tercecer (nota, WA), dokumen mudah dipalsukan, tidak ada standar penilaian. |
| **Solusi** | Paspor digital per perangkat: riwayat servis dan kondisi yang diberi **level kepercayaan** per data, ditambah **Trust Score** yang mudah dibaca. |
| **Pembeli dapat** | Keyakinan sebelum bayar, tahu apa yang sudah diganti, posisi tawar berbasis data. |
| **Penjual dapat** | Bukti perangkat terawat, listing otomatis dari paspor, laku lebih cepat dan lebih mahal. |

**Value Proposition (satu tabel)**

| Segmen | Pain utama | Pain reliever | Gain creator |
|---|---|---|---|
| Pembeli | Takut tertipu, tidak tahu part yang pernah diganti | Riwayat berlabel sumber + badge verifikasi | Trust Score, perbandingan harga wajar |
| Penjual | Dihargai sama dengan perangkat bermasalah | Paspor siap tayang, verifikasi mitra | Harga lebih tinggi, laku lebih cepat |

---

## 2. Scope MVP

### Dikerjakan (real)

1. Daftar dan masuk
2. Buat paspor perangkat (HP atau laptop)
3. Tambah catatan riwayat + unggah foto bukti
4. Level kepercayaan per catatan (L1, L2, L3) dan **Trust Score otomatis**
5. Simulasi verifikasi oleh mitra servis (peran "Mitra")
6. Listing dan halaman detail paspor (publik)
7. QR code paspor (tinggal dipindai di demo)
8. Beli dan transfer kepemilikan paspor
9. **Estimasi harga wajar** (rumus berbasis data pasar sampel + AI penjelas) dan label Murah/Wajar/Mahal pada listing

### Dipalsukan atau disimulasikan (cukup di demo)

| Fitur | Cara di MVP |
|---|---|
| Pembelian simulasi | Tombol "Beli" langsung menyelesaikan transaksi dan memindahkan kepemilikan paspor; tanpa pembayaran atau penahanan dana |
| Cek IMEI dan status kunci (iCloud/FRP) | Toggle manual dari penjual + label "klaim"; tampilkan sebagai ide integrasi |
| Diagnostik otomatis (baterai, SSD) | Input manual atau foto layar pengaturan |
| Verifikasi mitra | Akun `mitra` memverifikasi catatan yang diajukan pengguna hingga L3; tidak ada peran inspektur |
| KYC, chat, pemesanan pemeriksaan, rating, sengketa | Tidak dibuat; di luar MVP |
| Data harga pasar | Sampel manual 15-20 model, bukan data real-time dan bukan hasil scraping |

### Opsional (kalau waktu sisa, nilai plus untuk juri)

- **OCR nota dengan AI:** unggah foto nota, AI mengisi tanggal, toko, harga, dan jenis servis otomatis.
- **Deteksi anomali sederhana (aturan atau AI):** misalnya tanggal servis lebih awal dari tanggal beli, atau servis layar berulang.

---

## 3. Aktor

| Aktor | Peran di MVP |
|---|---|
| **Pengguna (user)** | Individu perorangan yang bisa mendaftarkan perangkatnya, mencatat riwayat, menjual (membuat listing), sekaligus mencari dan membeli perangkat dari pengguna lain. |
| **Mitra Servis** | Mitra Servis (mitra): Teknisi/tempat servis yang memverifikasi catatan perbaikan agar naik ke level L3. |

**Alur menjual:** buat paspor perangkat → lengkapi informasi dan riwayat → pilih **Jual perangkat** di Perangkat Saya → isi harga dan detail listing → tayangkan. Tidak ada langkah pendaftaran penjual atau toko.

**Model C2C:** hanya ada dua peran akun, yaitu `user` dan `mitra`. Pembeli dan penjual adalah aktivitas kontekstual, bukan peran akun. Tidak ada pendaftaran penjual, pendaftaran toko/merchant, aplikasi seller, manajemen toko, atau pergantian mode pembeli/penjual. Setiap `user` dapat membeli dan menjual dengan akun yang sama; otorisasi menjual ditentukan oleh kepemilikan perangkat. Akun `mitra` dibatasi untuk alur verifikasi dan tidak dapat membeli atau menjual.

---

## 4. Functional Requirements (Must-have saja)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-01 | Pengguna dapat mendaftar dan masuk (email + password atau magic link) | Must |
| FR-02 | Pemilik membuat paspor: jenis (HP/laptop), merek, model, serial/IMEI, tahun beli, harga beli, foto | Must |
| FR-03 | Pemilik menambah catatan riwayat: tipe (pembelian, servis, ganti part, baterai, kerusakan), tanggal, deskripsi, foto bukti | Must |
| FR-04 | Setiap catatan punya level: **L1** klaim, **L2** berdokumen (ada foto bukti), **L3** terverifikasi mitra | Must |
| FR-05 | Mitra dapat memverifikasi catatan, levelnya naik ke L3 | Must |
| FR-06 | Sistem menghitung **Trust Score (0-100)** otomatis dari isi paspor | Must |
| FR-07 | Pemilik dapat mempublikasikan paspor sebagai listing dengan harga | Must |
| FR-08 | Pembeli melihat daftar listing (filter jenis, rentang harga, skor minimum) | Must |
| FR-09 | Halaman detail menampilkan paspor: spesifikasi, timeline riwayat, badge level per catatan, Trust Score | Must |
| FR-10 | Pembeli menekan "Beli": transaksi simulasi langsung berstatus selesai, listing menjadi terjual, dan kepemilikan paspor pindah sekali secara atomik | Must |
| FR-11 | Setiap paspor punya QR code yang membuka halaman detailnya | Should |
| FR-12 | Unggah nota, AI mengekstrak data otomatis (OCR) | Could |
| FR-13 | Peringatan anomali pada paspor (tanggal janggal, servis berulang) | Could |
| FR-14 | Sistem menghitung estimasi harga wajar (rentang) dari harga dasar pasar (tabel sampel) × faktor kondisi × premi Trust Score | Should |
| FR-15 | AI menjelaskan estimasi (2-3 alasan singkat, format JSON); pagar pengaman membatasi hasil AI maksimal ±15% dari hasil rumus, dan jika AI gagal sistem memakai hasil rumus | Should |
| FR-16 | Listing menampilkan label **Murah / Wajar / Mahal** dan "nilai tambah paspor" (selisih harga akibat premi Trust Score) | Should |
| FR-17 | Pengguna dapat membandingkan maksimal tiga perangkat | Should |

---

## 5. Trust Score dan Estimasi Harga

### 5.1 Trust Score (aturan sederhana)

Total 100 poin, dihitung dari isi paspor:

| Komponen | Poin | Kondisi |
|---|---|---|
| Identitas lengkap | 20 | Serial/IMEI dan foto terisi |
| Bukti pembelian | 15 | Ada catatan pembelian dengan foto nota |
| Kondisi baterai | 15 | Ada catatan baterai (L2 atau lebih) |
| Riwayat servis terdokumentasi | 20 | Maks 20: 5 poin per catatan servis ber-bukti (maksimal 4) |
| Verifikasi mitra | 20 | Maks 20: 10 poin per catatan L3 (maksimal 2) |
| Status kunci bersih | 10 | Penjual menyatakan iCloud/FRP/MDM bebas |

**Badge:** 0-39 *Dasar*, 40-69 *Berdokumen*, 70-100 *Terpercaya*.

Aturan tambahan: catatan L1 tampil dengan label "Klaim penjual" dan tidak menambah skor.

### 5.2 Estimasi Harga (Rumus + AI)

**Prinsip:** harga dasar berasal dari data pasar yang kita sediakan, bukan dari ingatan AI. **Rumus yang menghitung angka, AI yang menjelaskan** dan boleh menyesuaikan sedikit dalam batas aman.

**Alur**

| Langkah | Proses |
|---|---|
| 1 | Ambil harga dasar dari tabel `market_prices` berdasarkan model dan usia perangkat (dari `tahun_beli`) |
| 2 | Kalikan dengan faktor kondisi (baterai, part non-original, kondisi fisik) |
| 3 | Tambahkan premi Trust Score |
| 4 | Kirim data terstruktur dan hasil rumus ke AI; AI mengembalikan rentang dan alasan dalam JSON |
| 5 | Pagar pengaman: bila hasil AI di luar ±15% dari hasil rumus atau format salah, pakai hasil rumus |
| 6 | Simpan hasil di listing, lalu hitung label Murah / Wajar / Mahal |

**Rumus**

```
harga_estimasi = harga_dasar_usia
               × faktor_baterai     (>=90% = 1.00 | 80-89% = 0.95 | <80% = 0.88)
               × faktor_part        (tiap part utama non-original = 0.92)
               × faktor_fisik       (mulus 1.00 | lecet ringan 0.96 | retak/penyok 0.85)
               × (1 + premi_trust)  (Trust Score 70+ = +6% | 40-69 = +3% | <40 = 0%)

rentang = harga_estimasi ± 7%
nilai_tambah_paspor = (harga_dasar_usia × faktor_baterai × faktor_part × faktor_fisik) × premi_trust
```

Angka faktor di atas hanya titik awal. Sesuaikan dengan data sampel yang dikumpulkan tim.

**Contoh perhitungan (angka ilustrasi):** HP berusia 3 tahun dengan harga dasar Rp 6.000.000, baterai 91%, semua part original, lecet ringan, Trust Score 78.

```
6.000.000 × 1.00 × 1.00 × 0.96 × 1.06 = Rp 6.105.600
Rentang          : Rp 5,68 jt - Rp 6,53 jt
Nilai tambah paspor: sekitar Rp 346 rb
```

**Label di listing**

| Kondisi harga minta | Label |
|---|---|
| Di bawah batas bawah rentang | Murah |
| Di dalam rentang | Wajar |
| Di atas batas atas rentang | Mahal |

**Contoh output AI (JSON)**

```json
{
  "harga_min": 5700000,
  "harga_max": 6500000,
  "alasan": [
    "Baterai 91% termasuk sehat untuk usia 3 tahun",
    "Ganti layar original terverifikasi mitra menambah kepercayaan",
    "Lecet ringan menurunkan harga sedikit"
  ],
  "peringatan": null
}
```

**Tabel `market_prices` (diisi manual, 15-20 model populer)**

| Kolom | Isi |
|---|---|
| jenis, merek, model, varian | Contoh: HP / merek / seri / kapasitas, atau laptop / merek / seri / RAM-SSD |
| harga_baru | Harga baru saat rilis atau saat ini |
| harga_bekas_1th, harga_bekas_2th, harga_bekas_3th | Median harga bekas dari pengamatan manual di marketplace |
| catatan_sumber, updated_at | Dari mana dan kapan data diambil |

Usia di antara titik data dihitung dengan interpolasi sederhana.

---

## 6. Model Data (6 tabel)

| Tabel | Kolom utama |
|---|---|
| **profiles** | id, nama, role (`user` / `mitra`, default `user`) |
| **devices** | id, owner_id, jenis, merek, model, serial_imei, tahun_beli, harga_beli, foto_url, kunci_bersih (bool), battery_health (%), kondisi_fisik (`mulus` / `lecet` / `rusak`), trust_score |
| **history_records** | id, device_id, tipe, tanggal, deskripsi, bukti_url, level (1/2/3), part_original (bool, untuk catatan ganti part), verified_by, created_at |
| **listings** | id, device_id, seller_id, harga, estimasi_min, estimasi_max, nilai_tambah_paspor, alasan_ai (JSON), label_harga, status (`aktif` / `terjual`), buyer_id, created_at |
| **transactions** | id, listing_id, buyer_id, seller_id, total_price, listing_snapshot, status, is_simulation, created_at |
| **market_prices** | id, jenis, merek, model, varian, harga_baru, harga_bekas_1th, harga_bekas_2th, harga_bekas_3th, catatan_sumber, updated_at |

`buyer_id` dan `seller_id` adalah kolom konteks transaksi/listing, bukan peran akun. Tidak ada tabel toko, merchant, penjual, atau pembeli tambahan.

**Catatan:** riwayat kepemilikan cukup dicatat lewat `listings` (seller dan buyer). Foto disimpan di storage. Trust Score dihitung ulang tiap catatan berubah (fungsi di server atau trigger database). Estimasi harga dihitung di server (API route) supaya kunci API AI tidak terekspos di browser, dan hasilnya disimpan di `listings` agar tidak dihitung ulang setiap halaman dibuka.

---

## 7. Tech Stack (usulan, pilih yang tim kuasai)

| Lapisan | Pilihan |
|---|---|
| Frontend | Next.js (React) + Tailwind, responsif untuk ponsel |
| Backend + DB + Auth + Storage | Supabase (Postgres, Auth, Storage, Row Level Security) |
| QR code | Library `qrcode` |
| Estimasi harga + penjelasan AI | Rumus di server (API route Next.js) + panggilan API model AI dengan output JSON; kunci API disimpan di environment variable server |
| OCR/anomali (opsional) | Panggilan API ke model AI dengan input foto nota |
| Deploy | Vercel |

---

## 8. Layar yang Dibuat (7 saja)

1. Login/Daftar
2. Beranda: daftar listing + filter
3. Detail Paspor (inti demo): spesifikasi, Trust Score, timeline riwayat, estimasi harga + label Murah/Wajar/Mahal + nilai tambah paspor, tombol Beli
4. Perangkat Saya: daftar paspor milik pengguna
5. Buat/Edit Paspor + tambah catatan
6. Buat Listing (menampilkan harga disarankan dan alasan AI)
7. Dasbor Mitra: daftar catatan menunggu verifikasi

---

## 9. Rencana Kerja 24 Jam

| Jam | Fokus | Hasil |
|---|---|---|
| 0-2 | Sepakati scope, alur demo, pembagian tugas, setup repo dan Supabase | Skema DB + auth siap |
| 2-8 | CRUD paspor dan riwayat, unggah foto, level L1/L2 | Paspor bisa dibuat dan diisi |
| 8-12 | Trust Score, peran Mitra + verifikasi L3 | Skor dan badge berfungsi |
| 12-17 | Listing, beranda + filter, halaman detail, tombol Beli dan transfer | Alur end-to-end jalan |
| 17-20 | Estimasi harga: rumus, panggilan AI + pagar pengaman, label di UI | Harga disarankan dan label tampil |
| 20-22 | QR code, polesan UI, data dummy (5-8 perangkat dengan cerita beragam) | Siap didemokan |
| 22-24 | Bug fixing, latihan demo, slide pitch. Opsional bila ada sisa waktu: OCR nota atau deteksi anomali | Siap tampil |

**Pembagian tim (contoh 3-4 orang):** frontend UI, backend/Supabase dan logika skor, estimasi harga/AI (termasuk mengisi `market_prices` sejak jam 2-8 secara paralel), serta pitch dan data dummy.

---

## 10. Skenario Demo (3-4 menit)

1. **Masalah (30 dtk):** "Dua iPhone, harga sama. Mana yang terawat?"
2. **Penjual (60 dtk):** Buat paspor, tambah catatan ganti baterai dengan foto nota, lalu Mitra memverifikasinya. Trust Score naik secara langsung, dan harga disarankan ikut naik lengkap dengan alasan dari AI.
3. **Pembeli (60 dtk):** Pindai QR atau buka listing, lihat timeline riwayat dan badge level. Bandingkan unit ber-skor tinggi dan rendah; label Murah/Wajar/Mahal langsung menunjukkan apakah harga minta masuk akal.
4. **Transaksi (30 dtk):** Tekan "Beli", paspor pindah kepemilikan.
5. **Penutup (30 dtk):** Roadmap singkat: integrasi service center, diagnostik otomatis, cek IMEI, pembayaran terkelola, kategori lain.

**Siapkan data dummy:** satu unit "bersih dan terverifikasi" (skor tinggi), satu unit "banyak klaim tanpa bukti" (skor rendah), dan satu unit dengan anomali (jika fitur opsional dibuat).

---

## 11. Batasan Sistem

Dokumen ini jujur soal apa yang **tidak** dilakukan MVP. Batasan ini juga bahan jawaban saat juri bertanya.

### 11.1 Batasan Fungsional

- Tidak memproses pembayaran, menahan/melepas dana, refund, atau mengelola masa tinjau; tombol "Beli" langsung menyelesaikan transaksi simulasi, menandai listing terjual, dan memindahkan kepemilikan paspor.
- Tidak mengecek IMEI maupun status iCloud/FRP/MDM ke sumber resmi; status kunci adalah pernyataan penjual.
- Tidak membaca data diagnostik dari perangkat; persentase baterai dan kondisi fisik diinput manual.
- Tidak ada chat, rating, sengketa, KYC, pengiriman, maupun garansi.
- Hanya mencakup HP dan laptop, satu bahasa (Indonesia), berupa web responsif (bukan aplikasi native).

### 11.2 Batasan Data dan Verifikasi

- **L1 (klaim)** dan **L2 (berdokumen)** tidak membuktikan keaslian. L2 hanya berarti ada foto bukti.
- **L3** hanya sekuat mitra yang memverifikasi; di MVP mitra adalah akun demo (simulasi), bukan service center sungguhan.
- Sistem tidak mendeteksi nota palsu. Fitur anomali (opsional) hanya memeriksa kewajaran, misalnya urutan tanggal.
- Trust Score menunjukkan kelengkapan dan tingkat kepercayaan data, **bukan jaminan kondisi fisik** perangkat.

### 11.3 Batasan Estimasi Harga

- Data harga pasar adalah **sampel manual** (15-20 model) dan cepat usang; bukan data real-time.
- Model yang tidak ada di `market_prices` tidak diestimasi; sistem menampilkan "belum didukung" dan AI tidak boleh menebak harga dasar.
- Hasil berupa **rentang indikatif**, bukan penilaian resmi dan bukan jaminan barang laku di harga tersebut.
- Faktor kondisi dan premi Trust Score adalah asumsi awal yang belum dikalibrasi dengan data transaksi nyata. Ini **bukan model machine learning terlatih**.
- AI hanya menjelaskan dan menyesuaikan maksimal ±15% dari hasil rumus. Bila AI lambat, gagal, atau formatnya salah, sistem memakai hasil rumus dengan alasan templat.
- Estimasi belum memperhitungkan lokasi, promo/musim, kelengkapan kotak dan aksesori, warna, atau kelangkaan varian.

### 11.4 Batasan Keamanan, Privasi, dan Hukum

- Keamanan dasar saja: autentikasi dan Row Level Security Supabase. Belum ada audit keamanan atau rate limiting.
- Halaman paspor publik tidak menampilkan data pribadi pemilik, dan serial/IMEI ditampilkan sebagian (disamarkan).
- Belum memenuhi kepatuhan penuh UU Pelindungan Data Pribadi, perlindungan konsumen, atau regulasi marketplace; ini prototipe.
- Perangkat curian atau terblokir tidak dapat dideteksi selain lewat pernyataan penjual.

### 11.5 Batasan Teknis dan Demo

- Data yang tampil adalah data dummy untuk demo, bukan data produksi.
- Dirancang untuk puluhan pengguna dan ratusan data di paket gratis (Supabase/Vercel); tidak diuji beban.
- Membutuhkan koneksi internet; tidak ada mode offline.
- Bergantung pada layanan AI pihak ketiga: ada latensi beberapa detik, biaya per panggilan, dan hasil bisa berbeda antar panggilan (karena itu hasil disimpan di `listings`).
- Unggahan foto dibatasi format JPG/PNG dan ukuran maksimal sekitar 5 MB.

### 11.6 Cara Menyampaikan ke Juri

Pisahkan dengan jelas: **yang nyata** (alur paspor, level kepercayaan, Trust Score, estimasi harga, transfer kepemilikan) dan **yang disimulasikan** (mitra, pembayaran, cek IMEI/kunci, data harga pasar). Lalu tunjukkan roadmap untuk mengganti simulasi menjadi integrasi sungguhan.

---

## 12. Risiko Hackathon dan Cara Mengatasinya

| Risiko | Mitigasi |
|---|---|
| Scope melebar | Patuhi daftar "Dikerjakan" dan "Dipalsukan"; fitur opsional baru disentuh setelah alur utama jalan |
| Juri bertanya soal pemalsuan data | Jawab dengan hierarki level L1-L3 dan rencana integrasi mitra serta diagnostik otomatis |
| Juri bertanya soal model bisnis | Komisi transaksi, biaya verifikasi mitra, dan langganan untuk reseller |
| Demo bermasalah | Siapkan data dummy dan rekaman cadangan alur demo |
| Juri meragukan akurasi estimasi harga | Jelaskan: harga dasar dari data pasar sampel, AI hanya menyesuaikan maksimal ±15%, hasil berupa rentang; roadmap: kalibrasi dengan data transaksi nyata |
| API AI lambat atau gagal saat demo | Fallback otomatis ke hasil rumus; simpan estimasi yang sudah dihitung agar demo tidak bergantung pada panggilan langsung |

---

## 13. Kriteria Selesai (Definition of Done)

- [ ] Pengguna dapat login, membuat paspor, dan menambah catatan beserta foto
- [ ] Mitra dapat memverifikasi catatan dan Trust Score berubah
- [ ] Listing tampil di beranda dan detail paspor menampilkan timeline serta badge level
- [ ] Tombol Beli memindahkan kepemilikan
- [ ] Estimasi harga (rentang + alasan) tampil di form listing, dan label Murah/Wajar/Mahal tampil di listing
- [ ] `market_prices` terisi minimal 10 model dan fallback ke rumus berfungsi saat AI gagal
- [ ] Aplikasi ter-deploy dan dapat dibuka dari ponsel
- [ ] Data dummy dan slide pitch siap
