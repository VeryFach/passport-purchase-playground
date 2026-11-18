# Paspor Digital: Panduan UI/UX Frontend

*MVP Hackathon 24 jam · fokus frontend · 18 November 2026*

## 1. Lingkup dan tujuan

Dokumen ini khusus untuk tim frontend: pengalaman pengguna, tampilan, interaksi, komponen, dan struktur kode sisi klien. Logika Trust Score dan estimasi harga dianggap dependensi; frontend hanya menerima data yang sudah jadi. Dengan kontrak data di bagian 7 dan data mock di bagian 14, frontend bisa bekerja paralel dengan backend sejak jam pertama.

Lima prinsip UX:

1. **Kepercayaan terlihat dalam 3 detik.** Skor, badge, dan label harga selalu berada di bagian atas kartu dan halaman detail.
2. **Bukti selalu kelihatan.** Setiap catatan menampilkan level dan thumbnail bukti.
3. **Satu aksi utama per layar.**
4. **Progres terlihat.** Penjual selalu tahu apa yang menaikkan skor.
5. **Tidak ada layar kosong atau error mentah.** Setiap state dirancang (bagian 10).

## 2. Pengguna dan konteks pakai

| Peran | Perangkat utama | Kebutuhan utama | Implikasi desain |
| --- | --- | --- | --- |
| Pembeli | Ponsel | Menilai cepat apakah unit layak dipercaya | Skor dan label harga di atas, timeline mudah dipindai |
| Penjual | Ponsel | Mengisi data dan memotret bukti | Form pendek, kamera langsung, checklist skor |
| Mitra | Laptop atau tablet | Memeriksa bukti lalu memverifikasi | Tampilan split, foto bukti besar, satu klik |
| Juri (demo) | Proyektor dan ponsel | Melihat alur ujung ke ujung | Animasi skor jelas, tidak ada layar kosong |

## 3. Arsitektur informasi dan navigasi

| Route | Layar | Akses |
| --- | --- | --- |
| `/login` | Login / Daftar | Publik |
| `/` | Beranda (daftar listing + filter) | Publik |
| `/p/[id]` | Detail Paspor (target QR) | Publik |
| `/devices` | Perangkat Saya | Login |
| `/devices/new` | Isi Paspor (baru) | Login |
| `/devices/[id]` | Isi Paspor (edit + catatan) | Pemilik |
| `/devices/[id]/listing` | Buat Listing | Pemilik |
| `/mitra` | Dasbor Mitra | Peran mitra |

Aturan navigasi:

- Ponsel: bottom nav tiga item (Beranda, Perangkat Saya, Akun). Mitra: dua item (Dasbor, Akun). Tombol tambah (+) melayang di Perangkat Saya.
- Desktop: top bar dengan item yang sama, lebar konten maksimal 1120 px.
- Halaman publik tanpa login memakai header minimal (logo dan tombol Masuk).
- Setelah login: peran mitra ke `/mitra`, peran lain ke `/`. Halaman yang butuh login mengarahkan ke `/login?next=...` lalu kembali ke tujuan semula.
- Layar turunan selalu punya tombol kembali di kiri atas.

## 4. Alur pengguna (alur demo)

| # | Pengguna | Aksi | Respons UI |
| --- | --- | --- | --- |
| 1 | Penjual | Tekan Masuk cepat: Penjual | Masuk ke Perangkat Saya |
| 2 | Penjual | Buat paspor, isi identitas, unggah foto | Preview foto langsung; checklist skor menandai Identitas lengkap |
| 3 | Penjual | Tambah catatan ganti baterai dengan foto nota | Chip level berubah dari Klaim penjual ke Berdokumen; poin di checklist naik |
| 4 | Mitra | Masuk cepat: Mitra, buka catatan di antrian, tekan Verifikasi | Cap muncul, item hilang dari antrian, toast konfirmasi |
| 5 | Penjual | Kembali ke Detail Paspor | Ring skor beranimasi naik, badge berubah, toast skor naik |
| 6 | Penjual | Buat listing | Rentang harga dari rumus tampil instan, alasan AI menyusul; harga disarankan sudah memakai skor baru |
| 7 | Pembeli | Scan QR atau buka dari Beranda | Detail Paspor publik terbuka tanpa login |
| 8 | Pembeli | Tekan Beli | Sheet konfirmasi, lalu layar sukses; paspor muncul di Perangkat Saya |

## 5. Wireframe

### 5.1 Detail Paspor (ponsel, layar inti)

```text
+--------------------------------+
| <  Paspor Digital       [Masuk]|
+--------------------------------+
| [        foto perangkat      ] |
| iPhone 13 · 128 GB             |
| Rp 6.000.000        [• Wajar]  |
+--------------------------------+
|  (78)   TERPERCAYA             |
|  ring   Skor Kepercayaan       |
|         Paspor menambah ±Rp 346 rb |
| Skor kelengkapan data, bukan   |
| jaminan kondisi fisik          |
+--------------------------------+
| Harga wajar                    |
| |----[=======o=======]----|    |
| Rp 5,68 jt          Rp 6,53 jt |
| · Baterai 91% sehat            |
| · Layar original terverifikasi |
| Dihitung dari rumus dan data   |
| pasar sampel, dijelaskan AI    |
+--------------------------------+
| Riwayat                        |
| o- Ganti baterai [Terverifikasi Mitra] |
| |   12 Mar 2025  [thumb] (cap) |
| o- Servis layar  [Berdokumen]  |
| o- Pembelian     [Klaim penjual] |
+--------------------------------+
| Spesifikasi    Serial 35••••482|
| [ Lihat QR ]                   |
+--------------------------------+
| [        Beli sekarang       ] |  <- sticky
+--------------------------------+
```

Catatan perilaku:

- Urutan blok tidak boleh berubah: kepercayaan lebih dulu, harga kedua, riwayat ketiga.
- Mode pemilik: tombol sticky menjadi Tambah catatan dan Buat listing. Mode terjual: banner Terjual dan tombol nonaktif.
- Desktop: dua kolom. Kiri: foto, spesifikasi, QR. Kanan: skor, harga, timeline. Tombol Beli sticky di kolom kanan.

### 5.2 Beranda (ponsel)

```text
+--------------------------------+
| Paspor Digital         [Masuk] |
| [Semua] [HP] [Laptop]  [Filter]|
| Skor minimum  0 ---o--- 100    |
+--------------------------------+
| +----------------------------+ |
| | [foto]  iPhone 13 128 GB   | |
| |         Rp 6.000.000       | |
| |  (78)   [• Wajar]          | |
| |  2 catatan terverifikasi   | |
| +----------------------------+ |
| +----------------------------+ |
| | [foto]  Galaxy A54         | |
| |  (31)   [↓ Murah]          | |
| |  Belum ada yang terverifikasi |
| +----------------------------+ |
| [Beranda] [Perangkat] [Akun]   |
+--------------------------------+
```

Kartu dengan skor tinggi dan rendah harus tampak jelas berbeda saat berdampingan, karena momen ini dipakai di demo. Filter di ponsel dibuka sebagai bottom sheet; di desktop berupa baris chip di atas grid.

### 5.3 Isi Paspor

- Tiga seksi berurutan: Identitas, Kondisi, Riwayat. Di ponsel seksi diberi stepper ringan (tanpa halaman terpisah) supaya form tidak terasa panjang.
- ScoreChecklist sticky: bar ringkas di atas pada ponsel (ketuk untuk membuka daftar), kolom kanan pada desktop. Setiap item memuat nama, poin, dan status (selesai atau belum).
- Tambah catatan memakai bottom sheet: chip tipe, tanggal, deskripsi, unggah foto, dan indikator level yang berubah real-time.
- Tombol Simpan sticky di bawah.

### 5.4 Buat Listing (ponsel)

```text
+--------------------------------+
| <  Buat Listing                |
| iPhone 13 128 GB · Skor 78     |
+--------------------------------+
| Harga disarankan               |
| Rp 5,68 jt - Rp 6,53 jt        |
| [ Pakai harga tengah ]         |
| · Baterai 91% sehat            |
| · Layar original terverifikasi |
| Estimasi indikatif             |
+--------------------------------+
| Harga minta                    |
| Rp [ 6.200.000 ]               |
| |---[======o======]---|        |
| Label:  [• Wajar]              |
+--------------------------------+
| [         Tayangkan          ] |
+--------------------------------+
```

### 5.5 Dasbor Mitra (desktop)

```text
+------------------------------------------------------------+
| Dasbor Mitra                                   Mitra Demo  |
+---------------------+--------------------------------------+
| Menunggu (3)        | Ganti baterai · iPhone 13            |
| > Ganti baterai     | 12 Mar 2025                          |
|   iPhone 13         | Deskripsi: ...                       |
|   Servis layar      | Serial 35••••482                     |
|   Galaxy A54        | +----------------------------------+ |
|   Ganti SSD         | |        foto bukti besar          | |
|   ThinkPad T14      | +----------------------------------+ |
|                     | [ Verifikasi catatan ]               |
+---------------------+--------------------------------------+
```

Di ponsel, daftar dan detail menjadi dua halaman berurutan. Foto bukti bisa diperbesar dengan ketuk.

## 6. Interaksi dan animasi

| Interaksi | Pemicu | Perilaku | Durasi |
| --- | --- | --- | --- |
| Ring skor naik | Nilai skor berubah | Angka hitung naik dan stroke ring beranimasi; badge crossfade bila melewati ambang 40 atau 70 | 600 ms ease-out |
| Toast skor naik | Skor bertambah | Teks seperti “Skor naik 62 → 78 · Terpercaya” | Tampil 4 detik |
| Highlight harga | Rentang harga berubah | Latar angka berkedip lembut | 1,2 detik |
| Gauge harga | Harga minta diketik | Penanda bergeser, label berubah | 300 ms |
| Alasan AI | Hasil AI tiba | Skeleton shimmer lalu fade in | 200 ms |
| Cap verifikasi | Pertama kali muncul | Skala 1,2 ke 1 dengan rotasi sekitar −6° | 300 ms |
| Bottom sheet | Buka atau tutup | Naik dari bawah; tutup dengan geser atau ketuk latar; fokus terkunci | 250 ms |
| Tombol Beli dan Verifikasi | Ditekan | State loading, cegah klik ganda, konfirmasi ringan | - |
| Unggah foto | Pilih berkas | Preview instan, progress bar, tombol coba lagi saat gagal | - |

Semua animasi wajib menghormati `prefers-reduced-motion`: tampilkan nilai akhir tanpa transisi. Tidak ada informasi yang hanya disampaikan lewat animasi.

## 7. Komponen dan kontrak data

### 7.1 View model (yang diterima frontend)

Frontend memakai bentuk camelCase. Pemetaan dari kolom database dilakukan di satu fungsi pada `queries.ts` tiap fitur, bukan di komponen.

```ts
// domain/view-models.ts
export type PriceLabel = 'murah' | 'wajar' | 'mahal';
export type RecordType = 'pembelian' | 'servis' | 'ganti_part' | 'baterai' | 'kerusakan';

export type PassportSummary = {
  id: string; jenis: 'hp' | 'laptop'; merek: string; model: string;
  fotoUrl: string; harga: number | null; labelHarga: PriceLabel | null;
  trustScore: number; jumlahL3: number; status: 'draf' | 'aktif' | 'terjual';
};

export type RecordView = {
  id: string; tipe: RecordType; tanggal: string; deskripsi: string;
  buktiUrl: string | null; level: 1 | 2 | 3;
  verifiedBy: string | null; partOriginal: boolean | null;
};

export type EstimateView = {
  supported: boolean;
  min?: number; max?: number; nilaiTambah?: number;
  reasons: string[]; source: 'ai' | 'formula';
};
```

### 7.2 Props komponen inti

```ts
type ScoreRingProps = { score: number; size?: 'sm' | 'md' | 'lg'; animate?: boolean };
type LevelChipProps = { level: 1 | 2 | 3; size?: 'sm' | 'md' };
type RecordCardProps = { record: RecordView; mode: 'public' | 'owner' | 'mitra'; onVerify?: (id: string) => void };
type PriceLabelProps = { label: PriceLabel };
type PriceGaugeProps = { min: number; max: number; asking?: number };
type PassportCardProps = { passport: PassportSummary; href: string };
type ScoreChecklistProps = { items: { key: string; label: string; points: number; max: number }[] };
type AIReasonsProps = { reasons: string[] | null; source: 'ai' | 'formula'; loading?: boolean };
```

### 7.3 Varian dan state wajib per komponen

| Komponen | Varian | State yang wajib dibuat |
| --- | --- | --- |
| ScoreRing | sm 40 px, md 72 px, lg 120 px | Nilai 0, nilai 100, animate nonaktif |
| LevelChip | sm, md | Level 1, 2, 3 |
| RecordCard | public, owner, mitra | Dengan dan tanpa bukti, level 3 dengan cap, deskripsi panjang |
| PriceGauge | Dengan atau tanpa harga minta | Murah, wajar, mahal, rentang sempit |
| PassportCard | aktif, terjual, draf | Skor rendah dan tinggi, tanpa label harga (model tidak didukung) |
| AIReasons | ai, formula | Loading, null (pakai alasan templat) |
| ScoreChecklist | - | Semua selesai, tidak ada yang selesai |

Komponen lain: VerifiedStamp, MaskedSerial, QRModal, PassportHero, RecordTimeline, RecordSheet, ListingFilters, BuyButton, PriceSuggestionCard, EvidenceViewer.

## 8. Design tokens

Aturan utama: komponen tidak boleh memakai kode hex langsung, hanya token. Warna dicadangkan untuk makna; brand netral.

| Peran | Token | Hex | Penggunaan |
| --- | --- | --- | --- |
| Dasar | surface, canvas, border | #FFFFFF, #F8FAFC, #E2E8F0 | Kartu, latar halaman, garis |
| Teks | text, text-muted | #0F172A, #64748B | Teks utama dan sekunder |
| Brand | ink, accent | #0F172A, #4F46E5 | Tombol utama; fokus, link, logo |
| Level 1 / Dasar | trust-1, trust-1-soft | #475569, #F1F5F9 | Klaim penjual |
| Level 2 / Berdokumen | trust-2, trust-2-soft | #B45309, #FEF3C7 | Catatan dengan bukti |
| Level 3 / Terpercaya | trust-3, trust-3-soft | #047857, #D1FAE5 | Terverifikasi mitra |
| Murah | price-murah, soft | #0E7490, #CFFAFE | Di bawah rentang wajar |
| Wajar | price-wajar, soft | #0F172A, #F1F5F9 | Di dalam rentang |
| Mahal | price-mahal, soft | #BE123C, #FFE4E6 | Di atas rentang |
| Error form | danger | #DC2626 | Hanya di form, dengan ikon dan teks |

```css
/* styles/globals.css */
:root {
  --trust-1: #475569; --trust-1-soft: #F1F5F9;
  --trust-2: #B45309; --trust-2-soft: #FEF3C7;
  --trust-3: #047857; --trust-3-soft: #D1FAE5;
  --price-murah: #0E7490; --price-murah-soft: #CFFAFE;
  --price-wajar: #0F172A; --price-wajar-soft: #F1F5F9;
  --price-mahal: #BE123C; --price-mahal-soft: #FFE4E6;
}
```

Tailwind memetakan nama seperti `trust-1` dan `price-mahal-soft` ke variabel di atas.

| Aspek | Aturan |
| --- | --- |
| Tipografi | Plus Jakarta Sans untuk teks; IBM Plex Mono untuk serial dan ID paspor; angka harga memakai `tabular-nums` |
| Skala teks | Display 28/36 semibold (harga), H1 22, H2 18, body 14-16, caption 12 |
| Bentuk | Radius 12 untuk kartu, 8 untuk kontrol, penuh untuk chip; pemisah dengan border 1 px, shadow hanya untuk sheet dan dialog |
| Jarak | Kelipatan 4 px; area sentuh minimal 44 px |
| Ikon | lucide-react, ukuran 16 atau 20 |
| Tema | Hanya terang; mode gelap bukan bagian MVP |

Pembeda selain warna: level memakai ikon (kutip, dokumen, perisai-centang); label harga memakai panah turun, titik, dan panah naik; badge skor memakai ring progress.

## 9. Form dan validasi

Pustaka: react-hook-form dengan zod. Validasi dijalankan saat field kehilangan fokus dan saat submit. Pesan error tampil di bawah field.

| Field | Input | Aturan | Pesan error |
| --- | --- | --- | --- |
| Jenis | Segmented HP / Laptop | Wajib | Pilih jenis perangkat |
| Merek, Model | Combobox dari daftar model yang didukung, plus opsi Model lain | Wajib. Model lain memunculkan catatan bahwa estimasi harga belum tersedia | Pilih atau isi model |
| Serial / IMEI | Teks mono | HP: 15 digit angka. Laptop: 5 sampai 30 karakter | IMEI harus 15 digit |
| Tahun beli | Pilihan tahun | Dari 6 tahun lalu sampai tahun ini | Tahun tidak valid |
| Harga beli | Input rupiah dengan pemisah ribuan | Lebih dari 0 | Isi harga beli |
| Foto perangkat | Unggah dengan preview | JPG atau PNG, maksimal 5 MB | Format harus JPG/PNG, maksimal 5 MB |
| Baterai (%) | Slider dengan input angka | 1 sampai 100 (HP wajib, laptop opsional) | Isi 1 sampai 100 |
| Kondisi fisik | Tiga kartu pilihan: Mulus, Lecet ringan, Retak/penyok | Wajib | Pilih kondisi fisik |
| Kunci bersih | Toggle | Label: Saya menyatakan bebas iCloud/FRP/MDM (klaim penjual) | - |
| Tipe catatan | Chip | Wajib | Pilih tipe catatan |
| Tanggal catatan | Pemilih tanggal | Tidak boleh di masa depan; peringatan (bukan error) bila sebelum tahun beli | Tanggal tidak boleh di masa depan |
| Deskripsi catatan | Textarea | 5 sampai 300 karakter | Tulis 5 sampai 300 karakter |
| Foto bukti | Unggah dengan preview | Opsional; ada foto berarti level Berdokumen | Format harus JPG/PNG, maksimal 5 MB |
| Part original | Toggle | Hanya muncul untuk tipe ganti part | - |

Tips UX: ambil kamera langsung di ponsel (`accept='image/*'` dengan `capture`), kompres gambar di klien sebelum unggah supaya cepat, dan jangan kosongkan form saat terjadi error simpan.

## 10. State loading, kosong, dan error

| Layar | Loading | Kosong | Error |
| --- | --- | --- | --- |
| Beranda | Skeleton 6 kartu | “Belum ada listing yang cocok” dengan tombol Reset filter | Banner gagal memuat dengan tombol Coba lagi |
| Detail Paspor | Skeleton hero dan blok | Paspor tidak ditemukan (halaman 404 ramah) | Banner gagal memuat dengan tombol Coba lagi |
| Perangkat Saya | Skeleton kartu | EmptyState dengan tombol Buat paspor pertama | Coba lagi |
| Isi Paspor | Tombol Simpan berstatus loading | Timeline kosong dengan ajakan menambah catatan | Error per field dan toast gagal simpan; data form tetap |
| Buat Listing | Rentang rumus tampil dulu, alasan AI berupa skeleton | Model tidak didukung: kartu “Estimasi belum tersedia” | AI gagal: tampilkan alasan templat, bukan pesan error |
| Dasbor Mitra | Skeleton daftar | “Tidak ada catatan menunggu” | Coba lagi |

Kasus khusus:

- Listing sudah terjual saat halaman terbuka: tombol Beli nonaktif dan banner Terjual.
- Belum login saat menekan Beli: dialog login, lalu kembali ke halaman yang sama.
- Serial di halaman publik selalu disamarkan, misalnya `35••••••••482`.
- Anomali (opsional): banner kuning kecil di atas timeline dengan alasan singkat.

## 11. Responsif

Breakpoint: ponsel di bawah 768 px, tablet 768 sampai 1023 px, desktop 1024 px ke atas. Rancang ponsel lebih dulu.

| Layar | Ponsel | Tablet | Desktop |
| --- | --- | --- | --- |
| Beranda | 1 kolom, filter dalam sheet | 2 kolom | 3 kolom, filter baris chip |
| Detail Paspor | 1 kolom, tombol sticky bawah | 1 kolom lebar maksimal 576 px | 2 kolom, tombol sticky di kolom kanan |
| Isi Paspor | 1 kolom, checklist bar di atas | 1 kolom | 2 kolom, checklist sticky di kanan |
| Buat Listing | 1 kolom | 1 kolom | 2 kolom (saran di kiri, input di kanan) |
| Dasbor Mitra | Daftar lalu detail (dua halaman) | Split | Split 4 banding 8 |

Catatan: perhatikan safe area di ponsel untuk bar sticky; uji juga di layar proyektor 1280 × 720 karena demo mungkin ditampilkan di sana.

## 12. Microcopy

| Konteks | Teks |
| --- | --- |
| Level 1 | Klaim penjual |
| Level 2 | Berdokumen |
| Level 3 | Terverifikasi Mitra |
| Judul skor | Skor Kepercayaan |
| Catatan skor | Skor kelengkapan data, bukan jaminan kondisi fisik |
| Catatan estimasi | Dihitung dari rumus dan data pasar sampel, dijelaskan AI |
| Nilai tambah | Paspor menambah sekitar Rp 346 rb |
| Tooltip Murah | Di bawah rentang wajar, periksa riwayat dengan teliti |
| Estimasi tak tersedia | Estimasi belum tersedia untuk model ini |
| Toast skor naik | Skor naik 62 → 78 · Terpercaya |
| Toast verifikasi | Catatan terverifikasi |
| Sukses beli | Paspor kini milik Anda |
| Empty Beranda | Belum ada listing yang cocok. Coba ubah filter. |
| Empty Perangkat Saya | Belum ada paspor. Buat paspor pertama Anda. |
| Empty antrian mitra | Tidak ada catatan menunggu verifikasi |

Istilah L1, L2, dan L3 tidak pernah muncul di UI; itu istilah internal tim.

## 13. Aksesibilitas

- Tidak ada status yang hanya dibedakan lewat warna; selalu ada ikon dan teks.
- Kontras teks terhadap latar minimal 4,5 banding 1; periksa pasangan fg dan soft pada tabel token sebelum final.
- Fokus keyboard terlihat jelas (ring accent) dan urutan tab mengikuti urutan visual.
- ScoreRing memakai `role='img'` dengan `aria-label` seperti “Skor Kepercayaan 78 dari 100”.
- Foto perangkat dan foto bukti punya teks alternatif.
- Bottom sheet dan dialog mengunci fokus dan bisa ditutup dengan tombol Esc.
- Area sentuh minimal 44 px; tombol aksi utama tidak berdekatan dengan tombol berisiko.

## 14. Struktur kode frontend

### 14.1 Folder

```text
src/
├─ app/                        # route dan layout saja, file tipis
│  ├─ (auth)/login/page.tsx
│  ├─ (app)/layout.tsx         # AppShell, guard sesi
│  ├─ (app)/page.tsx           # Beranda
│  ├─ (app)/devices/...        # Perangkat Saya, Isi Paspor, Buat Listing
│  ├─ (app)/mitra/page.tsx
│  ├─ p/[id]/page.tsx          # Detail Paspor publik
│  └─ dev/components/page.tsx  # galeri komponen (hanya development)
├─ components/
│  ├─ ui/                      # primitif: button, input, sheet, toast, skeleton
│  ├─ trust/                   # ScoreRing, LevelChip, VerifiedStamp, PriceLabel, PriceGauge
│  ├─ layout/                  # AppShell, BottomNav, TopBar, PageHeader
│  └─ feedback/                # EmptyState, ErrorState, InlineError
├─ features/
│  ├─ passport/components/     # PassportCard, PassportHero, SpecList, QRModal, PassportForm
│  ├─ records/components/      # RecordCard, RecordTimeline, RecordSheet
│  ├─ listings/components/     # ListingFilters, ListingGrid, ListingForm, BuyButton
│  ├─ pricing/components/      # AIReasons, PriceSuggestionCard
│  └─ mitra/components/        # VerifyQueue, EvidenceViewer
├─ hooks/                      # use-count-up, use-realtime-score, use-media-query
├─ lib/                        # format.ts (rupiah, tanggal, maskSerial), cn.ts
├─ mocks/                      # fixture bertipe view model
└─ styles/globals.css          # token
```

### 14.2 Aturan

- Komponen adalah Server Component secara default. Tambahkan `'use client'` hanya untuk yang interaktif: form, gauge, ring animasi, realtime.
- Tidak ada state global. Data server dibaca lewat Server Component dan diperbarui dengan revalidate; state UI lokal memakai `useState`.
- Komponen tidak mengakses Supabase langsung. Pengecualian: hook realtime di `hooks/`.
- Komponen di `components/trust` hanya bergantung pada tipe view model, bukan pada fitur.
- Satu skema zod per form, berdampingan dengan form-nya.
- Gambar memakai `next/image` dengan ukuran tetap untuk mencegah layout bergeser.
- Uang disimpan sebagai integer rupiah dan diformat hanya lewat `lib/format.ts`.

### 14.3 Mock-first

Setiap query frontend punya cabang mock yang aktif saat `NEXT_PUBLIC_USE_MOCKS=true`. Fixture di `mocks/` harus mencakup skenario berikut: skor tinggi dan terverifikasi, skor rendah penuh klaim, unit dengan anomali, listing terjual, dan model tidak didukung. Halaman `/dev/components` menampilkan setiap komponen dalam semua state-nya, sehingga tinjauan visual cukup di satu tempat.

### 14.4 Contoh kode: hook hitung naik dan ScoreRing

```ts
// hooks/use-count-up.ts
export function useCountUp(target: number, ms = 600) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (ms === 0 || reduce) { setValue(target); from.current = target; return; }
    const start = performance.now();
    const a = from.current;
    let raf = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / ms, 1);
      setValue(Math.round(a + (target - a) * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    });
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}
```

```tsx
// components/trust/ScoreRing.tsx  ('use client')
const R = 44;
const C = 2 * Math.PI * R;
const tone = (s: number) => (s >= 70 ? 'text-trust-3' : s >= 40 ? 'text-trust-2' : 'text-trust-1');

export function ScoreRing({ score, size = 'md', animate = true }: ScoreRingProps) {
  const shown = useCountUp(score, animate ? 600 : 0);
  return (
    <div className={cn('relative', SIZE[size], tone(score))} role='img'
         aria-label={`Skor Kepercayaan ${score} dari 100`}>
      <svg viewBox='0 0 100 100' className='-rotate-90'>
        <circle cx='50' cy='50' r={R} fill='none' strokeWidth='8' className='stroke-current opacity-15' />
        <circle cx='50' cy='50' r={R} fill='none' strokeWidth='8' strokeLinecap='round'
          className='stroke-current transition-[stroke-dashoffset] duration-[600ms] ease-out motion-reduce:transition-none'
          strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
      </svg>
      <span className='absolute inset-0 grid place-items-center font-semibold tabular-nums'>{shown}</span>
    </div>
  );
}
```

### 14.5 Contoh kode: skor realtime

```ts
// hooks/use-realtime-score.ts
export function useRealtimeScore(deviceId: string, initial: number) {
  const [score, setScore] = useState(initial);
  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`device-${deviceId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'devices', filter: `id=eq.${deviceId}` },
        payload => setScore(payload.new.trust_score))
      .subscribe();
    const poll = setInterval(() => refreshScore(deviceId).then(setScore), 3000); // cadangan
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [deviceId]);
  return score;
}
```

Saat nilai `score` bertambah, komponen pemakai menampilkan toast skor naik. Pastikan toast hanya muncul untuk kenaikan setelah render pertama, bukan saat halaman baru dibuka.

## 15. Urutan kerja frontend

| Jam | Fokus |
| --- | --- |
| 0-2 | Token (`globals.css`, Tailwind), AppShell dan navigasi, kerangka enam komponen inti, view model dan fixture mock, halaman `/dev/components` |
| 2-8 | Login dan Masuk cepat, Perangkat Saya, Isi Paspor dengan validasi, RecordSheet, unggah foto dan preview |
| 8-12 | ScoreRing, ScoreChecklist, LevelChip, Dasbor Mitra dengan EvidenceViewer, toast, hook realtime |
| 12-17 | Beranda dengan filter, Detail Paspor (tiga mode), tombol Beli dan layar sukses |
| 17-20 | PriceGauge, AIReasons dengan loading bertahap, Buat Listing, label harga di semua tempat |
| 20-22 | QRModal, VerifiedStamp, animasi skor dan highlight harga, polesan responsif |
| 22-24 | Uji perangkat nyata, perbaiki state yang terlewat, bantu latihan demo |

## 16. Checklist QA frontend

- [ ] Semua komponen punya semua state di `/dev/components`
- [ ] Detail Paspor terbuka dari QR tanpa login
- [ ] Level di form catatan berubah otomatis saat foto diunggah
- [ ] Ring skor, badge, dan harga memperbarui tanpa muat ulang manual
- [ ] Tidak ada layar kosong atau error mentah di enam layar utama
- [ ] Diuji di iPhone Safari, Android Chrome, laptop Chrome, dan layar 1280 × 720
- [ ] Diuji dengan jaringan lambat (throttle Fast 3G): skeleton muncul, tidak ada lompatan layout
- [ ] Navigasi keyboard dan fokus terlihat pada form dan sheet
- [ ] Animasi mati dengan benar saat `prefers-reduced-motion` aktif
- [ ] Dua kalimat batasan (skor dan estimasi) terlihat di layar
- [ ] Serial di halaman publik selalu disamarkan
- [ ] Rekaman cadangan alur demo tersedia
