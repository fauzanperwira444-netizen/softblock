> Salinan arsip dari dokumen Claude Docs: https://claude.ai/artifact/5rgSTWhijvkaMWrZVCDtTz (versi hidup, diperbarui di sana bila ada perubahan). Salinan ini diperbarui 2026-11-15 dengan perubahan dari dokumen Arsitektur Informasi (Bagian 8), lalu pada hari yang sama dengan keputusan dari wireframe (C-01, C-02, C-04, H-03, H-04, H-06, G-03, U-06, U-13, N-11, N-46, N-47, N-50, N-53, dan N-76 yang baru). Terakhir pada hari yang sama, amendemen dari dokumen Arsitektur Sistem (Bagian 11) diterapkan pada N-01, N-05, N-08, N-10, N-12, N-25, N-29, N-30, N-32, N-33, N-35, N-37, N-38, N-39, N-41, N-43, N-46, N-47, N-48, N-60, N-61, N-62, N-63, N-65 sampai N-69, N-71, N-72, N-74, dan N-75, dengan N-77 yang baru, ditambah E-07, D-12, J-03, U-13, dan Bagian 5.

# Spesifikasi Kebutuhan Produk: Perencana Kerja Pribadi (FR dan NFR)

Nov 15, 2026 · @cah

## 1. Ringkasan produk

Produk ini adalah aplikasi web perencana kerja pribadi: pekerjaan diatur dalam struktur Projek → Sesi → Task, lalu dijadwalkan sebagai to-do harian berblok jam di antara Jadwal tetap, dengan Kalender dan Dashboard untuk melihat beban dan pola kerja.

- **Pengguna:** siapa saja yang mendaftar (email + password atau Google). Tiap akun terpisah penuh dan dipakai satu orang.
- **Struktur kerja:** Projek berisi Sesi (rentang tanggal). Task berada di sebuah sesi (berlabel nama projek) atau berdiri sendiri sebagai task mandiri dengan label sendiri.
- **Perencanaan harian:** to-do harian (satu entri per task per hari, boleh punya blok jam), Jadwal tetap (mingguan atau sekali jalan), dan jam kosong yang dihitung otomatis.
- **Pemantauan:** Kalender (bulan dan minggu) dan Dashboard (task telat, tujuh hari ke depan, projek, pola kerja).
- **Platform:** aplikasi web responsif untuk laptop dan HP, bisa dipasang ke layar utama, hanya bahasa Indonesia, baca-saja saat offline.

Dokumen ini memuat 96 kebutuhan fungsional (FR, Bagian 3) dan 77 kebutuhan non-fungsional (NFR, Bagian 4). Hal yang belum diputuskan ada di Bagian 5.

## 2. Istilah dan aturan lintas fitur

Bagian ini menetapkan istilah dan aturan yang dipakai di semua fitur. Rujukan seperti A-04 menunjuk butir di Bagian 3.

### 2.1 Istilah baku

- **Aktif:** task yang belum selesai dan belum batal.
- **Telat:** task aktif yang deadline-nya sudah lewat (tanggal dan jam; tanpa jam dianggap 23.59).
- **Task mandiri:** task yang tidak berada di sesi mana pun dan punya label sendiri.
- **Projek tertutup:** projek berstatus selesai atau batal. Projek tertutup terkunci: tidak bisa diedit dan tidak menerima sesi atau task baru, kecuali dibuka kembali (A-07). Istilah "tertutup" hanya untuk projek.
- **Hari lewat:** hari sebelum hari ini. Batasnya 00.00 menurut zona waktu akun. Hari lewat membeku.
- **Status turunan:** status yang dihitung saat dibaca dan tidak disimpan. Yang disimpan hanya "batal" (projek, sesi, task) beserta waktu batal task.
- Semua tanggal bersifat inklusif (tanggal awal dan akhir sama-sama termasuk). Riwayat bersifat append-only. Jadwal berversi.

### 2.2 Status projek

| Status | Arti |
| --- | --- |
| Belum dijadwalkan | Belum punya sesi non-batal |
| Belum mulai | Semua sesi non-batal belum mulai |
| Berjalan | Hari ini berada di dalam sebuah sesi non-batal |
| Jeda | Hari ini di antara dua sesi non-batal: sesi sebelumnya sudah lewat, berikutnya belum mulai |
| Melewati jadwal | Sesi terakhir sudah lewat tetapi masih ada task aktif |
| Selesai | Sesi terakhir sudah lewat dan tidak ada task aktif |
| Batal | Disimpan, hasil batal projek (A-05) |

### 2.3 Aturan nama

| Objek | Maks. karakter | Unik di antara | Catatan |
| --- | --- | --- | --- |
| Projek | 45 | Semua projek, tanpa beda kapital, spasi ujung dipangkas | Tidak boleh sama dengan label mandiri mana pun. "Mandiri" dicadangkan |
| Sesi | 45 | Sesi non-batal dalam satu projek | Sesi batal tidak dihitung |
| Task | 30 | Task aktif dengan label yang sama | Boleh sama bila label berbeda |
| Label mandiri | 30 | Semua label, tanpa beda kapital | Tidak boleh sama dengan nama projek. "Mandiri" dicadangkan |
| Jadwal | 30 | Tidak diatur |  |

### 2.4 Aturan penutupan projek

Setiap aksi yang membuat status turunan projek menjadi selesai memakai konfirmasi berat dengan baris "Projek akan menjadi selesai dan terkunci". Aksi yang tercakup: selesai dini (A-04), ubah periode sesi (B-05), hapus atau batal sesi (B-06), pindah task (C-04), batal task (C-05), dan Selesai pada task (C-06). Tingkat konfirmasi lengkap ada di Bagian 3.12.

## 3. Kebutuhan fungsional (FR)

Kebutuhan dikelompokkan per fitur. Huruf pada ID menunjukkan grup asal (A Projek, B Sesi, C Task/Label/Progress, D Dashboard, E To-do, F Jadwal, G Kalender, H Daftar Task, I Konfirmasi, J Navigasi dan layar, U Akun). Semua data berlaku per akun (U-01).

### 3.1 Projek (A-01 sampai A-08)

- **A-01 Buat projek.** Nama wajib dan mengikuti aturan nama (2.3). Bila nama bentrok dengan label mandiri (termasuk yang tanpa task), pesan error menyebut label itu dan menawarkan "Ganti nama" atau "Hapus label". Label yang sudah punya task (aktif, selesai, atau batal) tidak bisa dihapus (C-03): untuk label seperti itu tautan "Hapus label" diganti "Kelola label" dan hanya "Ganti nama" yang ditawarkan. Deskripsi opsional, maks 500 karakter. Dokumen tidak diisi saat pembuatan.
- **A-02 Warna.** Warna harus berbeda dari semua projek yang belum tertutup. Pilihan: otomatis dari palet (awal 12 warna, lolos kontras) atau manual bebas. Warna manual harus cukup berbeda secara visual dan berkontras minimal 3:1 di tema terang dan gelap, kalau tidak ditolak. Warna projek tertutup boleh dipakai lagi. Saat buka kembali (A-07), pengguna wajib memilih warna baru bila warna lama bentrok.
- **A-03 Status turunan.** Status projek mengikuti tabel di 2.2. Hanya "batal" yang disimpan. Tanggal akhir inklusif.
- **A-04 Selesai dini** (konfirmasi berat). Hanya untuk projek berstatus berjalan atau jeda dan tanpa task aktif. Pada status belum dijadwalkan dan belum mulai, tombolnya nonaktif. Sesi berjalan dipotong sampai kemarin. Sesi yang mulai hari ini dan sesi belum mulai dihapus bila kosong dan ditandai batal bila bertask. Sesi lewat tetap. Task selesai dengan deadline setelah titik potong ditandai "di luar periode". Akibatnya, projek yang satu-satunya sesinya baru mulai hari ini tampil "belum dijadwalkan" setelah diselesaikan dini.
- **A-05 Edit dan batal.** Edit (nama, deskripsi, warna, dokumen) hanya untuk projek belum tertutup, dengan validasi nama seperti A-01. Batal projek (konfirmasi berat) bisa dilakukan dari semua status kecuali selesai dan batal: task aktif dibatalkan; sesi berjalan dan belum mulai ditandai batal; sesi lewat, task selesai, dan riwayat tetap. Projek tanpa sesi bertask: batal berarti dihapus. Projek dengan sesi bertask: berstatus batal.
- **A-06 Hapus.** Projek tanpa sesi bisa dihapus (konfirmasi ringan). Projek yang pernah punya sesi bertask tidak bisa dihapus.
- **A-07 Buka kembali.** Projek selesai atau batal bisa dibuka kembali (konfirmasi ringan) lewat satu alur: menambah sesi baru yang berakhir pada atau setelah hari ini. Bila alur dibatalkan, status tidak berubah. Sesi yang terhapus atau batal dan task batal tidak dipulihkan.
- **A-08 Halaman dan detail Projek.** Halaman Projek menampilkan kartu berisi nama, deskripsi singkat, timeline, sesi, warna, dan status, dengan filter status (default semua status). Urutan: projek dengan sesi bertanggal akhir terdekat (berjalan lebih dulu), jeda, tanpa sesi, melewati jadwal, tertutup, lalu abjad nama sebagai pemutus. Detail projek memuat, berurutan dari atas:
  - ringkasan "N dari M task selesai" (M tidak menghitung task batal);
  - aksi: edit, tambah sesi (ditekankan bila projek tanpa sesi), selesai dini, batal, hapus, buka kembali. Aksi yang prasyaratnya belum terpenuhi dinonaktifkan;
  - dokumen (maks 10, nama wajib, "https://" ditambahkan otomatis bila tanpa skema, terkunci di projek tertutup);
  - sesi dan task per sesi (sesi berjalan dan berikutnya tampil terbuka, sesi selesai dan batal terlipat; task selesai atau batal tampil tetapi bukan prioritas).

### 3.2 Sesi (B-01 sampai B-06)

- **B-01 Buat sesi.** Dibuat lewat "Tambah sesi" di detail projek, hanya untuk projek belum tertutup. Nama mengikuti aturan nama (2.3). Tanggal akhir pada atau setelah tanggal mulai, dan pada atau setelah hari ini. Deskripsi opsional, maks 500 karakter.
- **B-02 Isi sesi.** Sesi menampilkan dokumen projek (hanya dibuka) dan ringkasan "N dari M task selesai".
- **B-03 Tanpa tumpang tindih.** Sesi tidak boleh bertumpang tindih dengan sesi non-batal dalam projek yang sama (inklusif: akhir tanggal 14 dan mulai tanggal 15 diperbolehkan). Pesan error menyebut sesi yang bertabrakan. Tumpang tindih dengan sesi batal diperbolehkan.
- **B-04 Status turunan.** Sesi berstatus belum mulai, berjalan, atau selesai (turunan), dan batal (disimpan). Sesi selesai yang masih punya task aktif tetap berstatus selesai dengan penanda "N task belum selesai".
- **B-05 Ubah periode.** Hanya untuk sesi belum mulai atau berjalan; sesi selesai terkunci. Dialog berat memuat semua task yang akan keluar periode (maks 5 nama dan "dan N lainnya"). Tanda "di luar periode" bersifat turunan. Perubahan yang membuat projek menjadi selesai memakai konfirmasi berat dengan baris "Projek akan menjadi selesai dan terkunci".
- **B-06 Edit, hapus, batal.**
  - Edit nama atau deskripsi berlaku untuk sesi belum mulai, berjalan, dan selesai. Sesi batal hanya dilihat dan namanya tidak dihitung untuk keunikan.
  - Hapus (konfirmasi ringan; berat bila projek menjadi selesai) hanya untuk sesi belum mulai tanpa task dan sesi batal tanpa task.
  - Batal sesi (konfirmasi berat): task aktif dibatalkan, periode tidak dipotong, task selesai dan riwayat tetap. Sesi batal bersifat permanen.

### 3.3 Task (C-01, C-02, C-04, C-05)

- **C-01 Task sesi.** Dibuat lewat tombol per sesi di detail projek atau dari Daftar Task, hanya untuk sesi belum mulai atau berjalan di projek belum tertutup.
  - Nama wajib, maks 30 karakter. Boleh sama dengan task lain selama labelnya berbeda; unik hanya di antara task aktif berlabel sama (2.3).
  - Deskripsi opsional, maks 1000 karakter.
  - Deadline wajib berupa tanggal dalam periode sesi dan pada atau setelah hari ini. Jam opsional, bebas kelipatan 5 menit, dan tidak boleh jam yang sudah lewat.
  - Kesulitan wajib, 1 sampai 5, berupa angka tanpa keterangan. Nilai awal pada formulir adalah 3.
- **C-02 Task mandiri.** Dibuat dari Daftar Task. Label wajib (C-03). Deadline opsional dengan aturan yang sama seperti C-01. Kesulitan wajib seperti C-01.
- **C-04 Edit dan pindah** (hanya task aktif).
  - Validasi deadline hanya berjalan saat deadline atau sesi berubah.
  - Pindah dilakukan satu per satu: mandiri ke sesi, sesi ke mandiri, atau antar-sesi. Tujuan hanya sesi belum mulai atau berjalan. Formulir pindah menampilkan deadline lama dan memintanya diganti bila tidak valid di tujuan.
  - Pindah ke mandiri mewajibkan memilih label. Label berubah otomatis mengikuti tujuan. Nama tidak boleh bentrok dengan task aktif di label tujuan.
  - Label task mandiri tidak bisa diubah lewat Ubah, dan Pindah tidak mencakup mandiri ke mandiri. Label task mandiri hanya berganti bila task dipindahkan ke sesi.
  - Pemindahan tidak dicatat. Bila pemindahan membuat projek asal menjadi selesai, berlaku aturan penutupan projek (2.4).
- **C-05 Batal task.** Konfirmasi ringan (berat bila aksi ini membuat projek menjadi selesai). Tidak bisa dipulihkan. Task batal hanya dilihat. Alasan tidak dicatat. Waktu batal disimpan sebagai metadata.

### 3.4 Label (C-03, H-07)

- **C-03 Label.**
  - Task sesi otomatis berlabel nama projeknya. Label ikut berubah bila projek diganti nama dan tidak bisa diganti dari Daftar Task.
  - Task mandiri wajib punya satu label, dipilih dari saran (label mandiri yang pernah punya task) atau dibuat baru. Saran diurutkan dari yang terakhir dipakai.
  - Label maks 30 karakter dan unik tanpa beda kapital (2.3). Mengetik nama label lama yang tanpa task memakai ulang label itu. Ganti nama yang bentrok ditolak.
  - Label tanpa task sama sekali boleh dihapus (konfirmasi ringan). Label yang punya task (aktif, selesai, atau batal) tidak bisa dihapus.
- **H-07 Kelola label.** Berupa dialog yang dibuka dari Daftar Task. Menampilkan semua label mandiri, termasuk yang tanpa task, dengan aksi ganti nama dan hapus.

### 3.5 Progress (C-06 sampai C-09)

- **C-06 Progress.**
  - Bilangan bulat 0 sampai 10, awal 0. Bisa diubah dari to-do, Daftar Task, dan detail task.
  - Nilai baru harus berbeda dari nilai sekarang. Deskripsi opsional, maks 500 karakter. Riwayat tidak bisa diedit.
  - Progress 10 adalah satu-satunya jalan menjadi selesai. Mengisi 10 lewat kontrol mana pun sama dengan "Selesai" dan tanpa konfirmasi, kecuali bila aksi itu membuat projek menjadi selesai (konfirmasi berat, 2.4).
- **C-07 Buka kembali task selesai.**
  - Progress kembali ke nilai sebelum 10. Tanpa konfirmasi.
  - Ditolak di projek tertutup dan di sesi batal. Di projek selesai, projeknya dibuka kembali dulu (A-07).
  - Bila nama bentrok dengan task aktif berlabel sama, formulir meminta nama baru.
  - Entri to-do lama tidak dikembalikan.
  - Di sesi selesai, task yang dibuka kembali langsung telat. Jalan keluarnya: pindahkan ke sesi baru (C-04).
- **C-08 Riwayat progress.** Berada di dalam panel detail task (H-06). Urutan terbaru dulu. Tiap baris berisi tanggal dan jam, nilai sebelum dan sesudah, deskripsi, serta penanda Selesai atau Buka kembali.
- **C-09 Progress di baris daftar.** Tidak memengaruhi urutan. Bentuk tampilannya ditentukan di desain visual dan tidak boleh hanya mengandalkan warna.

### 3.6 Daftar Task (H-01 sampai H-06, H-08, D-04)

- **H-01 Halaman.** Menampilkan semua task, dengan tombol Tambah task dan Kelola label.
- **H-02 Default dan urutan.** Filter default Aktif (termasuk telat). Task selesai diurut menurut waktu selesai terbaru, task batal menurut waktu batal terbaru. Task tanpa deadline paling bawah.
- **D-04 Urutan task aktif.** Tanggal, lalu jam, lalu kesulitan 1 ke 5 (mudah dulu), lalu abjad nama. Tanpa jam dianggap 23.59. Task tanpa deadline diurut kesulitan, lalu abjad. Aturan ini juga dipakai Dashboard.
- **H-03 Filter.**
  - Satu nilai per dimensi, dimensi digabung: projek atau Mandiri, sesi (ditampilkan dengan periodenya), label mandiri, dan status (Aktif, Telat, Selesai, Batal, Di luar periode, Tanpa deadline), ditambah pilihan "Semua" (tanpa filter status).
  - Status Telat, Di luar periode, dan Tanpa deadline hanya mencocokkan task aktif. Tanda "di luar periode" pada task selesai (A-04) tetap tampil di barisnya.
  - Filter kembali ke Aktif saat halaman dibuka lagi, kecuali saat datang dari klik chip label.
- **H-04 Pencarian.** Pencarian mencocokkan nama task, nama projek, dan nama label. Pencarian melepas default Aktif (status yang dipilih eksplisit tetap berlaku). Urutan hasil: aktif, selesai, batal.
- **H-05 Baris task.** Menampilkan nama, chip, deadline, kesulitan, progress, dan tanda. Aksi pada task aktif: tambah ke to-do, Selesai, kontrol progress cepat, detail. Task selesai atau batal hanya punya aksi detail.
- **H-06 Panel detail task.** Detail task berupa panel, bukan halaman: panel samping di laptop, layar penuh di HP (J-06). Panel menyediakan aksi sesuai status task dan memuat riwayat progress (C-08) serta hari terencana (E-12). Hanya-baca untuk task selesai atau batal di projek tertutup atau sesi batal. Task aktif di sesi selesai tetap punya semua aksi (C-07).
- **H-08 Chip.** Chip projek membuka detail projek. Chip label menerapkan filter label.

### 3.7 To-do Harian (E-01 sampai E-12)

- **E-01 Satu entri per hari.** Satu task hanya punya satu entri per hari. Hari setelah deadline diberi penanda "setelah deadline" dan tidak ditolak.
- **E-02 Dua jalur menambah entri.** Dari baris task (satu hari) dan dari panel penyusunan (pilih banyak task).
- **E-03 Panel penyusunan.** Panel dibuka dari halaman To-do dan Daftar Task, dan menimpa halaman. Menyeret ke slot jam pada entri yang sudah ada menambah blok. Dibangun paling akhir.
- **E-04 Blok jam.** Satu entri boleh punya beberapa blok.
  - Hanya pada 06.00 sampai 24.00 dalam satu hari, mulai lebih awal dari selesai.
  - Kelipatan 5 menit (seret ke kelipatan 15).
  - Blok baru tidak boleh bentrok dengan blok lain atau Jadwal.
  - Blok hari ini boleh berada di jam yang sudah lewat.
- **E-05 Perubahan.** Hari ini bebas diubah. Hari lewat membeku.
- **E-06 Ceklis.** Ceklis per entri, bisa dicabut. Mengubah progress otomatis mencentang entri yang sudah ada. Progress pada task tanpa entri tidak membuat entri baru.
- **E-07 Status entri.** Berasal dari riwayat, dengan prioritas: dibatalkan, selesai, dikerjakan, tidak dikerjakan. "Dikerjakan" berarti entri dicentang atau ada riwayat progress untuk task itu pada tanggal entri. Selesai lalu dibuka kembali pada hari yang sama dihitung "dikerjakan".
- **E-08 Task selesai atau batal.** Entri hari ini tetap tampil. Entri mendatang dihapus.
- **E-09 "Belum selesai".** Daftar entri tidak dikerjakan dalam 7 hari terakhir dari task aktif, satu baris per task. Satu ketukan menambahkannya ke hari ini (tanpa blok). Tidak otomatis. Task yang sudah punya entri hari ini tidak tampil.
- **E-10 Redup.** Blok diredupkan bila jamnya sudah lewat dan entrinya belum dicentang.
- **E-11 Halaman To-do.** Halaman khusus untuk hari ini dan mendatang. Hari lampau hanya ada di Kalender. Komponen daftarnya dipakai bersama panel hari Kalender.
- **E-12 Hari terencana di detail task.** Detail task menampilkan daftar hari yang sudah memuat entri to-do untuk task itu (hanya-baca). Tiap hari menjadi tautan ke halaman To-do atau Kalender pada hari tersebut.

### 3.8 Jadwal dan Jam Kosong (F-01 sampai F-09)

- **F-01 Jadwal.** Nama maks 30 karakter. Jam 06.00 sampai 24.00, kelipatan 5 menit, mulai lebih awal dari selesai. Pola mingguan (minimal satu hari) atau sekali jalan (tanggal pada atau setelah hari ini). Pola hanya mingguan, tidak ada pola lain.
- **F-02 Periode.** Tanggal mulai pada atau setelah hari ini. Tanggal berakhir opsional.
- **F-03 Edit, hapus, akhiri.**
  - Edit berlaku mulai tanggal pada atau setelah hari ini. Versi lama berakhir sehari sebelumnya.
  - Jadwal yang belum pernah berlaku di hari lewat diedit langsung dan boleh dihapus permanen (konfirmasi ringan). Jadwal yang pernah berlaku tidak bisa dihapus.
  - "Akhiri" (konfirmasi ringan) memakai tanggal berakhir inklusif, default hari ini.
- **F-04 Pengecualian.**
  - Berbentuk rentang tanggal, tanggal awal pada atau setelah hari ini. Opsi "semua" bersifat dinamis: mencakup Jadwal yang dibuat belakangan.
  - Dihapus tanpa konfirmasi.
  - Peringatan tampil bila Jadwal baru jatuh dalam pengecualian.
- **F-05 Bentrok antar-Jadwal.** Diperingatkan, tidak ditolak.
- **F-06 Tempat membuat Jadwal.** Jadwal sekali jalan dibuat dari grid. Jadwal berulang dibuat di tab Jadwal di dalam Kalender (J-03), dengan sub-tab Aktif (belum berakhir), Berakhir (tanggal berakhir sudah lewat), dan Pengecualian (daftar pengecualian, F-04).
- **F-07 Jam kosong.** 06.00 sampai 24.00 dikurangi gabungan Jadwal aktif dan blok. Blok dari entri selesai atau batal tidak dihitung. Slot di bawah 30 menit tidak dihitung.
- **F-08 Bentrok Jadwal dengan blok.** Jadwal baru atau hasil edit yang menimpa blok yang sudah ada diizinkan dengan peringatan. Blok yang tertimpa ditandai "bentrok". Tanda itu menampilkan penjelasan dan tautan ke Jadwal yang menyebabkannya.
- **F-09 Jadwal sekali jalan.** Untuk hari ini atau mendatang bisa diedit dan dihapus tanpa konfirmasi.

### 3.9 Kalender (G-01 sampai G-05)

- **G-01 Tampilan.** Bulan dan Minggu (minggu mulai Senin), bisa digeser, dengan tombol "Hari ini".
- **G-02 Sel bulan.** Menampilkan garis sesi (maks 3, sisanya "+N"), jumlah deadline (task aktif), dan jam kosong (total jam). Jumlah deadline dan jam kosong hanya untuk hari ini dan mendatang; hari lampau hanya menampilkan garis sesi. Tampilan minggu memakai 7 kolom. Di HP: strip hari dan grid satu hari (N-53).
- **G-03 Tampilan elemen.** Garis sesi berwarna projek dengan teks "Projek · Sesi"; mengekliknya membuka detail projek. Warna bukan satu-satunya pembeda projek: tiap projek juga punya pola garis (penuh, putus-putus, titik-titik, arsir), sesuai N-16. Sesi batal disembunyikan, sehingga sesi batal yang sempat berjalan juga hilang dari minggu lampau. Blok memakai warna projek, task mandiri tanpa warna, Jadwal netral.
- **G-04 Panel hari.**
  - Grid 06.00 sampai 24.00 dengan garis tiap 30 menit.
  - Penanda deadline: berjam berupa garis, tanpa jam berupa strip, deadline 00.00 sampai 05.55 berupa penanda "Sebelum 06.00".
  - Menampilkan to-do hari itu dan daftar task "belum punya jam".
  - Mengeklik slot kosong (hari ini atau mendatang) membuka pilihan Jadwal sekali jalan atau Blok.
- **G-05 Hari lewat.** Hanya-baca: status dari riwayat, progress, blok, dan Jadwal versi saat itu. Progress pada task yang tidak ada di to-do hari itu tidak tampil. Hari ini dan mendatang menampilkan rancangan.

### 3.10 Dashboard (D-01 sampai D-03, D-05 sampai D-12)

- **D-01 Halaman awal.** Dashboard adalah halaman awal setelah login. Terdiri dari tiga bagian (Sekarang, Projek, Pola kerja) dan kalender mini. Tata letak di laptop: kolom utama berisi Telat lalu Hari ini + 7 hari; kolom samping berisi ringkasan to-do dan jam kosong, lalu kalender mini; di bawahnya, selebar penuh, Projek lalu Pola kerja (dimuat paling akhir). Urutan di HP mengikuti N-54.
- **D-02 Task telat.** Maks 5, urutan paling lama telat, lalu kesulitan, lalu abjad nama. Ada "lihat semua" ke Daftar Task dengan filter Telat.
- **D-03 Hari ini + 7 hari.** Task aktif yang belum telat dengan deadline hari ini sampai 7 hari ke depan, diurut sesuai D-04.
- **D-05 Task tanpa deadline.** Task mandiri tanpa deadline tidak tampil di Dashboard, kecuali lewat to-do hari ini. Tidak ada tautan "N task tanpa deadline".
- **D-06 Ringkasan to-do.** Jumlah entri hari ini, jumlah yang dikerjakan atau selesai, dan jumlah "Belum selesai" (E-09). Ada tautan ke halaman To-do (E-11).
- **D-07 Projek.** Maks 5 projek belum tertutup dengan urutan seperti A-08, ditambah "lihat semua". Kartu memuat nama, warna, status, sesi sekarang (atau kapan sesi berikutnya mulai saat jeda), "N dari M task selesai", dan jumlah task telat. Kartu membuka detail projek.
- **D-08 Kalender mini.** Minggu berjalan, mengikuti aturan G-02 dan G-03: garis sesi, serta jumlah deadline dan jam kosong per hari (dua yang terakhir hanya untuk hari ini dan mendatang). Mengeklik hari membuka panel hari. Bisa digeser antarminggu.
- **D-09 Jam kosong hari ini.** Di bagian Sekarang, satu baris ringkas: sisa jam kosong dari sekarang sampai 24.00 dan slot terpanjang. Slot dipotong di "sekarang" lebih dulu, lalu yang kurang dari 30 menit tidak dihitung. Ini berbeda dari Kalender (G-02) yang menghitung seluruh hari.
- **D-10 Tambah task dan empty state.** Tombol "Tambah task" serta empty state dengan aksi langsung di tiap bagian.
- **D-11 Pola kerja.**
  - Pemilih rentang: Minggu ini, 4 minggu terakhir (default), Bulan ini, 3 bulan terakhir, Tahun ini, Semua, atau rentang kustom. Rentang hanya berlaku untuk bagian ini.
  - Granularitas grafik otomatis (harian, mingguan, bulanan). Bagian ini dimuat setelah bagian lain.
  - Tanpa skor, streak, atau peringkat. Hari tanpa data tampil "tidak ada data".
- **D-12 Metrik Pola kerja.** (1) Task selesai per hari atau minggu; (2) task dibuat, selesai, dan batal per periode; (3) entri to-do dikerjakan vs tidak dikerjakan (hanya hari lewat). Tidak termasuk: distribusi per projek atau label, rata-rata kesulitan, beban ke depan, ketepatan deadline.
  - "Selesai" dihitung dari kondisi sekarang: task yang saat ini selesai dengan waktu selesai terakhir di dalam periode. Task yang dibuka kembali tidak dihitung sampai selesai lagi.
  - Rasio = (dikerjakan + selesai) dibagi (dikerjakan + selesai + tidak dikerjakan). Entri dibatalkan dan hari ini tidak dihitung.
  - Task yang batal karena cascade (batal projek atau sesi) dihitung sama dengan batal manual.
  - "Task dibuat" dihitung dari tanggal lokal saat task dibuat (N-05).

### 3.11 Akun (U-01 sampai U-15)

- **U-01 Model akun.** Pendaftaran terbuka untuk siapa saja. Tiap akun punya data terpisah penuh, dan pengguna hanya bisa mengakses data miliknya sendiri. Semua kebutuhan di dokumen ini berlaku per akun.
- **U-02 Daftar dengan email.**
  - Isian: email, ulangi email, password, dan nama tampil (opsional, maks 45 karakter). Tidak ada kolom "ulangi password". Ada tombol lihat atau sembunyikan password.
  - Email berformat valid dan unik tanpa beda kapital (spasi ujung dipangkas). Email dan ulangi email harus sama; bila beda, muncul pesan error dan akun tidak dibuat.
  - Email yang sudah terdaftar menampilkan pesan "email sudah terdaftar".
  - Tanpa verifikasi email. Setelah berhasil, pengguna langsung masuk dengan data kosong dan empty state (D-10), tanpa onboarding.
- **U-03 Password.** Minimal 8 karakter, maksimal 128, tanpa aturan komposisi. Password yang terlalu umum tidak ditolak.
- **U-04 Masuk dengan Google.**
  - Login Google pertama otomatis membuat akun, tanpa formulir daftar. Email dianggap terverifikasi. Nama tampil diambil dari profil Google.
  - Bila emailnya sudah dipakai akun email+password, kedua akun ditautkan menjadi satu: password lama dihapus dan semua sesi login lain dicabut. Setelah itu akun hanya bisa masuk lewat Google sampai pengguna membuat password lewat Lupa password (U-07).
  - Sebaliknya, daftar dengan email+password memakai email yang sudah dipakai akun Google menampilkan "email sudah terdaftar".
- **U-05 Login email dan password.** Bila gagal, pesan selalu "email atau password salah" tanpa membedakan penyebabnya.
- **U-06 Pembatasan percobaan.** Lima kali gagal berturut-turut menunda login 15 menit, dihitung per akun dan per alamat IP. Tanpa CAPTCHA. Pesan menyebut pengguna harus menunggu. Tombol Masuk tetap aktif selama penundaan, dan server yang menolak. Berlaku untuk login email dan password saja, bukan Google.
- **U-07 Lupa password.**
  - Pengguna meminta tautan reset lewat email. Tautan berlaku 30 menit dan sekali pakai. Respons selalu sama, baik email terdaftar maupun tidak.
  - Tautan yang sudah terpakai atau kedaluwarsa menampilkan pesan dan tawaran meminta tautan baru.
  - Setelah password diganti, semua sesi login lain dicabut.
  - Pada akun yang belum punya password (lewat Google), alur ini berfungsi untuk membuat password.
- **U-08 Sesi login.** Berlaku 30 hari dan diperpanjang setiap kali dipakai, sehingga cocok untuk aplikasi di HP. Tidak ada kotak "ingat saya".
- **U-09 Logout.** Tombol Keluar ada di halaman Akun, terpisah dari item navigasi (J-02). Hanya untuk perangkat ini, tanpa konfirmasi. Cache offline di perangkat itu dihapus, lalu pengguna diarahkan ke halaman login.
- **U-10 Ganti password.** Dilakukan di halaman Akun. Meminta password lama dan password baru (aturan U-03). Sesi lain dicabut, perangkat yang dipakai tetap masuk. Hanya tersedia untuk akun yang punya password.
- **U-11 Nama tampil.** Diubah di halaman Akun (opsional, maks 45 karakter). Email tidak bisa diubah.
- **U-12 Akses dan arah setelah login.**
  - Membuka halaman tanpa login mengarahkan ke login, lalu kembali ke tujuan semula setelah berhasil, termasuk panel yang sedang terbuka (J-04).
  - Login atau daftar dari halaman login membuka Dashboard (D-01) bila tidak ada tujuan semula.
  - Pengguna yang sudah login lalu membuka halaman login atau daftar diarahkan ke Dashboard.
- **U-13 Sesi habis saat bekerja dan offline.**
  - Bila sesi habis saat formulir terbuka, muncul dialog login ulang dan isian formulir tidak hilang. Dialog ini satu-satunya yang boleh bertumpuk di atas formulir, emailnya terkunci ke akun yang sama, dan tidak ada tombol Batal.
  - Login Google berupa pengalihan halaman yang bisa menghapus isian dari memori. Karena itu, isian formulir disimpan lokal di perangkat sebelum pengalihan dan dikembalikan setelahnya. Draf itu dihapus setelah dikembalikan, saat Keluar, atau saat akun lain masuk (N-60).
  - Pada mode offline (hanya baca), data cache tetap terbaca selama perangkat masih login. Perubahan data ditolak saat offline.
  - Perangkat yang belum punya snapshot (baru, atau baru Keluar) menampilkan "Belum ada data di perangkat ini" dengan tombol Coba lagi (N-47).
- **U-14 Zona waktu.**
  - Terdeteksi dari browser saat daftar atau login Google pertama, disimpan di akun, dan dipakai server untuk menentukan "hari ini". Bila tidak terdeteksi, dipakai Asia/Jakarta.
  - Bisa diganti di halaman Akun dan hanya berlaku ke depan; hari lewat tidak dihitung ulang.
  - "Hari ini" tidak pernah mundur: server memakai tanggal yang lebih besar antara tanggal menurut zona waktu sekarang dan tanggal terakhir yang pernah menjadi "hari ini" bagi akun itu. Akibatnya, setelah pindah zona ke barat, "hari ini" bisa tertahan beberapa jam sampai tanggal lokal menyusul.
- **U-15 Halaman login dan daftar.** Berada di luar menu navigasi utama. Navigasi hanya tampil setelah login.

### 3.12 Konfirmasi (I-03, I-04, I-08 sampai I-10)

- **I-03 Tiga tingkat konfirmasi.**

| Tingkat | Aksi |
| --- | --- |
| Berat (dialog rincian dampak, I-04) | Selesai dini projek (A-04), batal projek (A-05), ubah periode sesi yang berdampak (B-05), batal sesi (B-06), aksi apa pun yang membuat projek menjadi selesai (2.4: hapus sesi, batal task, Selesai, pindah task). |
| Ringan (satu kalimat, I-08) | Batal task (C-05), hapus sesi (B-06), hapus projek (A-06), buka kembali projek (A-07), hapus label (C-03), hapus Jadwal permanen dan akhiri Jadwal berulang (F-03). |
| Tanpa konfirmasi | Selesai (kecuali yang menutup projek), ubah progress, ceklis, buka kembali task (C-07), hapus entri atau blok, pengecualian Jadwal (F-04), edit atau hapus Jadwal sekali jalan (F-09), ganti nama dan edit biasa, logout, ganti password. |

- **I-04 Dialog berat.** Struktur: judul dengan nama objek, bagian "Akan terjadi" dan "Tetap ada", peringatan tidak bisa diurungkan, tombol destruktif berlabel spesifik, dan daftar nama maks 5 dengan "dan N lainnya". Fokus awal di "Kembali", Enter tidak menjalankan aksi destruktif, Esc menutup. Angka dampak dihitung dari data yang sama dengan aksinya. Isi per aksi:

| Aksi | Akan terjadi | Tetap ada |
| --- | --- | --- |
| Selesai dini | Sesi berjalan dipotong sampai kemarin. Sesi yang mulai hari ini dan sesi belum mulai dihapus bila kosong, ditandai batal bila bertask. Projek menjadi selesai dan terkunci. | Sesi lewat, task selesai, riwayat |
| Batal projek | N task aktif dibatalkan. Sesi berjalan dan belum mulai ditandai batal. Projek batal dan terkunci (atau dihapus bila tanpa sesi bertask). | Sesi lewat, task selesai, riwayat |
| Ubah periode | N task keluar periode (daftar maks 5). Baris "Projek akan menjadi selesai dan terkunci" bila berlaku. | Task dan progress |
| Batal sesi | N task aktif dibatalkan. Sesi batal permanen. | Periode tidak dipotong, task selesai, riwayat |
| Aksi yang menutup projek | Aksi aslinya ditambah baris "Projek akan menjadi selesai dan terkunci" | Sesuai aksi |

Kata-kata dan label tombol final ditentukan di desain visual.

- **I-08 Dialog ringan.** Berisi satu kalimat akibat, tanpa daftar rincian. Pola interaksinya sama dengan dialog berat: fokus awal di "Kembali", Enter tidak menjalankan aksi, Esc menutup.
- **I-09 Tanpa urungkan.** Tidak ada fitur "urungkan" di mana pun. Dialog ringan cukup menyebut akibatnya.
- **I-10 Dialog kondisional dan pembaruan instan.** Klien menghitung dampak dengan aturan domain yang sama dengan server (N-10) untuk menentukan perlu tidaknya dialog berat. Server memeriksa ulang. Bila hasilnya berbeda dari yang ditampilkan (data berubah di perangkat lain), aksi tidak dijalankan dan dialog diperbarui dengan data terbaru. Aksi bertingkat konfirmasi selalu menunggu server dan tidak instan. Saat offline (hanya baca), aksi ini dinonaktifkan.

### 3.13 Navigasi dan Layar (J-01 sampai J-07)

- **J-01 Navigasi utama.** Lima item: Dashboard, Projek, Task, To-do, dan Kalender. Sidebar kiri permanen di laptop, bilah bawah di HP, tiap item berikon dan berlabel. Item aktif disorot dengan warna, bobot, dan penanda. Posisi sama di semua halaman setelah login. Tanpa badge di item navigasi. Halaman login dan daftar tanpa navigasi (U-15).
- **J-02 Akun.** Halaman Akun dibuka lewat ikon profil (dasar sidebar di laptop, bilah atas di HP), bukan lewat item navigasi utama. Akun memuat nama tampil (U-11), ganti password (U-10), zona waktu (U-14), dan Keluar (U-09), yang terpisah dari item navigasi.
- **J-03 Tab Kalender dan Jadwal.** Kalender punya tab Bulan, Minggu, dan Jadwal. Tab Jadwal punya sub-tab Aktif, Berakhir, dan Pengecualian (F-06). Kalender mengingat tampilan terakhir yang dipilih pengguna. Pilihan itu disimpan di perangkat, bukan di akun.
- **J-04 Alamat panel detail task.** Panel detail task (H-06) tercermin di alamat halaman. Tombol kembali menutup panel dan tidak meninggalkan halaman.
- **J-05 Kembali dan filter.** Tombol kembali memulihkan filter dan posisi gulir halaman sebelumnya. Membuka halaman lewat navigasi utama mereset filter ke Aktif (H-03).
- **J-06 Aturan overlay.**
  - Jenis tampilan: panel berupa panel samping di laptop dan layar penuh di HP; formulir berupa dialog di laptop dan sheet dari bawah di HP; panel penyusunan (E-03) menimpa halaman di keduanya; konfirmasi (I-03) berupa dialog tengah di keduanya. Kelola label (H-07) dikecualikan: berupa dialog tengah di HP juga.
  - Maksimal tiga lapis: panel, lalu formulir, lalu dialog konfirmasi. Maksimal satu formulir dan satu dialog konfirmasi sekaligus.
  - Panel tidak menumpuk di atas panel. Membuka detail task dari panel hari menggantikan isi panel dan menyediakan tombol "Kembali ke hari". Panel penyusunan tidak membuka panel lain.
  - Selalu ada tombol tutup. Esc menutup lapisan teratas. Di HP, gesek ke bawah juga menutup.
- **J-07 Fokus.** Setelah pindah halaman, fokus pindah ke area konten utama (N-14).

## 4. Kebutuhan non-fungsional (NFR)

NFR dikelompokkan dalam lima bagian. Angka yang tertera adalah angka awal yang ditinjau saat ada data pemakaian nyata. Butir yang bergantung pada fitur yang ditunda ditandai "bila dibangun".

### 4.1 Integritas data, waktu, dan konkurensi

| ID | Kebutuhan |
| --- | --- |
| N-01 | Aksi berantai berjalan atomik dalam satu transaksi: selesai dini, batal projek, batal atau hapus sesi, ubah periode, buka kembali projek, dan penautan akun Google (hapus password dan cabut sesi). Pemulihan data ikut bila fitur itu dibangun. Kunci per akun berupa baris akun (nomor revisi dinaikkan sebagai pernyataan pertama transaksi), bukan advisory lock. |
| N-02 | Aturan yang bisa dinyatakan sebagai constraint dijaga database: foreign key, email unik (tanpa beda kapital), nama projek dan label unik per akun, nama sesi non-batal unik per projek, rentang sesi non-batal tidak tumpang tindih (exclusion constraint), satu entri to-do per task per hari. |
| N-03 | Riwayat append-only. Jadwal berversi (F-03). |
| N-04 | Status turunan (projek, sesi, telat, di luar periode, entri tidak dikerjakan, jam kosong, ringkasan "N dari M task selesai") dihitung saat dibaca dan tidak disimpan. Yang disimpan hanya "batal" (projek, sesi, task) beserta waktu batal task. |
| N-05 | Tanggal disimpan sebagai tanggal. Jam disimpan sebagai menit sejak 00.00 (0 sampai 1440, agar 24.00 bisa dinyatakan). Cap waktu UTC hanya untuk metadata (dibuat, diubah, waktu batal). Kejadian yang dikelompokkan per hari (riwayat progress, selesai, batal) juga menyimpan tanggal dan jam lokal saat kejadian, sehingga mengganti zona waktu tidak memindahkan kejadian lama ke hari lain. Task juga menyimpan tanggal lokal saat dibuat, agar "task dibuat per periode" (D-12) tidak bergeser saat zona waktu berganti. |
| N-06 | Data yang sudah berlaku di hari lewat tidak dihapus, tanpa batas retensi. Penghapusan hanya untuk objek yang diizinkan FR (projek tanpa sesi, sesi kosong, label tanpa task, Jadwal yang belum pernah berlaku, entri mendatang). |
| N-44 | Zona waktu disimpan per akun (U-14): terdeteksi dari browser saat daftar, cadangan Asia/Jakarta, dipakai untuk "hari ini" dan batas 00.00. Server menyimpan tanggal terakhir yang pernah menjadi "hari ini" per akun. "Hari ini" = yang lebih besar antara tanggal menurut zona sekarang dan tanggal tersimpan itu, sehingga tidak pernah mundur. |
| N-45 | "Hari ini" ditentukan server memakai zona waktu akun. Saat offline, jam perangkat dipakai hanya untuk membaca, dengan zona waktu akun dari snapshot. |
| N-46 | Pemeriksaan versi per record. Nilai versi adalah nomor revisi akun saat record terakhir berubah, nomor yang sama dengan kursor sinkron delta (header If-Match). Bila record berubah sejak layar dimuat, penyimpanan ditolak dengan pesan "Data berubah di perangkat lain. Muat ulang?". Tombol Simpan nonaktif sampai Muat ulang ditekan. Muat ulang menggantikan isian pengguna dengan data terbaru, dan pesan menyatakan hal itu sebelum tombol ditekan. Setelah itu formulir menandai bahwa ia sudah diperbarui. Untuk aksi bertingkat konfirmasi (I-10), server menghitung ulang dampak; bila berbeda dari yang ditampilkan, aksi tidak dijalankan dan dialog diperbarui. |
| N-75 | Aturan yang bergantung pada status turunan atau lintas tabel tidak bisa dijadikan constraint: warna unik di antara projek belum tertutup, nama projek vs label mandiri, nama task aktif unik per label. Aturan ini diperiksa dalam transaksi dengan penguncian per akun. Kuncinya berupa baris akun (N-01). |
| N-76 | Versi aplikasi usang: server menolak permintaan dari klien lama dengan kode klien_usang (409). Aplikasi menampilkan bilah "Ada versi baru aplikasi" dengan tombol Muat ulang, saat aplikasi dibuka atau saat aksi pertama ditolak. Memuat ulang bisa menghilangkan perubahan yang sedang diisi. |

### 4.2 Platform, performa, dan ketersediaan

| ID | Kebutuhan |
| --- | --- |
| N-07 | Aplikasi web responsif tanpa aplikasi native. Laptop minimal 1280 px, HP minimal 360 px. Dua versi terakhir Chrome, Edge, Firefox, dan Safari. |
| N-08 | Dirancang untuk volume lima tahun pemakaian harian per akun: 100 projek, 600 sesi, 10.000 task, 30.000 entri to-do, 100.000 baris riwayat progress, dan 1.000 versi Jadwal. Perkiraan kasar sekitar 25 MB database per akun pada volume ini, sehingga paket gratis menampung sekitar 40 akun bervolume penuh. |
| N-09 | Dashboard (di luar bagian Pola kerja) bisa dipakai dalam 2 detik. Pindah halaman dan membuka Kalender bulan dalam 1 detik. Di koneksi normal dengan server aktif, pada volume N-08. |
| N-10 | Aturan domain yang dipakai server dan perangkat (status projek dan sesi, telat, di luar periode, aturan penutupan projek dan dampak konfirmasi (I-10), Jadwal efektif dan pola mingguan, penandaan bentrok blok dan Jadwal, pembantu tanggal dan hari lewat) ditulis dua kali, di PHP dan di TypeScript, dengan "sekarang" sebagai parameter. Keduanya diikat golden fixtures bersama sehingga hasilnya identik untuk data dan waktu yang sama. Aturan yang hanya dipakai perangkat (jam kosong, urutan task aktif, status entri to-do, "N dari M", "setelah deadline", "Belum selesai") cukup ditulis di TypeScript. |
| N-11 | Status memuat, menyambungkan, dan gagal selalu jelas. Tidak ada layar kosong atau error mentah. Pesan galat berbahasa Indonesia, menyebut akibat dan aksi yang bisa diambil, tanpa kode mentah. Status sistem (Menyambungkan, Offline, Tersambung kembali, versi baru, galat) memakai satu komponen bilah tipis yang tidak bisa ditutup dan bukan toast. Tombol ubah yang nonaktif menuliskan alasannya di dekat tombol (N-17), termasuk saat Menyambungkan. Bila server lambat bangun, setelah 8 detik bilah menambah kalimat "Server sedang bangun, bisa sampai 1 menit." dan aplikasi menyerah ke galat muat setelah 90 detik. |
| N-12 | Tanpa cache server atau antrean. Layanan di luar frontend, backend, dan database hanya penyedia email (reset password) dan Google (login). Pencatatan percobaan login memakai database. Tabel cache dan sessions adalah tabel database milik Laravel, bukan cache atau antrean server. |
| N-13 | Di HP, drag and drop tidak diwajibkan. Blok jam memakai formulir. |
| N-47 | Offline: snapshot penuh data terakhir yang berhasil dimuat disimpan di perangkat per akun. Semua halaman bisa dibaca dengan tanda "Data per \[waktu\]" (hari ini hanya jam, misalnya "Data per 14.52"; hari lain dengan tanggal, misalnya "Data per 17 Nov 2026, 22.10"), semua tombol ubah dinonaktifkan beserta penjelasannya. Saat kembali online, bilah berganti "Tersambung kembali. Memperbarui data…", tombol ubah menunggu sinkron selesai, dan penanda "Data per" tetap sampai sinkron selesai. Perangkat tanpa snapshot menampilkan "Belum ada data di perangkat ini" dengan tombol Coba lagi. Pada volume N-08, ukuran snapshot ditargetkan maksimal 25 MB. Perkiraan awal: sekitar 20 MB snapshot per akun bervolume penuh. |
| N-48 | Hosting gratis selama fase membangun, dengan indikator "Menyambungkan…". Pindah ke berbayar saat jumlah pengguna atau pemakaian melewati batas paket gratis. Tanpa ping terus-menerus (membakar jam instance dan CU-jam). Ambang naik ke hosting berbayar: storage di atas 70%, CU-jam di atas 80 dari 100, email di atas 70 per hari, atau cold start mengganggu demo. |
| N-49 | Daftar Task memuat semua data akun di perangkat, dengan filter dan pencarian di perangkat. Ditinjau ulang bila lebih dari 10.000 task atau tampil lebih dari 1 detik. |
| N-50 | Pembaruan instan (optimistic) untuk ceklis, update progress, tambah ke to-do, dan hapus entri. Aksi yang punya konfirmasi, termasuk update progress atau Selesai yang akan menutup projek, menunggu server. Bila server menolak atau tidak menjawab, baris kembali ke keadaan semula dengan pesan di bawahnya dan tautan Coba lagi, tanpa toast. |
| N-51 | Bisa dipasang ke layar utama. Tanpa notifikasi dorong. |
| N-69 | Kapasitas awal: fase gratis dirancang untuk sampai 1.000 akun terdaftar dan 100 akun aktif bersamaan. Ditinjau saat pindah ke berbayar. Fase gratis tidak menjamin angka ini dan perlu uji beban sebelum dijanjikan. |
| N-70 | Pola kerja (D-11, D-12) dihitung dari data yang sudah ada (riwayat dan entri), dimuat setelah bagian lain, dan tampil dalam 3 detik untuk rentang "Semua" pada volume N-08. |

### 4.3 Kegunaan dan aksesibilitas

| ID | Kebutuhan |
| --- | --- |
| N-14 | Semua aksi terjangkau keyboard. Fokus terlihat dan berurutan. Slot kosong di grid bisa difokus. |
| N-15 | Kontras teks minimal 4,5:1 dan komponen minimal 3:1 di dua tema. |
| N-16 | Warna bukan satu-satunya pembawa makna. Palet projek lolos kontras. |
| N-17 | Target sentuh minimal 44 pt. Tidak ada aksi yang hanya muncul saat hover. |
| N-18 | Berfungsi pada perbesaran teks 200%. |
| N-19 | Menghormati pengaturan "kurangi gerakan". |
| N-20 | Pesan error berbahasa Indonesia, menyebut masalah dan perbaikannya, tampil di dekat kolom isian, dan input tidak hilang. |
| N-21 | Pola berulang memakai satu komponen: pilihan hari, dialog konfirmasi (berat dan ringan), baris task (Daftar Task dan Dashboard), chip, panel hari, panel detail task, daftar hari terencana (E-12), kontrol progress. |
| N-52 | WCAG 2.2 AA untuk alur inti, termasuk daftar dan login. Panel hari menyediakan daftar kronologis sebagai padanan teks grid jam. Grafik Pola kerja menyediakan tabel nilai sebagai padanan teks. |
| N-53 | Tampilan minggu di HP: strip tujuh hari di atas (jumlah deadline dan jam kosong per hari), grid satu hari terpilih di bawahnya. Tampilan bulan di HP: sel menampilkan garis sesi berwarna dengan pola garis per projek tanpa teks (maks 3), angka deadline, dan jam kosong, dengan legenda nama projek di bawah kalender; rincian ada di panel hari saat sel diketuk. |
| N-54 | Dashboard di HP berupa satu kolom (tata letak D-01) dengan urutan: telat, jam kosong hari ini, to-do, 7 hari, kalender mini, projek, pola kerja. |
| N-55 | Hanya bahasa Indonesia, termasuk pesan error dan email. Tanggal "29 Okt 2026", jam 24 jam, minggu mulai Senin. |
| N-56 | Tema terang atau gelap otomatis mengikuti perangkat, tanpa tombol manual. |
| N-57 | Tanpa onboarding. |

### 4.4 Keamanan dan privasi

| ID | Kebutuhan |
| --- | --- |
| N-22 | Semua lalu lintas lewat HTTPS dengan HSTS. |
| N-23 | Pendaftaran terbuka untuk umum lewat email dan password atau Google (U-01, U-02, U-04). Tidak ada akun admin di dalam aplikasi (lihat N-63). |
| N-24 | Semua endpoint butuh sesi masuk valid, kecuali daftar, login, callback Google, permintaan dan penyelesaian reset password, dan pengecekan kesehatan (N-41). |
| N-25 | Pembatasan login email dan password (U-06): 5 kali gagal berturut-turut menunda login 15 menit, dihitung per pasangan (akun, IP). Penghitung tambahan: per IP lintas akun (20 gagal) dan per akun lintas IP (30 per jam), dengan penundaan yang sama. Catatan percobaan disimpan di database dan dihapus setelah 24 jam. Login Google tidak terkena pembatasan ini. Kunci penghitung berupa HMAC email, bukan email mentah. Sumber IP klien diverifikasi di deploy pertama dan tidak mempercayai header X-Forwarded-For mentah. |
| N-26 | Validasi input di server, query terparameter, dan escape keluaran. Bila pemulihan data dibangun, ukuran file dibatasi. |
| N-27 | Link dokumen hanya http dan https, dibuka di tab baru dengan rel="noopener noreferrer". |
| N-28 | Rahasia (termasuk kunci Google OAuth dan penyedia email) hanya di variabel lingkungan hosting. Repositori GitHub privat. |
| N-29 | CORS tidak diaktifkan karena aplikasi dan API satu origin (N-62). |
| N-30 | Tanpa pelacak, analitik, atau skrip pihak ketiga di klien. Login Google berjalan lewat pengalihan di server tanpa memuat skrip Google. Font sistem. Log server tanpa isi task, deskripsi, nama, dan alamat email. Log berformat JSON dengan redaksi, dan hanya identitas akun internal yang boleh muncul. |
| N-31 | Dependensi diaudit sebelum rilis dan diperbarui berkala. |
| N-32 | Koneksi ke database memakai TLS dengan verifikasi penuh. Enkripsi saat disimpan mengikuti bawaan penyedia database. Bila ekspor dibangun, file ekspor tidak dienkripsi. |
| N-33 | Kata sandi di-hash dengan Argon2id (parameter minimum OWASP, di-benchmark di host) beserta garam unik, dan tidak pernah dicatat di log. Email yang tidak dikenal tetap diverifikasi terhadap hash tiruan agar waktu respons sama, dan hash dibuat ulang bila parameter berubah. |
| N-34 | Kata sandi 8 sampai 128 karakter tanpa aturan komposisi (U-03). |
| N-35 | Sesi masuk disimpan di server (Sanctum mode SPA). Cookie bernama berawalan __Host-, httpOnly, Secure, dan SameSite=Lax (agar pengalihan balik dari Google berfungsi). ID sesi dibuat ulang saat login. Permintaan pengubah data dilindungi dari CSRF (token atau header kustom). |
| N-36 | Penundaan login bersifat sementara, bukan penguncian permanen. Penghitungan per pasangan (akun, IP) mencegah pihak lain menunda login pemilik akun terus-menerus dari IP berbeda. |
| N-58 | Akun dibuat lewat email dan password buatan sendiri atau lewat Google. Email unik tanpa beda kapital. Penautan Google ke akun password: password dihapus dan semua sesi lain dicabut (U-04). |
| N-59 | Sesi masuk 30 hari, diperpanjang setiap dipakai. Server mendukung pencabutan seluruh sesi satu akun (dipakai reset, ganti password, dan penautan Google). Daftar perangkat dan "Keluar dari semua perangkat" ditunda. |
| N-60 | Keluar menghapus snapshot offline dan sesi masuk di perangkat itu. Sesi yang kedaluwarsa sendiri tidak menghapus snapshot, tetapi snapshot baru ditampilkan lagi setelah login ulang. Snapshot disimpan per akun dan dihapus bila akun lain masuk di perangkat yang sama. Draf formulir yang disimpan lokal untuk login ulang lewat Google (U-13) diperlakukan sama: dihapus setelah dikembalikan, saat Keluar, atau saat akun lain masuk. |
| N-61 | Isolasi antar-akun tiga lapis: setiap tabel data punya kolom pemilik akun dengan foreign key komposit; semua kueri difilter pemilik lewat scope model dan route-model binding (id akun tidak pernah berasal dari input); dan pengujian (N-39). Akses ke data akun lain dijawab "tidak ditemukan". Role database dipisah: runtime (CRUD tanpa DDL) dan migrasi. RLS ditunda. |
| N-62 | Laravel menyajikan SPA dan API dalam satu origin, baik di fase gratis maupun berbayar. Saat berbayar: domain kustom. Alamat pengalihan Google didaftarkan untuk tiap domain. |
| N-63 | Pemulihan akun yang tidak bisa memakai alur Lupa password dilakukan admin lewat skrip dengan akses langsung ke database. Tanpa halaman admin. Skrip lokal memakai role migrasi, menerbitkan tautan reset, dan mencabut sesi. |
| N-64 | Pencabutan sesi lain terjadi pada ganti password (U-10), reset password (U-07), dan penautan Google (U-04). |
| N-71 | Email hanya untuk reset password, dikirim lewat penyedia email, berbahasa Indonesia, tanpa data task atau projek. Pengiriman ditargetkan dalam 1 menit. Kegagalan kirim tidak mengubah respons ke pengguna (selalu sama) dan dicatat tanpa alamat email. Dikirim lewat Resend setelah respons dikirim agar waktu respons sama. Batas paket gratis 100 email per hari. |
| N-72 | Login Google memakai OAuth 2.0 authorization code dengan PKCE dan state (tanpa nonce), diproses di server. Hanya email berstatus terverifikasi oleh Google yang diterima. Cakupan izin minimal (openid, email, profile). |
| N-73 | Token reset password: acak kriptografis, disimpan dalam bentuk hash, berlaku 30 menit, sekali pakai. Permintaan baru membatalkan token lama. Permintaan dibatasi 3 per jam per email dan per IP. |
| N-77 | Registrasi baru dibatasi per alamat IP (awal: 10 per jam), terpisah dari pembatasan login (N-25). Sumber IP diverifikasi seperti di N-25. |

### 4.5 Maintainability, pengujian, dan operasi

| ID | Kebutuhan |
| --- | --- |
| N-37 | Aturan domain berupa fungsi murni terpisah dari antarmuka dan database. "Sekarang" menjadi parameter. Berlaku di kedua implementasi (N-10). |
| N-38 | Migrasi skema berversi dan hanya maju. Backup database penuh dibuat sebelum migrasi produksi. Tiap migrasi diuji dengan memulihkan backup lama. Migrasi wajib kompatibel mundur (tambah dulu, hapus belakangan) karena versi lama masih melayani selama migrasi. |
| N-39 | Pengujian otomatis wajib untuk aturan domain, aksi berantai dan atomiknya, aturan penutupan projek dan dialog kondisional, pemeriksaan versi, isolasi antar-akun, dan alur autentikasi (batas percobaan, token reset, penautan Google). Bila ekspor dan pemulihan dibangun: putaran ekspor lalu pulihkan dengan hasil identik. Ditambah uji keamanan: uji arsitektur bahwa setiap model memakai scope akun, matriks rute × dua akun yang mengharapkan "tidak ditemukan", dan uji fixture Pola kerja terhadap PostgreSQL. |
| N-40 | Data contoh fiktif mencakup kasus tepi dan lebih dari satu akun, tidak memakai data asli. |
| N-41 | Log kesalahan tanpa data pribadi (termasuk email) dan dua endpoint kesehatan: liveness tanpa database (untuk membangunkan server) dan readiness dengan database. Tanpa dasbor pemantauan. |
| N-42 | README memuat cara menjalankan, variabel lingkungan (termasuk Google OAuth dan penyedia email), pemulihan darurat, dan catatan keputusan produk. |
| N-43 | Dependensi minimal dengan lockfile (composer.lock dan lockfile pnpm). Versi PHP dan Node LTS ditetapkan satu versi. Node hanya dipakai untuk build dan uji. |
| N-65 | TypeScript mode ketat di frontend. Di backend: declare(strict_types=1) dan analisis statis PHPStan atau Larastan. |
| N-66 | Uji unit untuk aturan domain. Uji integrasi API terhadap PostgreSQL asli, termasuk skenario dua akun. Uji browser untuk 2 sampai 3 alur kritis (login, tambah task, selesai) setelah antarmuka stabil. Alat: Pest atau PHPUnit, Vitest, dan Playwright. |
| N-67 | Satu monorepo pnpm (apps/web dan apps/api) tanpa paket kode bersama. Yang dibagi hanya folder fixture untuk aturan domain (N-10). |
| N-68 | CI di setiap perubahan (lint, tipe, semua pengujian, audit dependensi). Image dibangun sekali di CI. Deploy hanya dari cabang main dengan persetujuan manual. |
| N-74 | Backup database otomatis harian dengan retensi 7 hari (kehilangan data maksimal 24 jam). Prosedur pemulihan terdokumentasi dan diuji sebelum rilis pertama, target pulih 4 jam. Dijalankan sebagai pg\_dump terjadwal di GitHub Actions ke penyimpanan privat, dienkripsi, memakai role baca-saja, dengan pengawas kesegaran jadwal serta latihan restore sebelum rilis publik dan tiap kuartal. |

## 5. Hal yang belum diputuskan

Tidak ada butir yang tercatat belum diputuskan. Butir terbuka sebelumnya, tempat penyimpanan pilihan tampilan terakhir Kalender (J-03), sudah diputuskan: disimpan di perangkat.
