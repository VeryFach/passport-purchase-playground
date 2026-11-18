# Requirements: Paspor Digital Smartphone & Laptop Bekas

**Versi:** 0.1 (draft untuk validasi)
**Fokus kategori:** Smartphone dan laptop
**Status:** Brainstorming ke requirements awal

---

## 1. Ringkasan

Platform jual-beli smartphone dan laptop bekas yang kepercayaannya dibangun dari **paspor digital**: catatan terverifikasi tentang identitas perangkat, pembelian, servis, penggantian part, kondisi baterai/penyimpanan, dan rantai kepemilikan. Pemilik mencatat riwayat sejak perangkat dibeli (bukan baru saat mau dijual), sehingga saat dijual, pembeli bisa melihat laporan yang dapat dipercaya dan penjual jujur mendapat harga lebih baik.

**Analogi:** Carfax atau buku servis digital, tetapi untuk HP dan laptop.

---

## 2. Problem Framing Map

| Elemen | Isi |
|---|---|
| **Siapa yang punya masalah** | Pembeli smartphone/laptop bekas, dan penjual yang perangkatnya sebenarnya terawat |
| **Konteks** | Transaksi di marketplace umum, grup jual-beli, dan toko tukar tambah. Kepercayaan hanya bergantung pada foto dan omongan penjual |
| **Problem statement** | Pembeli tidak bisa memverifikasi kondisi asli perangkat bekas, sehingga menawar rendah atau batal membeli. Penjual jujur tidak punya cara membuktikan perangkatnya terawat, sehingga dihargai sama dengan perangkat bermasalah |
| **Gejala** | Tawar-menawar ekstrem, penipuan, barang tidak sesuai deskripsi, sengketa dan retur, perangkat bagus tertahan lama |
| **Akar masalah** | (1) Informasi asimetris antara penjual dan pembeli. (2) Riwayat tersebar di nota, WhatsApp, dan service center. (3) Dokumen mudah dipalsukan atau hilang. (4) Tidak ada standar penilaian kondisi. (5) Part ganti non-original dan status kunci (iCloud, FRP, MDM) sulit dicek orang awam |
| **Dampak** | Pembeli rugi uang, penjual jujur rugi nilai jual (*lemons problem*), pasar tidak efisien |
| **Solusi yang ada** | Marketplace umum, toko trade-in, garansi toko, aplikasi cek IMEI atau diagnostik. Semuanya parsial: tidak ada riwayat berkelanjutan dan tidak terhubung ke proses jual |
| **Batasan** | Data harus dapat dipercaya, pemilik malas mencatat, isu privasi, perbedaan data antar merek dan sistem operasi |
| **Peluang** | Riwayat yang direkam sejak awal menjadi aset yang menaikkan nilai jual kembali |

**How Might We:**

- Bagaimana membuat pencatatan riwayat terasa bermanfaat bagi pemilik, bukan beban administrasi?
- Bagaimana membuat riwayat sulit dipalsukan tanpa membuat prosesnya rumit?
- Bagaimana mengubah riwayat terverifikasi menjadi harga lebih tinggi dan penjualan lebih cepat?
- Bagaimana mendapatkan data dari service center dan merchant tanpa integrasi mahal di awal?
- Bagaimana menangani perangkat lama yang belum punya riwayat sama sekali?

---

## 3. Value Proposition Canvas

### 3.1 Segmen Pembeli

**Customer Profile**

| Jobs | Pains | Gains |
|---|---|---|
| Mendapat HP/laptop berkualitas dengan harga di bawah baru | Takut tertipu atau mendapat perangkat bermasalah | Yakin pada kondisi perangkat sebelum bayar |
| Menilai apakah harga yang diminta wajar | Tidak tahu apakah pernah jatuh, kena air, ganti layar atau baterai non-original | Tahu sisa umur pakai dan biaya perawatan ke depan |
| Membandingkan beberapa unit sejenis | Foto dan deskripsi bisa direkayasa, kondisi baterai tidak terlihat | Posisi tawar kuat karena punya data objektif |
| Menyelesaikan transaksi dengan aman | Takut perangkat masih terkunci (iCloud, FRP, MDM) atau IMEI bermasalah | Ada perlindungan bila perangkat tidak sesuai laporan |

**Value Map**

| Products & Services | Pain Relievers | Gain Creators |
|---|---|---|
| Laporan paspor perangkat (identitas, servis, part ganti, baterai, kepemilikan) | Riwayat terverifikasi mengurangi risiko tertipu | Skor kondisi (*Trust Score*) yang mudah dibaca |
| Badge verifikasi bertingkat | Cek otomatis status kunci dan IMEI | Estimasi sisa umur baterai dan harga wajar |
| Escrow (rekening bersama) | Perlindungan dana dan garansi singkat | Perbandingan antar unit berbasis data |
| Opsi inspeksi pihak ketiga | Deteksi anomali (misalnya servis berulang di komponen yang sama) | Garansi transfer kepemilikan |

### 3.2 Segmen Penjual

**Customer Profile**

| Jobs | Pains | Gains |
|---|---|---|
| Menjual perangkat cepat dengan harga terbaik | Perangkat terawat dihargai sama dengan yang bermasalah | Harga lebih tinggi karena terbukti terawat |
| Meyakinkan calon pembeli | Dihujani tawaran rendah dan pertanyaan berulang | Laku lebih cepat, lebih sedikit tawar-menawar |
| Mencari pembeli serius | Takut pembeli palsu atau penipu | Reputasi penjual yang terbangun |
| Merawat dan melacak perangkat selama dipakai | Nota dan riwayat servis tercecer | Dokumentasi rapi yang tinggal diteruskan ke pembeli |

**Value Map**

| Products & Services | Pain Relievers | Gain Creators |
|---|---|---|
| Aplikasi pencatatan riwayat sejak beli (dompet digital perangkat) | Unggah nota/foto cukup scan, tanpa input manual | Pengingat garansi dan servis, sehingga pencatatan punya manfaat harian |
| Paspor perangkat sekali klik saat jual | Verifikasi pihak ketiga menghilangkan keraguan pembeli | Rekomendasi harga jual berbasis riwayat |
| Listing otomatis dari data yang sudah ada | Pembayaran aman lewat escrow | Profil dan rating penjual |

---

## 4. Tujuan dan Metrik Keberhasilan

| Tujuan | Metrik | Target awal (hipotesis) |
|---|---|---|
| Pembeli percaya pada kondisi perangkat | Persentase pembeli yang menyelesaikan transaksi setelah membuka paspor | > 30% dari yang membuka |
| Perangkat berpaspor lebih cepat laku | Median hari terjual: berpaspor vs tanpa paspor | Lebih cepat ≥ 25% |
| Perangkat berpaspor lebih mahal | Selisih harga transaksi untuk model dan kondisi setara | Premi ≥ 5% |
| Pencatatan berkelanjutan | Persentase pengguna yang menambah ≥ 1 catatan per 3 bulan | > 40% |
| Kepercayaan data | Tingkat sengketa karena laporan tidak sesuai | < 3% transaksi |

> Semua target di atas adalah hipotesis yang harus divalidasi pada tahap MVP (lihat bagian 15).

---

## 5. Ruang Lingkup

### 5.1 Dalam Lingkup (MVP)

- Smartphone (Android dan iOS) dan laptop (Windows, macOS, Linux)
- Pembuatan paspor perangkat dan pencatatan riwayat
- Verifikasi bertingkat (klaim, dokumen, diagnostik, inspeksi)
- Cek status kunci dan identitas perangkat
- Listing jual dengan tampilan paspor
- Transaksi dengan escrow dan transfer kepemilikan paspor

### 5.2 Di Luar Lingkup (tahap awal)

- Kategori lain (kamera, kendaraan, perabot)
- Logistik dan pengiriman sendiri
- Layanan servis atau perbaikan sendiri
- Integrasi API resmi dengan seluruh pabrikan
- Asuransi dan garansi bersponsor pihak ketiga (dijajaki setelah MVP)

---

## 6. Aktor dan Peran

| Aktor | Deskripsi | Hak utama |
|---|---|---|
| **Pemilik/Penjual** | Pengguna yang mencatat riwayat dan menjual perangkat | Membuat paspor, menambah catatan, membuat listing, mengatur privasi data |
| **Pembeli** | Pengguna yang mencari dan membeli perangkat | Melihat paspor, menawar, membayar via escrow, mengajukan sengketa |
| **Mitra Servis** | Service center atau toko servis rekanan | Menerbitkan catatan servis terverifikasi |
| **Inspektur** | Tim internal atau mitra yang memeriksa perangkat | Membuat laporan inspeksi dan memberi badge tertinggi |
| **Admin** | Operator platform | Moderasi, penanganan sengketa, pengelolaan mitra, audit data |

---

## 7. Data yang Dilacak

### 7.1 Data Universal (smartphone dan laptop)

- Identitas perangkat: merek, model, serial number, IMEI (HP), tanggal produksi/aktivasi bila tersedia
- Bukti pembelian: tanggal, toko, harga, jenis garansi
- Rantai kepemilikan: pemilik sebelumnya (disamarkan), tanggal transfer
- Foto kondisi bertanggal (dengan penanda waktu)
- Riwayat servis dan penggantian part, lengkap dengan bukti
- Kelengkapan: kotak, charger, aksesori

### 7.2 Data Spesifik Smartphone

| Data | Cara perolehan | Tingkat kepercayaan |
|---|---|---|
| Battery health, jumlah siklus | Diagnostik otomatis lewat aplikasi atau foto layar pengaturan | Sedang ke tinggi |
| Riwayat ganti layar, baterai, kamera, board | Catatan servis + bukti mitra | Tinggi bila dari mitra |
| Status part (original atau bukan) | Diagnostik dan inspeksi | Tinggi bila diinspeksi |
| Status kunci: iCloud/Find My, Google FRP, MDM | Pemeriksaan saat verifikasi | Tinggi |
| Status IMEI (registrasi dan daftar blokir) | Pengecekan terhadap layanan resmi | Tinggi |
| Kesehatan penyimpanan, sensor, port, speaker, mikrofon | Uji fungsi dalam aplikasi | Sedang |
| Indikator kontak cairan, bekas jatuh | Inspeksi | Tinggi bila diinspeksi |

### 7.3 Data Spesifik Laptop

| Data | Cara perolehan | Tingkat kepercayaan |
|---|---|---|
| Spesifikasi (CPU, RAM, penyimpanan, GPU) | Pembacaan otomatis dari sistem | Tinggi |
| Kesehatan baterai (wear level, jumlah siklus) | Laporan baterai bawaan OS atau aplikasi | Tinggi |
| Kesehatan SSD/HDD (SMART, jam pakai, TBW) | Pembacaan otomatis | Tinggi |
| Suhu dan performa (uji beban singkat) | Uji dalam aplikasi | Sedang |
| Kondisi fisik: layar, keyboard, engsel, port, bodi | Foto dan inspeksi | Sedang ke tinggi |
| Riwayat servis dan ganti part (baterai, SSD, RAM, layar, keyboard, thermal paste) | Catatan servis | Tinggi bila dari mitra |
| Status kunci: BIOS/UEFI, MDM perusahaan, Activation Lock (macOS), lisensi OS | Pemeriksaan saat verifikasi | Tinggi |

### 7.4 Hierarki Kepercayaan Sumber Data

| Level | Sumber | Label ke pembeli |
|---|---|---|
| **L4** | Inspeksi tim/mitra resmi atau data langsung dari service center | Terinspeksi |
| **L3** | Diagnostik otomatis oleh aplikasi (dibaca dari perangkat) | Terdiagnosis |
| **L2** | Dokumen (nota/foto) yang lolos validasi OCR dan pemeriksaan kewajaran | Berdokumen |
| **L1** | Klaim penjual tanpa bukti | Klaim penjual |

Setiap field pada paspor wajib menampilkan levelnya.

---

## 8. Functional Requirements

Prioritas memakai MoSCoW: **M** (Must), **S** (Should), **C** (Could), **W** (Won't untuk MVP).

### 8.1 Akun dan Profil

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-001 | Pengguna dapat mendaftar dan masuk dengan email/nomor telepon dan verifikasi OTP | M |
| FR-002 | Pengguna dapat mengelola profil dan alamat | M |
| FR-003 | Penjual dapat melakukan verifikasi identitas (KYC ringan) sebelum menjual | S |
| FR-004 | Pengguna dapat mengatur privasi data yang dibagikan ke pembeli | M |

### 8.2 Paspor Perangkat

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-010 | Pemilik dapat membuat paspor untuk smartphone atau laptop dengan data identitas perangkat | M |
| FR-011 | Sistem mencegah satu perangkat (serial/IMEI) memiliki lebih dari satu paspor aktif | M |
| FR-012 | Pemilik dapat menambah catatan: pembelian, servis, ganti part, kerusakan, foto kondisi | M |
| FR-013 | Pemilik dapat mengunggah nota/foto bukti dan sistem mengekstrak data dengan OCR | S |
| FR-014 | Setiap catatan menyimpan penanda waktu, pembuat, dan level kepercayaan sumber | M |
| FR-015 | Catatan yang sudah terverifikasi tidak dapat dihapus, hanya dapat dikoreksi dengan jejak audit | M |
| FR-016 | Aplikasi dapat membaca data diagnostik perangkat secara otomatis (baterai, penyimpanan, spesifikasi) | S |
| FR-017 | Sistem memberi pengingat garansi dan servis berkala | S |
| FR-018 | Sistem menampilkan estimasi nilai jual perangkat saat ini | C |

### 8.3 Verifikasi

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-020 | Sistem memeriksa status kunci (iCloud/FRP/MDM/Activation Lock) dan status IMEI sebelum paspor berlabel terverifikasi | M |
| FR-021 | Mitra servis dapat menerbitkan catatan servis terverifikasi lewat portal atau QR | S |
| FR-022 | Penjual dapat memesan inspeksi (di tempat mitra atau jarak jauh dengan panduan foto/video langsung) | S |
| FR-023 | Sistem mendeteksi anomali (misalnya serial tidak cocok dengan nota, servis berulang di komponen yang sama, tanggal tidak wajar) | S |
| FR-024 | Admin dapat meninjau paspor yang ditandai anomali | M |
| FR-025 | Sistem memberi **Trust Score** dan badge bertingkat berdasarkan kelengkapan dan level sumber data | M |

### 8.4 Listing dan Pencarian

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-030 | Penjual dapat membuat listing otomatis dari paspor (spesifikasi dan riwayat terisi) | M |
| FR-031 | Listing menampilkan ringkasan paspor, Trust Score, dan level sumber tiap data | M |
| FR-032 | Pembeli dapat mencari dan memfilter berdasarkan model, harga, battery health, badge verifikasi, dan kelengkapan riwayat | M |
| FR-033 | Pembeli dapat membandingkan hingga 3 listing | S |
| FR-034 | Sistem menyarankan harga jual berdasarkan riwayat dan data pasar | C |
| FR-035 | Pembeli dapat menyimpan listing dan mengaktifkan notifikasi harga | C |

### 8.5 Transaksi

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-040 | Pembeli dan penjual dapat bernegosiasi lewat chat dalam aplikasi | M |
| FR-041 | Pembayaran memakai escrow: dana ditahan hingga pembeli mengonfirmasi atau masa tinjau berakhir | M |
| FR-042 | Pembeli memiliki masa tinjau (misalnya 2×24 jam) untuk membandingkan kondisi dengan paspor | M |
| FR-043 | Setelah transaksi selesai, kepemilikan paspor berpindah ke pembeli dan data pribadi pemilik lama disamarkan | M |
| FR-044 | Pembeli dapat mengajukan sengketa dengan bukti bila perangkat tidak sesuai paspor | M |
| FR-045 | Admin dapat memutuskan sengketa dan mengembalikan dana atau melepas dana ke penjual | M |
| FR-046 | Pembeli dan penjual dapat saling memberi rating | S |

### 8.6 Portal Mitra dan Admin

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-050 | Admin dapat mengelola mitra servis dan inspektur | M |
| FR-051 | Mitra dapat mencari perangkat berdasarkan serial/QR dan menambah catatan servis | S |
| FR-052 | Admin memiliki dasbor sengketa, anomali, dan metrik transaksi | M |
| FR-053 | Seluruh perubahan data tercatat dalam jejak audit | M |

---

## 9. Alur Pengguna Utama

### 9.1 Pemilik Mencatat Riwayat (sejak beli)

1. Pemilik membuka aplikasi dan memilih "Tambah perangkat".
2. Aplikasi membaca spesifikasi dan identitas perangkat (atau pemilik memindai serial/IMEI).
3. Pemilik mengunggah foto nota dan garansi, lalu OCR mengisi data.
4. Sistem membuat paspor dengan level sumber masing-masing.
5. Selama pemakaian, pemilik menambah catatan servis dan menerima pengingat.

### 9.2 Penjual Menjual Perangkat

1. Penjual memilih perangkat dan menekan "Jual".
2. Sistem menjalankan pemeriksaan status kunci dan IMEI, serta menghitung Trust Score.
3. Penjual dapat memesan inspeksi untuk menaikkan badge.
4. Sistem membuat draf listing otomatis; penjual menentukan harga dan data yang dibagikan.
5. Listing tayang dengan tampilan paspor.

### 9.3 Pembeli Membeli

1. Pembeli mencari dan memfilter listing, lalu membuka paspor.
2. Pembeli bernegosiasi lewat chat dan membayar ke escrow.
3. Perangkat dikirim atau diserahkan; pembeli mengecek kesesuaian dengan paspor dalam masa tinjau.
4. Bila sesuai, pembeli konfirmasi dan dana dilepas; paspor berpindah kepemilikan.
5. Bila tidak sesuai, pembeli mengajukan sengketa.

### 9.4 Perangkat Lama Tanpa Riwayat (cold start)

1. Penjual mengunggah foto dan menjalankan diagnostik otomatis.
2. Penjual memesan inspeksi sekali jalan.
3. Sistem membuat paspor "awal" dengan data L3/L4 saja; kolom riwayat lama diberi label jelas "tidak tersedia" (bukan dianggap buruk).

---

## 10. Aturan Bisnis dan Trust Score

- **BR-01:** Satu perangkat (serial/IMEI) hanya boleh memiliki satu paspor aktif.
- **BR-02:** Badge "Terverifikasi" hanya diberikan jika status kunci bersih dan IMEI valid.
- **BR-03:** Data level L1 selalu ditampilkan dengan label "Klaim penjual" dan tidak dihitung penuh pada skor.
- **BR-04:** Catatan terverifikasi tidak boleh dihapus; koreksi menimbulkan versi baru dengan alasan.
- **BR-05:** Perangkat dengan status terkunci, terblokir, atau terindikasi hasil kejahatan tidak boleh dilisting.
- **BR-06:** Penjual hanya dapat menyembunyikan data pribadi, bukan riwayat teknis yang relevan dengan kondisi (misalnya ganti layar).

**Komponen Trust Score (usulan awal, bobot dikalibrasi saat MVP):**

| Komponen | Contoh bobot |
|---|---|
| Keaslian identitas dan status kunci | 30% |
| Kelengkapan dan kualitas riwayat (servis, nota) | 25% |
| Kondisi teknis (baterai, penyimpanan, fungsi) | 25% |
| Level verifikasi (L1 sampai L4) | 15% |
| Reputasi penjual | 5% |

---

## 11. Non-Functional Requirements

| ID | Kategori | Kebutuhan |
|---|---|---|
| NFR-01 | Keamanan data | Data pribadi dan dokumen dienkripsi saat transit dan saat disimpan |
| NFR-02 | Integritas | Catatan riwayat bersifat *append-only* dengan jejak audit; dapat memakai hash berantai agar mudah dideteksi bila ada perubahan |
| NFR-03 | Privasi | Mengikuti UU Pelindungan Data Pribadi (UU PDP): persetujuan eksplisit, hak akses dan penghapusan data pribadi, minimisasi data |
| NFR-04 | Kinerja | Halaman paspor dan listing termuat < 3 detik pada koneksi 4G |
| NFR-05 | Ketersediaan | Target uptime 99,5% |
| NFR-06 | Skalabilitas | Mendukung penambahan kategori baru tanpa mengubah inti skema data |
| NFR-07 | Kegunaan | Pembuatan paspor selesai < 5 menit; antarmuka berbahasa Indonesia, mudah dipakai di ponsel |
| NFR-08 | Platform | Aplikasi Android dan iOS, plus web untuk pembeli dan portal mitra |
| NFR-09 | Anti-penipuan | Rate limiting, deteksi akun ganda, dan pemantauan pola mencurigakan |
| NFR-10 | Ketertelusuran | Setiap catatan dapat ditelusuri ke pembuat, waktu, dan sumber bukti |

---

## 12. Model Data Tingkat Tinggi

| Entitas | Atribut utama |
|---|---|
| **User** | id, nama, kontak, status KYC, peran, rating |
| **Device** | id, jenis (HP/laptop), merek, model, serial, IMEI, spesifikasi, status kunci, status aktif |
| **Passport** | id, device_id, pemilik saat ini, trust_score, badge, versi |
| **Ownership** | id, device_id, user_id, tanggal mulai, tanggal selesai, sumber (beli baru/bekas) |
| **HistoryRecord** | id, passport_id, tipe (pembelian/servis/ganti part/kerusakan/diagnostik/inspeksi), data, bukti, level sumber, pembuat, waktu, versi |
| **Evidence** | id, record_id, tipe file, hasil OCR, hash file |
| **Inspection** | id, device_id, inspektur, hasil per komponen, foto, waktu |
| **Listing** | id, passport_id, penjual, harga, status, data yang dibagikan |
| **Transaction** | id, listing_id, pembeli, status escrow, tanggal tinjau, hasil |
| **Dispute** | id, transaction_id, alasan, bukti, keputusan |
| **Partner** | id, nama, jenis (servis/inspeksi), area, status |
| **AuditLog** | id, aktor, aksi, objek, waktu, nilai sebelum/sesudah |

---

## 13. Asumsi, Risiko, dan Mitigasi

| # | Risiko / Asumsi | Dampak | Mitigasi |
|---|---|---|---|
| 1 | **Cold start:** perangkat lama belum punya riwayat | Paspor kosong, nilai produk rendah | Inspeksi sekali jalan; diagnostik otomatis; label "riwayat tidak tersedia" yang netral |
| 2 | **Pemalsuan data** (nota, foto, hasil diagnostik) | Kepercayaan runtuh | Validasi OCR dan pemeriksaan kewajaran; foto langsung dengan penanda waktu; mitra servis; inspeksi untuk badge tertinggi |
| 3 | **Pemilik malas mencatat** | Data tipis | Manfaat harian: pengingat garansi/servis, estimasi nilai, pembacaan data otomatis |
| 4 | **Pembeli belum tentu mau bayar lebih** | Model bisnis gagal | Uji kemauan membayar dan *concierge MVP* sebelum membangun penuh |
| 5 | **Keterbatasan akses diagnostik** (terutama iOS dan pembatasan OS) | Data otomatis terbatas | Mulai dari data yang dapat dibaca secara resmi; sisanya foto layar bertanda waktu dan inspeksi |
| 6 | **Perangkat curian atau terblokir** | Risiko hukum dan reputasi | Pemeriksaan IMEI dan kunci wajib; kebijakan pelaporan; kerja sama dengan pihak berwenang bila perlu |
| 7 | **Privasi** | Sanksi dan hilangnya kepercayaan | Kontrol penjual atas data, penyamaran data pribadi, kepatuhan UU PDP |
| 8 | **Efek dua sisi** (butuh pembeli dan penjual) | Marketplace sepi | Mulai dari satu kota/komunitas dan satu segmen model populer |
| 9 | **Biaya inspeksi tinggi** | Margin tipis | Inspeksi jarak jauh bertahap, mitra servis, premi dibebankan ke penjual |

---

## 14. Model Bisnis

- Komisi transaksi
- Biaya inspeksi dan verifikasi
- Listing premium atau sorotan
- Langganan untuk reseller/dealer kecil
- Kemitraan: service center, penyedia garansi/asuransi perangkat bekas

---

## 15. Rencana Validasi dan Roadmap

### 15.1 Validasi Sebelum Membangun

1. Wawancara 10 sampai 15 pembeli dan 10 penjual HP/laptop bekas tentang pengalaman buruk terakhir mereka.
2. Uji kemauan membayar: tanyakan berapa mereka rela bayar lebih untuk perangkat berpaspor.
3. *Concierge MVP*: buat laporan paspor secara manual untuk 10 sampai 20 perangkat; bandingkan kecepatan dan harga jual dengan perangkat tanpa laporan.
4. Petakan 3 sampai 5 service center atau toko yang mau jadi mitra data.

### 15.2 Roadmap Bertahap

| Fase | Isi | Kriteria lanjut |
|---|---|---|
| **Fase 0: Validasi** | Wawancara, concierge MVP, uji harga | Ada bukti premi harga atau kecepatan jual |
| **Fase 1: MVP** | Paspor dasar, diagnostik otomatis (Android dan Windows dahulu), cek kunci/IMEI, listing, escrow | Transaksi berulang dan sengketa terkendali |
| **Fase 2: Verifikasi dalam** | Portal mitra servis, inspeksi jarak jauh, deteksi anomali, Trust Score terkalibrasi | Tingkat sengketa turun, volume naik |
| **Fase 3: Ekspansi** | iOS dan macOS lebih dalam, integrasi pabrikan, garansi/asuransi, kategori baru | Pertumbuhan stabil dan unit ekonomi sehat |

---

## 16. Pertanyaan Terbuka

1. Segmen awal: HP, laptop, atau keduanya sekaligus? Merek/model populer apa yang paling dulu?
2. Kota atau komunitas pertama untuk uji pasar?
3. Apakah platform memegang dana (escrow sendiri) atau bermitra dengan penyedia pembayaran berlisensi?
4. Seberapa jauh platform menjamin laporan (garansi sendiri atau sebatas informasi)?
5. Siapa mitra inspeksi awal: tim sendiri atau toko servis rekanan?
6. Batas kewenangan hukum terkait perangkat terindikasi curian: kebijakan pelaporan seperti apa?
