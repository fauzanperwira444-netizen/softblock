> Salinan arsip dari dokumen Claude Docs: https://claude.ai/artifact/JmHLZkGQLvxVviRuPSpsHx (versi hidup, diperbarui di sana bila ada perubahan). Salinan teks ini menggantikan diagram sitemap dengan pohon teks; gambarnya hanya ada di dokumen asli. Dibuat 2026-11-15. Diperbarui pada hari yang sama agar selaras dengan keputusan wireframe dan dokumen Arsitektur Sistem (Bagian 2.1, 2.2, 5.3, 5.4, 6.3, 7.1, dan 8).

# Arsitektur Informasi: Perencana Kerja Pribadi

Nov 15, 2026 · @cah

## 1. Pengantar

Dokumen ini menetapkan struktur informasi aplikasi Perencana Kerja Pribadi: 70 fitur, 15 jenis konten, dan 11 halaman, beserta cara pengguna berpindah di antaranya. Dokumen ini mengacu pada Spesifikasi Kebutuhan Produk (FR dan NFR) dan Dokumen Use Case; rujukan seperti A-04, N-47, dan UC-21 menunjuk butir di kedua dokumen itu.

Bagian 2 sampai 7 mengikuti urutan Content Inventory, Content Categorization, Sitemap, Navigation Architecture, Screen Hierarchy, dan Content Relationship. Di luar cakupan: Ekspor dan Pemulihan, Data dan Pengaturan, notifikasi dorong, serta daftar perangkat.

Keputusan struktur utama:

- Sesi tidak punya halaman sendiri; sesi adalah bagian dari Detail Projek.
- Jadwal adalah tab di dalam Kalender, bukan halaman utama.
- Detail task adalah panel, bukan halaman.
- Navigasi utama berisi lima tujuan; Akun dibuka lewat ikon profil.
- Overlay (panel, formulir, dialog) bertumpuk maksimal tiga lapis.

## 2. Content Inventory

Aplikasi memuat 70 fitur dan 15 jenis konten. Fitur disusun per kategori hasil Content Categorization (Bagian 3), lengkap dengan sumbernya di dokumen FR.

### 2.1 Fitur (70 butir)

| Kategori | Fitur | Sumber FR |
| --- | --- | --- |
| K1 Akses (5) | AK-01 Daftar dengan email · AK-02 Masuk dengan email · AK-03 Masuk dengan Google · AK-04 Lupa dan reset password · AK-10 Pengalihan setelah login | U-02 sampai U-08, U-12 |
| K2 Akun (4) | AK-05 Ganti password · AK-06 Ubah nama tampil · AK-07 Atur zona waktu · AK-08 Keluar | U-09, U-10, U-11, U-14 |
| K3.1 Projek (9) | PR-01 Buat · PR-02 Ubah · PR-03 Kelola dokumen · PR-04 Daftar dengan filter status · PR-05 Detail · PR-06 Selesai dini · PR-07 Batal · PR-08 Hapus · PR-09 Buka kembali | A-01 sampai A-08 |
| K3.2 Sesi (5) | SE-01 Buat · SE-02 Lihat isi · SE-03 Ubah · SE-04 Hapus · SE-05 Batal | B-01 sampai B-06 |
| K4.1 Kelola task (9) | TK-01 Buat di sesi · TK-02 Buat mandiri · TK-03 Ubah · TK-04 Pindah · TK-05 Perbarui progress atau Selesai · TK-06 Riwayat progress · TK-07 Buka kembali · TK-08 Batal · TK-14 Hari terencana | C-01 sampai C-08, E-12 (baru) |
| K4.2 Temukan task (4) | TK-09 Daftar Task · TK-10 Filter dan pencarian · TK-11 Panel Detail task · TK-12 Aksi cepat di baris | H-01 sampai H-06, H-08, D-04 |
| K4.3 Label (1) | TK-13 Kelola label | C-03, H-07 |
| K5 Perencanaan harian (6) | TD-01 Tambah ke to-do · TD-02 Panel penyusunan · TD-03 Blok jam · TD-04 Ceklis dan status entri · TD-05 Daftar "Belum selesai" · TD-06 Halaman To-do | E-01 sampai E-11 |
| K6 Jadwal (5) | JD-01 Buat Jadwal · JD-02 Ubah, akhiri, hapus · JD-03 Pengecualian · JD-04 Peringatan dan penjelasan bentrok · JD-05 Jam kosong | F-01 sampai F-09 |
| K7 Kalender (5) | KL-01 Bulan · KL-02 Minggu · KL-03 Panel hari · KL-04 Aksi dari slot kosong · KL-05 Hari lewat baca-saja | G-01 sampai G-05 |
| K8.1 Ringkasan harian (5) | DB-01 Task telat · DB-02 Hari ini sampai 7 hari · DB-03 Ringkasan to-do · DB-04 Jam kosong hari ini · DB-07 Tambah task cepat dan empty state | D-02, D-03, D-06, D-09, D-10 |
| K8.2 Projek dan waktu (2) | DB-05 Ringkasan Projek · DB-06 Kalender mini | D-07, D-08 |
| K8.3 Pola kerja (1) | DB-08 Pola kerja | D-11, D-12 |
| K9 Sistem lintas-fitur (8) | AK-09 Login ulang saat sesi habis · LS-01 Konfirmasi berat · LS-02 Konfirmasi ringan · LS-03 Pembaruan instan dan pemeriksaan versi · LS-04 Mode offline · LS-05 Pasang ke layar utama · LS-06 Tema otomatis · LS-07 Status memuat dan gagal | U-13, I-03 sampai I-10, N-11, N-46, N-47, N-50, N-51, N-56, N-76 |
| Navigasi (1) | LS-08 Navigasi utama | FR baru J-01 sampai J-07 |

### 2.2 Konten (15 jenis)

| Konten | Atribut utama | Disimpan atau turunan |
| --- | --- | --- |
| Akun | Email, nama tampil, password (opsional), zona waktu | Disimpan |
| Projek | Nama (45), deskripsi (500), warna | Status turunan; hanya "batal" disimpan |
| Dokumen projek | Nama dan URL, maks 10 per projek | Disimpan |
| Sesi | Nama (45), deskripsi (500), tanggal mulai dan akhir | Status turunan; "batal" disimpan; "N dari M" turunan |
| Task | Nama (30), deskripsi (1000), deadline (tanggal, jam opsional), kesulitan 1–5 (wajib, nilai awal 3), progress 0–10, label | "Batal" dan waktu batal disimpan; telat dan "di luar periode" turunan |
| Label mandiri | Nama (30) | Disimpan |
| Riwayat progress | Tanggal dan jam, nilai sebelum dan sesudah, deskripsi, penanda | Disimpan, append-only |
| Entri to-do | Task, tanggal, ceklis, penanda "setelah deadline" | Status entri turunan dari riwayat |
| Blok jam | Jam mulai dan selesai, penanda "bentrok" | Disimpan |
| Jadwal | Nama (30), jam, pola mingguan atau sekali jalan, periode | Disimpan, berversi |
| Pengecualian Jadwal | Rentang tanggal, target (Jadwal tertentu atau "semua") | Disimpan |
| Jam kosong | Slot per hari, total jam, slot terpanjang | Turunan |
| Metrik Pola kerja | Task selesai, task dibuat, selesai, batal, rasio dikerjakan | Turunan |
| Teks sistem | Pesan error, empty state, peringatan, isi dialog | Statis |
| Email reset password | Tautan reset, berlaku 30 menit | Statis |

## 3. Content Categorization

Fitur dikelompokkan menjadi sembilan kategori menurut tujuan pengguna dan objek yang dikerjakan. Hierarki Projek → Sesi → Task dipertahankan karena itu inti model datanya.

| Kategori | Tujuan | Dasar pengelompokan |
| --- | --- | --- |
| K1 Akses | Masuk ke aplikasi | Pengunjung yang belum login; berada di luar menu |
| K2 Akun | Mengatur identitas dan sesi | Pengaturan milik pengguna setelah login |
| K3 Struktur kerja (Projek, Sesi) | Mewadahi pekerjaan | Siklus hidup projek dan sesi di dalamnya |
| K4 Task (Kelola task, Temukan task, Label) | Mengerjakan unit pekerjaan | Satu objek, dipecah menjadi mengelola, menemukan, dan melabeli |
| K5 Perencanaan harian | Memilih dan menjalankan rencana per hari | Entri to-do dan blok jam |
| K6 Jadwal | Mencatat kegiatan tetap dan sisa waktu | Jadwal berversi dan jam kosong |
| K7 Kalender | Meninjau waktu | Tampilan gabungan sesi, deadline, rencana, dan jam kosong |
| K8 Dashboard (Ringkasan harian, Projek dan waktu, Pola kerja) | Melihat kondisi sekarang | Cuplikan kategori lain; Pola kerja tetap di sini karena sifatnya refleksi data lampau |
| K9 Sistem lintas-fitur | Perilaku bersama | Dipakai semua kategori |

Tiap butir lintas-kategori punya satu rumah utama. Tampilan di tempat lain mengacu ke rumah itu.

| Butir | Rumah utama | Muncul juga di |
| --- | --- | --- |
| TK-12 dan TD-01 (tambah ke to-do) | K4.2 sebagai pemicu, K5 sebagai hasil | Dashboard |
| KL-04 (klik slot kosong) | K7 sebagai pemicu | K6 (JD-01) dan K5 (TD-03) sebagai tujuan |
| JD-05 (jam kosong) | K6 (logika hitung) | K7 dan K8 |
| PR-05 (Detail Projek) | K3.1 | Pusat bagi K3.2 dan pemicu TK-01 |
| TD-05 ("Belum selesai") | K5 | Ringkasan di DB-03 |
| TD-06 (daftar to-do) | K5 | Komponen yang sama dipakai panel hari K7 |

## 4. Sitemap

Aplikasi punya 11 halaman: 4 di zona publik dan 7 di zona terautentikasi, dengan kedalaman maksimal dua tingkat.

```
APLIKASI
├─ ZONA PUBLIK (di luar menu)
│   ├─ Masuk
│   ├─ Daftar
│   ├─ Lupa password
│   └─ Reset password (dari tautan)
└─ ZONA TERAUTENTIKASI (setelah login)
    ├─ Dashboard (halaman awal)
    ├─ Projek
    │    ├─ Daftar Projek
    │    └─ Detail Projek
    ├─ Daftar Task
    ├─ To-do
    ├─ Kalender
    │    ├─ tab Bulan
    │    ├─ tab Minggu
    │    └─ tab Jadwal
    │         ├─ Aktif
    │         ├─ Berakhir
    │         └─ Pengecualian
    └─ Akun
```

Sesi bukan halaman, melainkan bagian dari Detail Projek. Jadwal adalah tab Kalender, dan Detail task adalah panel yang dibahas di Bagian 6. Dashboard memuat Sekarang, Projek, Kalender mini, dan Pola kerja; To-do memuat hari ini dan mendatang serta "Belum selesai"; Akun memuat nama tampil, ganti password, zona waktu, dan keluar.

## 5. Navigation Architecture

Navigasi utama berisi lima tujuan: sidebar di laptop dan bilah bawah di HP. Akun dibuka lewat ikon profil, dan navigasi lain berada di dalam halaman.

### 5.1 Lapisan navigasi

| Lapisan | Laptop (≥1280 px) | HP (≥360 px) |
| --- | --- | --- |
| Primer | Sidebar kiri permanen | Bilah bawah, ikon dan label |
| Akun | Ikon profil di dasar sidebar | Ikon profil di bilah atas |
| Dalam halaman | Tab dan filter di atas konten | Sama, strip bisa digeser |
| Overlay | Panel samping atau dialog | Layar penuh atau sheet |
| Zona publik | Tanpa menu, hanya tautan antar-halaman | Sama |

Navigasi tampil di semua halaman terautentikasi dan posisinya sama di semua halaman.

### 5.2 Navigasi primer (5 item)

| # | Label | Tujuan | Kategori |
| --- | --- | --- | --- |
| 1 | Dashboard | Halaman awal | K8 |
| 2 | Projek | Daftar Projek | K3 |
| 3 | Task | Daftar Task | K4 |
| 4 | To-do | Halaman To-do | K5 |
| 5 | Kalender | Kalender | K6, K7 |

Item aktif disorot dengan warna, bobot, dan penanda. Tidak ada badge di item navigasi.

### 5.3 Navigasi dalam halaman

| Halaman | Elemen | Isi |
| --- | --- | --- |
| Kalender | Tab | Bulan · Minggu · Jadwal. Kalender mengingat tampilan terakhir, disimpan di perangkat (bukan di akun) |
| Kalender › Jadwal | Sub-tab | Aktif · Berakhir · Pengecualian |
| Daftar Projek | Filter | Status |
| Daftar Task | Filter dan pencarian | Projek atau Mandiri, sesi, label, status (termasuk Semua). Pencarian mencocokkan nama task, projek, dan label |
| Dashboard › Pola kerja | Pemilih rentang | Minggu ini sampai kustom |
| Detail Projek | Tautan kembali "Projek" | Breadcrumb tidak perlu (kedalaman dua tingkat) |
| To-do | Bagian | Hari ini dan mendatang · Belum selesai |

### 5.4 Aturan perilaku

| Aturan | Isi |
| --- | --- |
| Pengalihan masuk | Tanpa login → Masuk, lalu kembali ke tujuan semula (termasuk panel yang terbuka), atau Dashboard bila tidak ada |
| Sudah login | Membuka Masuk atau Daftar → Dashboard |
| Keluar | Menuju Masuk. Tombol Keluar ada di halaman Akun, terpisah dari item navigasi |
| Sesi habis | Bila formulir terbuka: dialog login ulang di tempat, tanpa mereset posisi, dengan email terkunci, tanpa tombol Batal, dan isian tidak hilang (untuk Google, isian disimpan lokal sebelum pengalihan). Bila tidak ada formulir: menuju Masuk dengan pesan sesi habis, lalu kembali ke tujuan semula |
| Offline | Navigasi tetap berfungsi. Halaman terbaca dari snapshot dengan tanda "Data per [waktu]", dan tombol ubah dinonaktifkan dengan penjelasan di dekat tombol. Perangkat tanpa snapshot menampilkan "Belum ada data di perangkat ini" dengan tombol Coba lagi |
| Status sistem | Satu bilah tipis yang tidak bisa ditutup untuk Menyambungkan, Offline, Tersambung kembali, versi baru aplikasi, dan galat. Tidak memakai toast |
| Alamat panel | Panel Detail task tercermin di alamat. Tombol kembali menutup panel |
| Kembali dan filter | Tombol kembali memulihkan filter dan posisi gulir. Membuka lewat menu primer mereset filter ke Aktif (H-03) |
| Overlay | Selalu ada tombol tutup. Esc menutup lapisan teratas. Di HP, gesek ke bawah menutup |
| Fokus | Setelah pindah halaman, fokus pindah ke area konten utama |

## 6. Screen Hierarchy

Halaman paling dalam hanya dua tingkat, dan overlay bertumpuk maksimal tiga lapis. Semua tugas utama terjangkau dalam tiga klik atau kurang.

### 6.1 Tingkat dan lapisan

| Tingkat | Layar |
| --- | --- |
| T1, publik | Masuk · Daftar · Lupa password · Reset password |
| T1, terautentikasi | Dashboard · Projek · Task · To-do · Kalender · Akun |
| T2 | Detail Projek (anak dari Projek) |
| Panel (P) | Detail task · Panel hari · Panel penyusunan |
| Formulir (F) | Buat dan ubah projek, sesi, task, blok, Jadwal, pengecualian, dan lainnya |
| Dialog (K) | Konfirmasi berat dan ringan · Kelola label · login ulang |

### 6.2 Inventaris layar

**Halaman**

| Kode | Layar | Tingkat | Pintu masuk |
| --- | --- | --- | --- |
| S-01 sampai S-04 | Masuk, Daftar, Lupa password, Reset password | T1 | Alamat langsung, pengalihan U-12, tautan email |
| S-10 | Dashboard | T1 | Navigasi primer, halaman awal setelah login |
| S-11 | Daftar Projek | T1 | Navigasi primer, "lihat semua" Dashboard |
| S-12 | Detail Projek | T2 | Kartu projek, chip projek, garis sesi Kalender |
| S-13 | Daftar Task | T1 | Navigasi primer, "lihat semua" telat, chip label |
| S-14 | To-do | T1 | Navigasi primer, tautan ringkasan Dashboard |
| S-15 | Kalender (Bulan, Minggu, Jadwal) | T1 | Navigasi primer |
| S-16 | Akun | T1 | Ikon profil |

**Panel**

| Kode | Layar | Dibuka dari |
| --- | --- | --- |
| P-01 | Detail task: edit, pindah, progress, riwayat, hari terencana, batal, buka kembali | Dashboard, Detail Projek, Daftar Task, To-do, panel hari |
| P-02 | Panel hari | Kalender (Bulan dan Minggu), kalender mini Dashboard |
| P-03 | Panel penyusunan (menimpa halaman) | To-do, Daftar Task |

**Formulir dan dialog**

| Layar | Dibuka dari |
| --- | --- |
| Buat atau ubah projek | Daftar Projek (buat), Detail Projek (ubah) |
| Kelola dokumen projek | Detail Projek |
| Buat atau ubah sesi (termasuk alur buka kembali projek) | Detail Projek |
| Buat task | Dashboard, Daftar Task, Detail Projek |
| Ubah dan pindah task | Detail task |
| Progress dengan deskripsi | Detail task (kontrol cepat inline di baris task dan entri to-do) |
| Blok jam | To-do, panel penyusunan, panel hari |
| Jadwal sekali jalan | Slot kosong di panel hari |
| Jadwal berulang | Tab Jadwal |
| Tambah pengecualian | Tab Jadwal › Pengecualian |
| Kelola label (dialog) | Daftar Task |
| Konfirmasi berat dan ringan | Semua aksi sesuai I-03 |
| Login ulang | Semua halaman saat sesi habis |

### 6.3 Aturan kedalaman dan penumpukan

- Halaman maksimal dua tingkat.
- Overlay maksimal tiga lapis: panel, lalu formulir, lalu dialog konfirmasi.
- Panel tidak menumpuk di atas panel. Membuka Detail task dari panel hari menggantikan isi panel dan menyediakan tombol "Kembali ke hari". Panel penyusunan menimpa halaman dan tidak membuka panel lain.
- Formulir dan dialog boleh di atas panel, maksimal satu formulir dan satu dialog konfirmasi sekaligus. Dialog login ulang adalah satu-satunya yang boleh bertumpuk di atas formulir.
- Jenis tampilan: panel berupa panel samping di laptop dan layar penuh di HP; formulir berupa dialog di laptop dan sheet dari bawah di HP; panel penyusunan menimpa halaman di keduanya; konfirmasi berupa dialog tengah di keduanya. Kelola label dikecualikan: berupa dialog tengah di HP juga (J-06).

### 6.4 Hierarki isi halaman

**Dashboard.** Prioritas isi: telat → hari ini sampai 7 hari → to-do dan jam kosong → kalender mini → projek → pola kerja.

- Laptop: kolom utama berisi Telat dan Hari ini + 7 hari. Kolom samping berisi ringkasan to-do dan jam kosong, lalu kalender mini. Di bawah, selebar penuh, Projek lalu Pola kerja (dimuat terakhir).
- HP: satu kolom dengan urutan telat, jam kosong hari ini, to-do, 7 hari, kalender mini, projek, pola kerja.

**Detail Projek.** Ringkasan dan aksi → dokumen → sesi berjalan dan berikutnya (terbuka) → sesi selesai dan batal (terlipat).

### 6.5 Kedalaman jangkauan tugas utama

| Tugas | Jalur | Klik |
| --- | --- | --- |
| Tambah task cepat | Dashboard › Tambah task | 2 |
| Tambah task di sesi | Projek › kartu › Tambah task | 3 |
| Perbarui progress | Task › kontrol progress cepat | 2 |
| Rencanakan task ke to-do | Task › Tambah ke to-do › pilih hari | 3 |
| Blok jam | To-do › Tambah blok (atau Kalender › hari › slot › Blok = 4) | 2 |
| Jadwal berulang | Kalender › tab Jadwal › Tambah | 3 |
| Selesai dini projek | Projek › kartu › Selesai dini (lalu dialog) | 3 |
| Ganti password | Ikon profil › Ganti password | 2 |

## 7. Content Relationship

Tiap konten punya satu rumah pengelolaan, dan perubahan di rumah itu merambat ke tampilan lain. Bagian ini memetakan relasi datanya, tempat tiap konten tampil, pintasan antarhalaman, dan efek riaknya.

### 7.1 Relasi antar-informasi

| Hubungan | Kardinalitas | Aturan kunci |
| --- | --- | --- |
| Akun → seluruh data | 1:N | Isolasi penuh per akun (U-01) |
| Projek → Sesi | 1:N | Sesi non-batal tidak tumpang tindih; nama unik di antara sesi non-batal |
| Projek → Dokumen | 1:N | Maksimal 10 |
| Sesi → Task | 1:N | Deadline dalam periode sesi |
| Task mandiri → Label | N:1 | Label wajib, unik tanpa beda kapital. Label tidak bisa diganti kecuali task dipindahkan ke sesi. Label yang punya task (aktif, selesai, atau batal) tidak bisa dihapus |
| Task sesi → Label | Otomatis | Sama dengan nama projek (turunan) |
| Task → Riwayat progress | 1:N | Append-only |
| Task → Entri to-do | 1:N | Satu entri per task per hari |
| Entri to-do → Blok jam | 1:N | Tidak bentrok antar blok maupun dengan Jadwal |
| Jadwal → Versi | 1:N | Edit membuat versi baru mulai tanggal berlaku |
| Pengecualian ↔ Jadwal | N:N | Opsi "semua" bersifat dinamis |
| Jam kosong | Turunan | Dari Jadwal aktif dan blok; slot di bawah 30 menit tidak dihitung |
| Pola kerja | Turunan | Dari riwayat progress, entri to-do, dan task |

### 7.2 Matriks konten × layar

Simbol ● berarti tempat membuat atau mengubah, ○ berarti hanya tampil atau ringkasan, dan sel kosong berarti tidak tampil. Singkatan: DB Dashboard · PJ Daftar Projek · DP Detail Projek · TK Daftar Task · TD To-do · KL Kalender · JD tab Jadwal · DT Detail task · AK Akun.

| Konten | DB | PJ | DP | TK | TD | KL | JD | DT | AK |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Projek | ○ | ● | ● | ○ | | ○ | | ○ | |
| Sesi | ○ | ○ | ● | ○ | | ○ | | ○ | |
| Task | ● | | ● | ● | ○ | ○ | | ● | |
| Label | ○ | | | ● | | | | ○ | |
| Riwayat progress | | | | | | | | ○ | |
| Entri to-do | ○ | | | ● | ● | ● | | ○ | |
| Blok jam | | | | ● | ● | ● | | | |
| Jadwal | | | | | | ● | ● | | |
| Pengecualian | | | | | | | ● | | |
| Jam kosong | ○ | | | | | ○ | | | |
| Pola kerja | ○ | | | | | | | | |
| Akun | | | | | | | | | ● |

Komponen bersama (baris task, chip, kontrol progress, panel hari) berperilaku identik di semua tempat (N-21).

### 7.3 Pintasan antarhalaman

| Dari | Pemicu | Ke | Konteks yang dibawa |
| --- | --- | --- | --- |
| Dashboard | "Lihat semua" telat | Daftar Task | Filter Telat |
| Dashboard | "Lihat semua" projek | Daftar Projek | — |
| Dashboard | Kartu projek | Detail Projek | Projek terpilih |
| Dashboard | Ringkasan to-do | To-do | — |
| Dashboard | Hari di kalender mini | Panel hari | Tanggal terpilih |
| Dashboard, Daftar Task, Detail Projek, To-do, panel hari | Baris task | Detail task | Task terpilih |
| Dashboard | Tambah task | Formulir task | — |
| Daftar Projek | Kartu | Detail Projek | Projek terpilih |
| Detail Projek | Tambah task pada sesi | Formulir task | Sesi terisi |
| Daftar Task | Chip projek | Detail Projek | Projek terpilih |
| Daftar Task | Chip label | Daftar Task | Filter label |
| Daftar Task | Tambah ke to-do | Pilihan hari atau panel penyusunan | Task terpilih |
| To-do | Baris "Belum selesai" | To-do hari ini | Entri tanpa blok |
| Kalender | Garis sesi | Detail Projek | Projek terpilih |
| Kalender | Hari | Panel hari | Tanggal terpilih |
| Panel hari | Slot kosong | Formulir Jadwal sekali jalan atau Blok | Tanggal dan jam slot |
| Detail task | Chip projek | Detail Projek | Projek terpilih |
| Detail task | Hari terencana | To-do atau Kalender | Tanggal terpilih |
| Blok bertanda "bentrok" | Tanda bentrok | Tab Jadwal | Jadwal penyebab |
| Form projek | Tautan "Kelola label" pada pesan nama bentrok dengan label yang punya task | Kelola label (dialog) | Label yang bentrok |
| Masuk, Daftar, Lupa password | Tautan antar-halaman | Sesamanya | — |
| Email reset | Tautan | Reset password | Token |

### 7.4 Efek riak

| Perubahan | Yang ikut berubah | FR |
| --- | --- | --- |
| Ganti nama projek | Label semua task sesi di Daftar Task, Dashboard, Detail task, dan garis sesi Kalender | A-05, C-03 |
| Ubah periode sesi | Task keluar periode ditandai "di luar periode"; status sesi dan projek dihitung ulang, projek bisa menjadi selesai | B-05 |
| Progress 10 atau Selesai | Entri mendatang dihapus (entri hari ini tetap); daftar telat dan 7 hari Dashboard; "N dari M"; status projek (bisa selesai dan terkunci); Pola kerja | C-06, E-08 |
| Batal task, sesi, atau projek | Cascade ke task aktif; entri mendatang dihapus; jam kosong bertambah; Pola kerja menghitung batal | A-05, B-06 |
| Selesai dini projek | Sesi dipotong sampai kemarin; sesi mendatang dihapus atau ditandai batal; garis sesi Kalender berubah | A-04 |
| Ubah progress atau ceklis | Progress otomatis mencentang entri yang sudah ada di To-do dan panel hari | E-06 |
| Tambah atau ubah Jadwal atau blok | Jam kosong dihitung ulang di Kalender dan Dashboard; blok tertimpa ditandai "bentrok" dengan penjelasan dan tautan ke Jadwal penyebab | F-07, F-08 |
| Pindah task | Label berubah; deadline lama divalidasi ulang; projek asal bisa menjadi selesai | C-04 |
| Ganti zona waktu | "Hari ini" bergeser (tidak pernah mundur); berlaku ke depan | U-14 |
| Buka kembali projek atau task | Kunci dilepas; task di sesi selesai langsung telat | A-07, C-07 |

## 8. Butir terbuka dan dampak ke dokumen lain

Bagian ini mencatat dampak struktur informasi pada dokumen lain. Semua perubahan di bawah sudah diterapkan ke Spesifikasi Kebutuhan dan Dokumen Use Case pada 15 Nov 2026, dan tidak ada butir yang tersisa terbuka dari dokumen ini.

### 8.1 Butir terbuka

Tidak ada. Dua butir yang sebelumnya terbuka sudah selesai:

1. **Penyimpanan tampilan terakhir Kalender.** Diputuskan disimpan di perangkat (localStorage), tidak di akun (Arsitektur Sistem DA-9), sehingga Akun tidak mendapat atribut baru.
2. **Bagian 5 Spesifikasi Kebutuhan.** Heading yang sebelumnya kosong sudah diisi: tidak ada butir yang belum diputuskan.

### 8.2 FR baru (sudah diterapkan)

| ID | Isi |
| --- | --- |
| J-01 | Navigasi primer 5 item. Sidebar di laptop, bilah bawah di HP, ikon dan label, item aktif disorot, posisi sama di semua halaman |
| J-02 | Akun lewat ikon profil. Tombol Keluar terpisah dari item navigasi |
| J-03 | Tab Kalender (Bulan, Minggu, Jadwal) dan sub-tab Jadwal (Aktif, Berakhir, Pengecualian). Kalender mengingat tampilan terakhir, disimpan di perangkat |
| J-04 | Panel Detail task tercermin di alamat. Tombol kembali menutup panel |
| J-05 | Kembali memulihkan filter dan posisi gulir. Membuka lewat menu primer mereset filter (selaras H-03) |
| J-06 | Aturan overlay: jenis tampilan per perangkat, maksimal 3 lapis, panel tidak menumpuk, Esc menutup lapisan teratas, selalu ada tombol tutup |
| J-07 | Setelah pindah halaman, fokus pindah ke area konten utama |
| E-12 | Detail task menampilkan daftar hari terencana (baca-saja) dengan tautan ke To-do atau Kalender |

Huruf grup "J" dipakai untuk Navigasi dan layar karena huruf lain sudah terpakai.

### 8.3 FR yang diubah (sudah diterapkan)

| Butir | Perubahan |
| --- | --- |
| D-01 dan N-54 | Tata letak Dashboard final (Bagian 6.4) |
| F-06 | "Tab Jadwal" menjadi tab di dalam Kalender. Pengecualian ditampilkan sebagai daftar sub-tab |
| F-08 | Blok bertanda "bentrok" menampilkan penjelasan dan tautan ke Jadwal penyebabnya |
| E-03 | Panel penyusunan dibuka dari To-do dan Daftar Task |
| H-06 dan C-08 | Detail task menjadi panel tanpa halaman. Riwayat progress berada di dalamnya |
| H-07 | Kelola label berupa dialog |
| A-08 | Urutan isi Detail Projek (Bagian 6.4) |
| U-09, U-10, U-11, U-14 | Lokasi: halaman Akun |
| U-12 | Pengalihan setelah login juga mengembalikan panel yang terbuka |

### 8.4 NFR dan use case (sudah diterapkan)

| Dokumen | Perubahan |
| --- | --- |
| N-21 | Tambah komponen berulang: panel Detail task dan daftar hari terencana |
| N-53 dan N-54 | Selaras dengan tata letak Dashboard final |
| UC-21 sampai UC-25 | "Detail task" berupa panel; riwayat progress (UC-23 A4) di dalam panel |
| UC-26 | Kelola label berupa dialog |
| UC-29 | A4: blok bertanda bentrok menjelaskan dan menautkan ke Jadwal |
| UC-32 dan UC-34 | Lokasi di tab Jadwal Kalender; pengecualian berupa sub-tab |
| UC-36 | Tab Jadwal; Kalender mengingat tampilan terakhir, disimpan di perangkat (A7) |
| UC-37 | Tata letak sudah diputuskan. A5 yang lama dihapus, dan A5 yang sekarang adalah keadaan data lokal tampil dengan bilah "Menyambungkan…" (AU-7) |
| UC-39 | "Melihat detail task" (riwayat progress dan hari terencana), sudah ada |
