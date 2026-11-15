> Salinan arsip dari dokumen Claude Docs: https://claude.ai/artifact/Uwvv8xhRgjgbXSKHWoBCav (versi hidup). Salinan teks ini tidak memuat gambar use case diagram; gambarnya hanya ada di dokumen asli. Diperbarui 2026-11-15 dengan perubahan dari dokumen Arsitektur Informasi (Bagian 8), lalu pada hari yang sama dengan keputusan dari wireframe (AU-1 sampai AU-7, UC-02, UC-19, UC-20, UC-21, UC-26, UC-27, UC-36, UC-39).

# Dokumen Use Case: Perencana Kerja Pribadi

Nov 15, 2026 · @cah

## 1. Pengantar

Dokumen ini memuat 39 use case yang disusun per tujuan pengguna dan merujuk ke ID kebutuhan di dokumen "Spesifikasi Kebutuhan Produk: Perencana Kerja Pribadi" (FR dan NFR). Tiap use case berisi deskripsi singkat, alur use case (prasyarat, alur utama, alur alternatif, hasil), dan use case diagram. Fitur yang masih ditunda (Ekspor dan Pemulihan) tidak dimasukkan. Navigasi dan aturan layar (J-01 sampai J-07) berlaku di semua use case dan belum dibuat use case tersendiri.

### 1.1 Aktor

- **Pengunjung:** orang yang belum login. Melakukan UC-01 sampai UC-04.
- **Pengguna:** pemilik akun yang sudah login. Melakukan UC-05 sampai UC-39.
- **Google:** aktor sekunder, layanan login (UC-03).
- **Layanan Email:** aktor sekunder, pengirim tautan reset password (UC-04).

### 1.2 Cara membaca diagram

- Satu kotak besar menandai batas sistem. Aktor utama ada di kiri, aktor sekunder di kanan.
- Garis lurus menghubungkan aktor dengan use case. Use case utama diberi warna aksen.
- Garis putus-putus berpanah menghubungkan use case utama dengan use case terkait. Tag di dalam elips terkait menyebut jenisnya: **include** berarti use case wajib yang dipanggil oleh use case utama (panah dari utama ke terkait), **extend** berarti perluasan yang hanya berjalan pada kondisi tertentu (panah dari perluasan ke use case utama).

### 1.3 Alur umum yang berlaku di semua use case

- **AU-1 Sesi habis:** bila sesi login berakhir saat formulir terbuka, muncul dialog login ulang di atas formulir dan isian tidak hilang (U-13). Emailnya terkunci ke akun yang sama, dan dialog tidak punya tombol Batal. Untuk akun Google, isian formulir disimpan lokal di perangkat sebelum pengalihan ke Google dan dikembalikan sesudahnya. Draf itu dihapus setelah dikembalikan, saat Keluar, atau saat akun lain masuk (N-60). Bila sesi habis saat tidak ada formulir terbuka, pengguna diarahkan ke halaman login dengan pesan sesi habis, lalu kembali ke tujuan semula setelah masuk (U-12).
- **AU-2 Offline:** aplikasi hanya bisa membaca data terakhir yang dimuat, dengan tanda "Data per [waktu]" (hari ini hanya jam, hari lain dengan tanggal). Semua aksi pengubah dinonaktifkan dengan penjelasan di dekat tombolnya (N-47, I-10). Saat koneksi kembali, aplikasi menampilkan "Tersambung kembali. Memperbarui data…" dan aksi ubah menunggu sinkron selesai. Perangkat tanpa data tersimpan menampilkan "Belum ada data di perangkat ini" dengan tombol Coba lagi.
- **AU-3 Data berubah di perangkat lain:** penyimpanan ditolak dengan pesan "Data berubah di perangkat lain. Muat ulang?" (N-46). Tombol Simpan nonaktif sampai pengguna menekan Muat ulang. Muat ulang menggantikan isian dengan data terbaru, dan pesan menyatakan hal itu sebelum tombol ditekan.
- **AU-4 Konfirmasi:** aksi bertingkat konfirmasi menampilkan dialog sesuai I-03. Memilih "Kembali" atau menekan Esc membatalkan aksi tanpa perubahan. Server memeriksa ulang dampak sebelum menjalankan aksi (I-10).
- **AU-5 Validasi gagal:** pesan error berbahasa Indonesia tampil di dekat kolom isian dan isian tidak hilang (N-20).
- **AU-6 Versi aplikasi usang:** bila server menolak permintaan karena klien lama, aplikasi menampilkan bilah "Ada versi baru aplikasi" dengan tombol Muat ulang, saat aplikasi dibuka atau saat aksi pertama ditolak. Memuat ulang bisa menghilangkan perubahan yang sedang diisi (N-76).
- **AU-7 Gagal memuat atau menyimpan:** status memuat, menyambungkan, dan gagal selalu jelas, dengan pesan berbahasa Indonesia yang menyebut akibat dan aksi yang bisa diambil, tanpa kode mentah (N-11). Bila server lambat bangun, setelah 8 detik muncul kalimat "Server sedang bangun, bisa sampai 1 menit.", dan aplikasi menyerah ke galat muat setelah 90 detik. Aksi instan (ceklis, update progress, tambah ke to-do, hapus entri) yang gagal mengembalikan baris ke keadaan semula dengan pesan di bawahnya dan tautan Coba lagi, tanpa toast (N-50).

Di tiap use case, alur alternatif hanya menyebut yang khas untuk use case itu dan merujuk ke AU-1 sampai AU-7 bila relevan.

## 2. Daftar use case

| ID | Use case | Aktor | FR terkait |
| --- | --- | --- | --- |
| UC-01 | Mendaftar akun | Pengunjung | U-01, U-02, U-03, U-12, U-14, U-15 |
| UC-02 | Masuk dengan email dan password | Pengunjung | U-05, U-06, U-08, U-12, U-15 |
| UC-03 | Masuk dengan Google | Pengunjung, Google | U-04, U-08, U-12, U-14 |
| UC-04 | Mereset password yang lupa | Pengunjung, Layanan Email | U-07 |
| UC-05 | Mengganti password | Pengguna | U-10 |
| UC-06 | Mengubah nama tampil | Pengguna | U-11 |
| UC-07 | Keluar dari akun | Pengguna | U-09 |
| UC-08 | Membuat projek | Pengguna | A-01, A-02 |
| UC-09 | Mengubah projek | Pengguna | A-02, A-05, A-08 |
| UC-10 | Melihat daftar dan detail projek | Pengguna | A-03, A-08 |
| UC-11 | Menyelesaikan projek lebih awal | Pengguna | A-04, I-04 |
| UC-12 | Membatalkan projek | Pengguna | A-05, I-04 |
| UC-13 | Menghapus projek | Pengguna | A-06, I-08 |
| UC-14 | Membuka kembali projek tertutup | Pengguna | A-07, A-02, B-01 |
| UC-15 | Membuat sesi | Pengguna | B-01, B-02, B-03 |
| UC-16 | Mengubah sesi | Pengguna | B-05, B-06 |
| UC-17 | Menghapus sesi | Pengguna | B-06 |
| UC-18 | Membatalkan sesi | Pengguna | B-06, I-04 |
| UC-19 | Membuat task di sesi | Pengguna | C-01 |
| UC-20 | Membuat task mandiri | Pengguna | C-02, C-03 |
| UC-21 | Mengubah task | Pengguna | C-04, H-06 |
| UC-22 | Memindahkan task | Pengguna | C-04 |
| UC-23 | Memperbarui progress atau menyelesaikan task | Pengguna | C-06, C-08, C-09, H-06 |
| UC-24 | Membuka kembali task selesai | Pengguna | C-07 |
| UC-25 | Membatalkan task | Pengguna | C-05 |
| UC-26 | Mengelola label | Pengguna | C-03, H-07 |
| UC-27 | Mencari dan memfilter task | Pengguna | H-01 sampai H-06, H-08, D-04 |
| UC-28 | Merencanakan task ke to-do | Pengguna | E-01, E-02, E-05, E-08 |
| UC-29 | Menyusun blok jam | Pengguna | E-03, E-04, F-08 |
| UC-30 | Mengerjakan to-do hari ini | Pengguna | E-06, E-07, E-10, E-11 |
| UC-31 | Memindahkan task belum selesai ke hari ini | Pengguna | E-09 |
| UC-32 | Membuat Jadwal | Pengguna | F-01, F-02, F-05, F-06, J-03 |
| UC-33 | Mengubah atau mengakhiri Jadwal | Pengguna | F-03, F-09 |
| UC-34 | Mengatur pengecualian Jadwal | Pengguna | F-04, F-06, J-03 |
| UC-35 | Melihat jam kosong | Pengguna | F-07, G-04 |
| UC-36 | Melihat Kalender | Pengguna | G-01 sampai G-05, J-03 |
| UC-37 | Melihat Dashboard | Pengguna | D-01 sampai D-03, D-05 sampai D-10 |
| UC-38 | Melihat pola kerja | Pengguna | D-11, D-12 |
| UC-39 | Melihat detail task | Pengguna | H-06, C-08, E-12, J-04, J-06 |

## 3. Akun (UC-01 sampai UC-07)

#### UC-01 Mendaftar akun

**Aktor:** Pengunjung · **FR:** U-01, U-02, U-03, U-12, U-14, U-15

Pengunjung membuat akun baru dengan email dan password, lalu langsung masuk ke aplikasi.

**Prasyarat:** Pengunjung belum login dan membuka halaman daftar.

**Alur utama:**

1. Pengunjung mengisi email, ulangi email, password, dan nama tampil (opsional).
2. Sistem memvalidasi isian: email berformat valid, email dan ulangi email sama, password 8 sampai 128 karakter, nama tampil maks 45 karakter.
3. Sistem mendeteksi zona waktu dari browser (cadangan Asia/Jakarta) dan menyimpannya di akun.
4. Sistem membuat akun dan sesi login 30 hari.
5. Sistem membuka Dashboard dengan data kosong dan empty state, tanpa onboarding.

**Alur alternatif:**

- **A1** Email sudah terdaftar (oleh akun email maupun akun Google): sistem menampilkan "email sudah terdaftar" dan akun tidak dibuat.
- **A2** Email dan ulangi email berbeda, atau validasi lain gagal: AU-5, akun tidak dibuat.
- **A3** Pengunjung yang sudah login membuka halaman daftar: diarahkan ke Dashboard.

**Hasil:** Akun baru dengan data terpisah dan pengguna sudah masuk, tanpa verifikasi email.

&#91;embedded content: use case diagram · UC-01 Mendaftar akun\]

#### UC-02 Masuk dengan email dan password

**Aktor:** Pengunjung · **FR:** U-05, U-06, U-08, U-12, U-15

Pengunjung masuk ke akunnya dengan email dan password.

**Prasyarat:** Akun email dan password sudah ada, pengunjung belum login.

**Alur utama:**

1. Pengunjung membuka halaman login, atau dialihkan ke sana dari halaman lain yang butuh login.
2. Pengunjung mengisi email dan password.
3. Sistem memverifikasi kredensial.
4. Sistem membuat sesi login (30 hari, diperpanjang setiap dipakai).
5. Sistem membuka halaman tujuan semula bila ada, kalau tidak Dashboard.

**Alur alternatif:**

- **A1** Kredensial salah: sistem selalu menampilkan "email atau password salah" tanpa membedakan penyebabnya.
- **A2** Lima kali gagal berturut-turut: login ditunda 15 menit (dihitung per akun dan per alamat IP) dan pesan menyebut pengguna harus menunggu. Tombol Masuk tetap aktif selama penundaan, dan server yang menolak. Tidak berlaku untuk login Google.
- **A3** Pengunjung lupa password: menjalankan UC-04.
- **A4** Akun dibuat lewat Google dan belum punya password: login email gagal seperti A1. Pengunjung memakai UC-03 atau membuat password lewat UC-04.
- **A5** Pengunjung yang sudah login membuka halaman login: diarahkan ke Dashboard.
- **A6** Pengunjung diarahkan ke halaman login karena sesi habis (AU-1): halaman menampilkan pesan sesi habis, dan setelah masuk pengguna kembali ke tujuan semula.

**Hasil:** Pengguna masuk dan sesi tersimpan di perangkat.

&#91;embedded content: use case diagram · UC-02 Masuk dengan email dan password\]

#### UC-03 Masuk dengan Google

**Aktor:** Pengunjung, Google · **FR:** U-04, U-08, U-12, U-14

Pengunjung masuk, atau sekaligus membuat akun, lewat akun Google tanpa mengisi formulir.

**Prasyarat:** Pengunjung belum login.

**Alur utama:**

1. Pengunjung memilih "Masuk dengan Google".
2. Sistem mengalihkan pengunjung ke Google dan Google meminta persetujuan.
3. Google mengembalikan identitas (email terverifikasi dan profil).
4. Sistem mencocokkan email dengan akun yang ada.
5. Sistem membuat sesi login dan membuka halaman tujuan semula atau Dashboard.

**Alur alternatif:**

- **A1** Email belum punya akun (login Google pertama): sistem membuat akun baru otomatis, mengisi nama tampil dari profil Google, dan mendeteksi zona waktu dari browser.
- **A2** Email sudah dipakai akun email dan password: kedua akun ditautkan menjadi satu. Password lama dihapus dan semua sesi login lain dicabut. Akun lalu hanya bisa masuk lewat Google sampai pengguna membuat password lewat UC-04.
- **A3** Persetujuan ditolak atau Google gagal: pengunjung kembali ke halaman login dan tidak ada akun atau sesi yang dibuat.

**Hasil:** Pengguna masuk. Untuk login pertama, akun baru sudah tersedia.

&#91;embedded content: use case diagram · UC-03 Masuk dengan Google\]

#### UC-04 Mereset password yang lupa

**Aktor:** Pengunjung, Layanan Email · **FR:** U-07

Pengunjung yang lupa password, atau yang belum punya password karena masuk lewat Google, membuat password baru lewat tautan yang dikirim ke emailnya.

**Prasyarat:** Pengunjung belum login dan bisa membuka emailnya.

**Alur utama:**

1. Pengunjung memilih "lupa password" dan mengisi email.
2. Sistem menampilkan respons yang sama, baik email terdaftar maupun tidak.
3. Bila email terdaftar, Layanan Email mengirim tautan reset yang berlaku 30 menit dan sekali pakai.
4. Pengunjung membuka tautan dan mengisi password baru (8 sampai 128 karakter).
5. Sistem menyimpan password baru dan mencabut semua sesi login lain.

**Alur alternatif:**

- **A1** Tautan sudah terpakai atau kedaluwarsa: sistem menampilkan pesan dan menawarkan meminta tautan baru.
- **A2** Password baru tidak valid: AU-5.
- **A3** Akun belum punya password (daftar lewat Google): alur ini membuat password pertamanya.

**Hasil:** Password baru berlaku, sesi login lain dicabut, dan pengunjung dapat masuk dengan password baru (UC-02).

&#91;embedded content: use case diagram · UC-04 Mereset password yang lupa\]

#### UC-05 Mengganti password

**Aktor:** Pengguna · **FR:** U-10, U-03

Pengguna yang akunnya punya password menggantinya dengan password baru.

**Prasyarat:** Pengguna sudah login dan akunnya punya password.

**Alur utama:**

1. Pengguna membuka bagian akun dan memilih ganti password.
2. Pengguna mengisi password lama dan password baru.
3. Sistem memverifikasi password lama dan memvalidasi password baru (8 sampai 128 karakter).
4. Sistem menyimpan password baru.
5. Sistem mencabut semua sesi login lain. Perangkat yang sedang dipakai tetap masuk.

**Alur alternatif:**

- **A1** Password lama salah: sistem menampilkan pesan di kolom password lama dan password tidak berubah.
- **A2** Password baru tidak valid: AU-5.
- **A3** Akun dibuat lewat Google dan belum punya password: fitur ganti password tidak tersedia. Password pertama dibuat lewat UC-04.
- **A4** Data akun berubah di perangkat lain saat menyimpan: AU-3.

**Hasil:** Password baru berlaku, sesi di perangkat lain berakhir, dan perangkat ini tetap masuk.

&#91;embedded content: use case diagram · UC-05 Mengganti password\]

#### UC-06 Mengubah nama tampil

**Aktor:** Pengguna · **FR:** U-11

Pengguna mengubah nama yang ditampilkan di akunnya. Email tidak bisa diubah.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna membuka bagian akun dan memilih ubah nama tampil.
2. Pengguna mengisi nama tampil baru.
3. Sistem memvalidasi isian (opsional, maks 45 karakter).
4. Sistem menyimpan nama tampil baru dan menampilkannya.

**Alur alternatif:**

- **A1** Nama lebih dari 45 karakter: AU-5 dan nama tidak berubah.
- **A2** Nama dikosongkan: tetap valid karena nama tampil bersifat opsional.
- **A3** Pengguna mencoba mengubah email: tidak tersedia, email tidak bisa diubah (ganti email di luar cakupan).
- **A4** Data akun berubah di perangkat lain saat menyimpan: AU-3.

**Hasil:** Nama tampil baru tersimpan di akun.

&#91;embedded content: use case diagram · UC-06 Mengubah nama tampil\]

#### UC-07 Keluar dari akun

**Aktor:** Pengguna · **FR:** U-09

Pengguna mengakhiri sesi login di perangkat yang sedang dipakai.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna memilih Keluar.
2. Sistem mengakhiri sesi login di perangkat ini tanpa dialog konfirmasi.
3. Sistem menghapus cache offline di perangkat ini.
4. Sistem mengarahkan pengguna ke halaman login.

**Alur alternatif:**

- **A1** Pengguna masuk di perangkat lain: sesi di perangkat itu tidak terpengaruh. Fitur keluar dari semua perangkat di luar cakupan.

**Hasil:** Perangkat ini tidak lagi memegang sesi maupun data akun.

&#91;embedded content: use case diagram · UC-07 Keluar dari akun\]

## 4. Projek (UC-08 sampai UC-14)

#### UC-08 Membuat projek

**Aktor:** Pengguna · **FR:** A-01, A-02

Pengguna membuat projek baru sebagai wadah sesi dan task.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna memilih buat projek di halaman Projek.
2. Pengguna mengisi nama (maks 45 karakter) dan deskripsi (opsional, maks 500 karakter).
3. Pengguna memilih warna: otomatis dari palet (awal 12 warna) atau manual.
4. Sistem memvalidasi nama (unik tanpa beda kapital, tidak sama dengan label mandiri, "Mandiri" dicadangkan) dan warna (berbeda dari semua projek yang belum tertutup).
5. Sistem menyimpan projek dengan status belum dijadwalkan. Dokumen tidak diisi saat pembuatan dan ditambahkan lewat UC-09.

**Alur alternatif:**

- **A1** Nama kosong, terlalu panjang, atau sama dengan projek lain: AU-5.
- **A2** Nama sama dengan sebuah label mandiri, termasuk yang tanpa task: pesan error menyebut label itu dan menawarkan "Ganti nama" projek atau "Hapus label" (UC-26). Bila label itu sudah punya task (aktif, selesai, atau batal), label tidak bisa dihapus: tautannya menjadi "Kelola label" dan hanya "Ganti nama" yang ditawarkan.
- **A3** Warna manual terlalu mirip dengan warna projek lain, atau berkontras kurang dari 3:1 di tema terang atau gelap: warna ditolak dan pengguna memilih warna lain.
- **A4** Warna milik projek tertutup: boleh dipakai lagi.

**Hasil:** Projek baru berstatus belum dijadwalkan dan siap diberi sesi (UC-15).

&#91;embedded content: use case diagram · UC-08 Membuat projek\]

#### UC-09 Mengubah projek

**Aktor:** Pengguna · **FR:** A-02, A-05, A-08

Pengguna mengubah nama, deskripsi, warna, atau dokumen projek.

**Prasyarat:** Pengguna sudah login dan projek belum tertutup.

**Alur utama:**

1. Pengguna membuka detail projek (UC-10) dan memilih edit.
2. Pengguna mengubah nama, deskripsi, warna, atau dokumen.
3. Sistem memvalidasi nama seperti UC-08 dan warna terhadap projek yang belum tertutup.
4. Sistem menyimpan perubahan.

**Alur alternatif:**

- **A1** Projek sudah tertutup (selesai atau batal): tombol edit nonaktif. Pengguna membukanya kembali lewat UC-14.
- **A2** Nama bentrok dengan projek atau label mandiri: AU-5, perubahan tidak disimpan.
- **A3** Nama projek berubah: label semua task sesi di projek itu ikut berubah.
- **A4** Pengelolaan dokumen: maksimal 10 dokumen, nama wajib, "https://" ditambahkan otomatis bila tanpa skema. Dokumen ke-11 ditolak.
- **A5** Data berubah di perangkat lain: AU-3.

**Hasil:** Data projek yang diubah tersimpan.

&#91;embedded content: use case diagram · UC-09 Mengubah projek\]

#### UC-10 Melihat daftar dan detail projek

**Aktor:** Pengguna · **FR:** A-03, A-08

Pengguna melihat semua projeknya beserta status, lalu membuka detail satu projek.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna membuka halaman Projek.
2. Sistem menghitung status turunan tiap projek dan menampilkan kartu berisi nama, deskripsi singkat, timeline, sesi, warna, dan status. Urutannya: sesi bertanggal akhir terdekat (berjalan lebih dulu), jeda, tanpa sesi, melewati jadwal, tertutup, lalu abjad.
3. Pengguna dapat memfilter berdasarkan status (default semua status).
4. Pengguna membuka sebuah kartu.
5. Sistem menampilkan detail: dokumen, ringkasan "N dari M task selesai" (M tidak menghitung task batal), sesi dan task per sesi, serta aksi edit, tambah sesi, selesai dini, batal, hapus, dan buka kembali.

**Alur alternatif:**

- **A1** Aksi yang prasyaratnya belum terpenuhi ditampilkan nonaktif.
- **A2** Filter tidak menghasilkan projek: daftar tampil kosong.
- **A3** Pengguna memilih sebuah aksi: lanjut ke UC-09, UC-11 sampai UC-15.
- **A4** Offline: data terakhir yang dimuat tetap terbaca (AU-2).

**Hasil:** Pengguna melihat kondisi tiap projek tanpa mengubah data.

&#91;embedded content: use case diagram · UC-10 Melihat daftar dan detail projek\]

#### UC-11 Menyelesaikan projek lebih awal

**Aktor:** Pengguna · **FR:** A-04, I-04, I-10

Pengguna menutup projek yang masih punya sisa periode setelah semua task aktifnya beres.

**Prasyarat:** Projek berstatus berjalan atau jeda dan tidak punya task aktif.

**Alur utama:**

1. Pengguna membuka detail projek dan memilih selesai dini.
2. Sistem menampilkan dialog konfirmasi berat dengan nama projek, bagian "Akan terjadi" dan "Tetap ada", daftar nama maks 5 ("dan N lainnya"), serta peringatan bahwa aksi tidak bisa diurungkan. Dampaknya: sesi berjalan dipotong sampai kemarin, sesi yang mulai hari ini dan sesi belum mulai dihapus bila kosong atau ditandai batal bila bertask, dan projek menjadi selesai dan terkunci.
3. Pengguna mengonfirmasi lewat tombol destruktif berlabel spesifik.
4. Server memeriksa ulang dampak lalu menjalankan semuanya dalam satu transaksi.
5. Sistem menampilkan projek berstatus selesai dan terkunci.

**Alur alternatif:**

- **A1** Status projek belum dijadwalkan, belum mulai, melewati jadwal, selesai, atau batal, atau masih ada task aktif: tombol selesai dini nonaktif.
- **A2** Pengguna memilih "Kembali" atau menekan Esc: aksi dibatalkan tanpa perubahan (AU-4). Fokus awal ada di "Kembali" dan Enter tidak menjalankan aksi.
- **A3** Hasil pemeriksaan server berbeda dari dialog (data berubah di perangkat lain): aksi tidak dijalankan dan dialog diperbarui dengan data terbaru (I-10).
- **A4** Task selesai dengan deadline setelah titik potong ditandai "di luar periode".
- **A5** Projek yang satu-satunya sesinya baru mulai hari ini tampil belum dijadwalkan setelah diselesaikan dini.
- **A6** Offline: aksi dinonaktifkan (AU-2).

**Hasil:** Projek selesai dan terkunci. Sesi lewat, task selesai, dan riwayat tetap ada.

&#91;embedded content: use case diagram · UC-11 Menyelesaikan projek lebih awal\]

#### UC-12 Membatalkan projek

**Aktor:** Pengguna · **FR:** A-05, I-04, I-10

Pengguna membatalkan projek yang tidak jadi dikerjakan.

**Prasyarat:** Projek berstatus apa pun kecuali selesai dan batal.

**Alur utama:**

1. Pengguna membuka detail projek dan memilih batal.
2. Sistem menampilkan dialog konfirmasi berat: N task aktif dibatalkan, sesi berjalan dan belum mulai ditandai batal, projek menjadi batal dan terkunci. Yang tetap ada: sesi lewat, task selesai, dan riwayat.
3. Pengguna mengonfirmasi.
4. Server memeriksa ulang dampak lalu menjalankan pembatalan dalam satu transaksi.

**Alur alternatif:**

- **A1** Projek tanpa sesi bertask: pembatalan berarti projek dihapus.
- **A2** Projek dengan sesi bertask: projek berstatus batal dan tetap tampil.
- **A3** "Kembali" atau Esc membatalkan aksi (AU-4). Hasil pemeriksaan server berbeda: dialog diperbarui (I-10).
- **A4** Offline: aksi dinonaktifkan (AU-2).

**Hasil:** Projek batal dan terkunci, atau terhapus bila tanpa sesi bertask. Pembatalan tidak bisa diurungkan.

&#91;embedded content: use case diagram · UC-12 Membatalkan projek\]

#### UC-13 Menghapus projek

**Aktor:** Pengguna · **FR:** A-06, I-08

Pengguna menghapus projek yang masih kosong.

**Prasyarat:** Projek tidak punya sesi.

**Alur utama:**

1. Pengguna membuka detail projek dan memilih hapus.
2. Sistem menampilkan dialog konfirmasi ringan berisi satu kalimat akibat.
3. Pengguna mengonfirmasi.
4. Sistem menghapus projek.

**Alur alternatif:**

- **A1** Projek punya sesi, atau pernah punya sesi bertask: tombol hapus nonaktif. Pengguna memakai UC-12.
- **A2** "Kembali" atau Esc membatalkan aksi (AU-4).
- **A3** Offline: aksi dinonaktifkan (AU-2).

**Hasil:** Projek hilang dan tidak bisa dipulihkan.

&#91;embedded content: use case diagram · UC-13 Menghapus projek\]

#### UC-14 Membuka kembali projek tertutup

**Aktor:** Pengguna · **FR:** A-07, A-02, B-01

Pengguna mengaktifkan lagi projek yang selesai atau batal dengan menambah sesi baru.

**Prasyarat:** Projek berstatus selesai atau batal.

**Alur utama:**

1. Pengguna membuka detail projek tertutup dan memilih buka kembali.
2. Sistem menampilkan dialog konfirmasi ringan.
3. Pengguna mengonfirmasi, lalu mengisi sesi baru yang berakhir pada atau setelah hari ini (UC-15).
4. Sistem menyimpan sesi dan membuka kembali projek. Statusnya mengikuti hitungan turunan.

**Alur alternatif:**

- **A1** Warna lama projek sudah dipakai projek lain yang belum tertutup: pengguna wajib memilih warna baru.
- **A2** Pengguna membatalkan alur sebelum sesi tersimpan: status projek tidak berubah.
- **A3** Sesi baru tidak valid (tanggal atau nama): AU-5.
- **A4** Offline: aksi dinonaktifkan (AU-2).

**Hasil:** Projek terbuka dan bisa diedit lagi. Sesi yang terhapus atau batal dan task batal tidak dipulihkan.

&#91;embedded content: use case diagram · UC-14 Membuka kembali projek tertutup\]

## 5. Sesi (UC-15 sampai UC-18)

#### UC-15 Membuat sesi

**Aktor:** Pengguna · **FR:** B-01, B-02, B-03

Pengguna menambah sesi (rentang tanggal kerja) ke sebuah projek.

**Prasyarat:** Projek belum tertutup.

**Alur utama:**

1. Pengguna membuka detail projek dan memilih tambah sesi (ditekankan bila projek belum punya sesi).
2. Pengguna mengisi nama (maks 45 karakter), tanggal mulai, tanggal akhir, dan deskripsi (opsional, maks 500 karakter).
3. Sistem memvalidasi: nama unik di antara sesi non-batal dalam projek itu, tanggal akhir pada atau setelah tanggal mulai dan pada atau setelah hari ini, serta periode tidak bertumpang tindih dengan sesi non-batal.
4. Sistem menyimpan sesi. Status sesi dan status projek dihitung ulang secara turunan.

**Alur alternatif:**

- **A1** Projek sudah tertutup: tambah sesi tidak tersedia. Pengguna membukanya kembali lewat UC-14.
- **A2** Periode bertabrakan dengan sesi non-batal: pesan error menyebut sesi yang bertabrakan. Akhir tanggal 14 dan mulai tanggal 15 diperbolehkan karena tanggal bersifat inklusif.
- **A3** Periode bertumpang tindih dengan sesi batal: diperbolehkan, dan nama sesi batal tidak dihitung untuk keunikan.
- **A4** Validasi lain gagal: AU-5.

**Hasil:** Sesi baru tampil di detail projek dengan dokumen projek (hanya dibuka) dan ringkasan "N dari M task selesai".

&#91;embedded content: use case diagram · UC-15 Membuat sesi\]

#### UC-16 Mengubah sesi

**Aktor:** Pengguna · **FR:** B-05, B-06, I-04, I-10

Pengguna mengubah nama, deskripsi, atau periode sebuah sesi.

**Prasyarat:** Projek belum tertutup dan sesi tidak berstatus batal.

**Alur utama:**

1. Pengguna membuka detail projek dan memilih edit pada sebuah sesi.
2. Pengguna mengubah nama, deskripsi, atau periode.
3. Sistem memvalidasi nama dan periode seperti UC-15.
4. Bila perubahan periode membuat task keluar periode, sistem menampilkan dialog konfirmasi berat: N task keluar periode (daftar maks 5, "dan N lainnya"), sedangkan task dan progress tetap ada.
5. Pengguna mengonfirmasi dan sistem menyimpan perubahan.

**Alur alternatif:**

- **A1** Sesi berstatus selesai: periode terkunci, hanya nama dan deskripsi yang bisa diubah (tanpa konfirmasi).
- **A2** Sesi batal: hanya bisa dilihat.
- **A3** Perubahan membuat projek menjadi selesai: dialog berat memuat baris "Projek akan menjadi selesai dan terkunci".
- **A4** Perubahan periode tanpa task yang keluar periode: tidak ada dialog dan perubahan langsung disimpan.
- **A5** "Kembali" atau Esc membatalkan perubahan (AU-4). Hasil pemeriksaan server berbeda dari dialog: dialog diperbarui (I-10).
- **A6** Validasi gagal: AU-5.

**Hasil:** Sesi tersimpan dengan data baru. Task yang keluar periode ditandai "di luar periode" secara turunan.

&#91;embedded content: use case diagram · UC-16 Mengubah sesi\]

#### UC-17 Menghapus sesi

**Aktor:** Pengguna · **FR:** B-06, I-03, I-08

Pengguna menghapus sesi yang kosong.

**Prasyarat:** Sesi belum mulai tanpa task, atau sesi batal tanpa task.

**Alur utama:**

1. Pengguna memilih hapus pada sesi di detail projek.
2. Sistem menampilkan dialog konfirmasi ringan berisi satu kalimat akibat.
3. Pengguna mengonfirmasi.
4. Sistem menghapus sesi dan menghitung ulang status projek.

**Alur alternatif:**

- **A1** Sesi berjalan, selesai, atau punya task: hapus tidak tersedia. Sesi dengan task aktif dapat dibatalkan lewat UC-18.
- **A2** Penghapusan membuat projek menjadi selesai: konfirmasi naik menjadi berat dengan baris "Projek akan menjadi selesai dan terkunci".
- **A3** "Kembali" atau Esc membatalkan aksi (AU-4).
- **A4** Offline: aksi dinonaktifkan (AU-2).

**Hasil:** Sesi hilang dan tidak bisa dipulihkan.

&#91;embedded content: use case diagram · UC-17 Menghapus sesi\]

#### UC-18 Membatalkan sesi

**Aktor:** Pengguna · **FR:** B-06, I-04, I-10

Pengguna membatalkan sesi beserta task aktif di dalamnya.

**Prasyarat:** Projek belum tertutup dan sesi belum berstatus batal.

**Alur utama:**

1. Pengguna memilih batal pada sesi di detail projek.
2. Sistem menampilkan dialog konfirmasi berat: N task aktif dibatalkan dan sesi batal permanen. Yang tetap ada: periode sesi (tidak dipotong), task selesai, dan riwayat.
3. Pengguna mengonfirmasi.
4. Server memeriksa ulang dampak lalu menjalankan pembatalan sesi dan task aktifnya dalam satu transaksi.

**Alur alternatif:**

- **A1** Pembatalan membuat projek menjadi selesai: dialog memuat baris "Projek akan menjadi selesai dan terkunci".
- **A2** "Kembali" atau Esc membatalkan aksi (AU-4). Hasil pemeriksaan server berbeda: dialog diperbarui (I-10).
- **A3** Offline: aksi dinonaktifkan (AU-2).

**Hasil:** Sesi batal dan hanya bisa dilihat. Task aktifnya batal, sedangkan task selesai dan riwayat tetap. Periode sesi batal boleh dipakai sesi baru.

&#91;embedded content: use case diagram · UC-18 Membatalkan sesi\]

## 6. Task (UC-19 sampai UC-25)

#### UC-19 Membuat task di sesi

**Aktor:** Pengguna · **FR:** C-01

Pengguna menambah task ke sebuah sesi. Label task otomatis nama projeknya.

**Prasyarat:** Sesi belum mulai atau berjalan, di projek yang belum tertutup.

**Alur utama:**

1. Pengguna memilih tambah task pada sebuah sesi di detail projek, atau memulainya dari Daftar Task dan memilih sesinya.
2. Pengguna mengisi nama (wajib, maks 30 karakter), deskripsi (opsional, maks 1000 karakter), deadline (tanggal dalam periode sesi), jam deadline (opsional), dan kesulitan (wajib, 1 sampai 5, nilai awal 3).
3. Sistem memvalidasi nama (unik di antara task aktif berlabel sama) dan deadline (pada atau setelah hari ini; jam kelipatan 5 menit dan belum lewat).
4. Sistem menyimpan task dengan progress 0 dan label nama projek.

**Alur alternatif:**

- **A1** Sesi sudah selesai atau batal, atau projek tertutup: task tidak bisa ditambah ke sesi itu.
- **A2** Nama sama dengan task aktif berlabel sama: AU-5. Nama yang sama dengan task berlabel lain diperbolehkan.
- **A3** Deadline di luar periode sesi, sebelum hari ini, atau jam sudah lewat: AU-5.

**Hasil:** Task aktif baru di sesi itu, siap direncanakan ke to-do (UC-28).

&#91;embedded content: use case diagram · UC-19 Membuat task di sesi\]

#### UC-20 Membuat task mandiri

**Aktor:** Pengguna · **FR:** C-02, C-03

Pengguna membuat task yang tidak berada di sesi mana pun dan punya label sendiri.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna memilih tambah task mandiri dari Daftar Task.
2. Pengguna mengisi nama dan atribut lain seperti UC-19, dengan deadline opsional dan kesulitan wajib (nilai awal 3).
3. Pengguna memilih satu label dari saran (label mandiri yang pernah punya task, urut dari yang terakhir dipakai) atau mengetik label baru.
4. Sistem memvalidasi nama task dan label (maks 30 karakter, unik tanpa beda kapital, tidak sama dengan nama projek, "Mandiri" dicadangkan).
5. Sistem menyimpan task mandiri.

**Alur alternatif:**

- **A1** Label dikosongkan: AU-5, label wajib.
- **A2** Pengguna mengetik nama label lama yang tidak punya task: label itu dipakai ulang.
- **A3** Label sama dengan nama projek: ditolak, AU-5.
- **A4** Nama sama dengan task aktif berlabel sama: AU-5.

**Hasil:** Task mandiri aktif berlabel pilihan pengguna.

&#91;embedded content: use case diagram · UC-20 Membuat task mandiri\]

#### UC-21 Mengubah task

**Aktor:** Pengguna · **FR:** C-04, H-06

Pengguna mengubah atribut task yang masih aktif.

**Prasyarat:** Task berstatus aktif.

**Alur utama:**

1. Pengguna membuka panel detail task (H-06) dan memilih edit.
2. Pengguna mengubah nama, deskripsi, deadline, jam, atau kesulitan.
3. Sistem memvalidasi nama terhadap task aktif berlabel sama.
4. Bila deadline atau sesinya berubah, sistem memvalidasi deadline seperti UC-19.
5. Sistem menyimpan perubahan.

**Alur alternatif:**

- **A1** Task selesai atau batal: tidak bisa diedit. Task selesai dibuka kembali lewat UC-24, task batal hanya bisa dilihat.
- **A2** Deadline tidak berubah: validasi deadline tidak dijalankan ulang.
- **A3** Label tidak bisa diganti dari sini. Label task sesi mengikuti nama projeknya. Label task mandiri tampil hanya-baca, dan tidak ada jalan mengganti label task mandiri kecuali memindahkannya ke sesi (UC-22).
- **A4** Validasi gagal: AU-5. Data berubah di perangkat lain: AU-3.

**Hasil:** Task tersimpan dengan data baru.

&#91;embedded content: use case diagram · UC-21 Mengubah task\]

#### UC-22 Memindahkan task

**Aktor:** Pengguna · **FR:** C-04, 2.4 (aturan penutupan projek)

Pengguna memindahkan sebuah task aktif dari mandiri ke sesi, dari sesi ke mandiri, atau antar-sesi.

**Prasyarat:** Task berstatus aktif.

**Alur utama:**

1. Pengguna memilih pindah pada task, satu task per aksi.
2. Sistem menampilkan formulir pindah dengan deadline lama.
3. Pengguna memilih tujuan: sesi belum mulai atau berjalan di projek belum tertutup, atau mandiri dengan label yang dipilih.
4. Sistem memeriksa bahwa nama task tidak bentrok dengan task aktif di label tujuan.
5. Sistem memindahkan task. Label berubah otomatis mengikuti tujuan.

**Alur alternatif:**

- **A1** Deadline lama tidak valid di tujuan: formulir meminta deadline diganti.
- **A2** Pindah ke mandiri tanpa label: wajib memilih label.
- **A3** Nama bentrok di label tujuan: AU-5 dan pengguna mengganti nama.
- **A4** Pemindahan membuat projek asal menjadi selesai: dialog konfirmasi berat dengan baris "Projek akan menjadi selesai dan terkunci" (AU-4).
- **A5** Pemindahan tidak dicatat di riwayat.

**Hasil:** Task berada di tujuan baru dengan label baru.

&#91;embedded content: use case diagram · UC-22 Memindahkan task\]

#### UC-23 Memperbarui progress atau menyelesaikan task

**Aktor:** Pengguna · **FR:** C-06, C-08, C-09, H-06

Pengguna mencatat kemajuan task dengan nilai progress 0 sampai 10. Progress 10 sama dengan Selesai.

**Prasyarat:** Task berstatus aktif.

**Alur utama:**

1. Pengguna mengubah progress dari to-do, Daftar Task, atau panel detail task, dan boleh menulis deskripsi (opsional, maks 500 karakter).
2. Sistem memeriksa bahwa nilai baru (bilangan bulat 0 sampai 10) berbeda dari nilai sekarang.
3. Sistem menyimpan nilai baru dan menambahkan satu baris riwayat: tanggal dan jam, nilai sebelum dan sesudah, deskripsi, serta penanda.
4. Sistem menampilkan progress baru tanpa dialog konfirmasi.

**Alur alternatif:**

- **A1** Nilai baru sama dengan nilai sekarang: ditolak, AU-5.
- **A2** Nilai 10, lewat kontrol mana pun, atau tombol Selesai: task menjadi selesai dan baris riwayat bertanda Selesai. Tidak ada konfirmasi.
- **A3** Task yang diselesaikan membuat projek menjadi selesai: dialog konfirmasi berat dengan baris "Projek akan menjadi selesai dan terkunci" (AU-4).
- **A4** Pengguna membuka riwayat progress di dalam panel detail task: baris tampil dengan yang terbaru lebih dulu dan tidak bisa diedit.
- **A5** Progress yang tampil di baris daftar tidak memengaruhi urutan daftar.
- **A6** Server menolak atau tidak menjawab saat pembaruan instan: baris kembali ke keadaan semula dengan pesan dan tautan Coba lagi (AU-7).

**Hasil:** Progress terbaru tersimpan dengan riwayat append-only. Task selesai bila nilainya 10.

&#91;embedded content: use case diagram · UC-23 Memperbarui progress atau menyelesaikan task\]

#### UC-24 Membuka kembali task selesai

**Aktor:** Pengguna · **FR:** C-07

Pengguna mengaktifkan lagi task yang sudah selesai.

**Prasyarat:** Task berstatus selesai, di sesi yang tidak batal.

**Alur utama:**

1. Pengguna memilih buka kembali pada task selesai.
2. Sistem mengembalikan progress ke nilai sebelum 10, tanpa konfirmasi, dan mencatatnya di riwayat dengan penanda Buka kembali.
3. Sistem menampilkan task sebagai aktif.

**Alur alternatif:**

- **A1** Projek sudah tertutup: ditolak. Untuk projek selesai, projeknya dibuka kembali dulu lewat UC-14.
- **A2** Sesi batal: ditolak.
- **A3** Nama bentrok dengan task aktif berlabel sama: formulir meminta nama baru.
- **A4** Entri to-do lama tidak dikembalikan.
- **A5** Task berada di sesi yang sudah selesai: task yang dibuka kembali langsung telat. Jalan keluarnya memindahkannya ke sesi baru (UC-22).

**Hasil:** Task kembali aktif dengan progress sebelum 10.

&#91;embedded content: use case diagram · UC-24 Membuka kembali task selesai\]

#### UC-25 Membatalkan task

**Aktor:** Pengguna · **FR:** C-05, I-08

Pengguna membatalkan task aktif yang tidak jadi dikerjakan.

**Prasyarat:** Task berstatus aktif.

**Alur utama:**

1. Pengguna memilih batal pada task.
2. Sistem menampilkan dialog konfirmasi ringan berisi satu kalimat akibat.
3. Pengguna mengonfirmasi.
4. Sistem menandai task batal dan menyimpan waktu batalnya sebagai metadata.

**Alur alternatif:**

- **A1** Pembatalan membuat projek menjadi selesai: konfirmasi berat dengan baris "Projek akan menjadi selesai dan terkunci" (AU-4).
- **A2** "Kembali" atau Esc membatalkan aksi (AU-4).
- **A3** Alasan pembatalan tidak dicatat dan tidak ada fitur urungkan.

**Hasil:** Task batal, hanya bisa dilihat, dan tidak bisa dipulihkan.

&#91;embedded content: use case diagram · UC-25 Membatalkan task\]

## 7. Label dan Daftar Task (UC-26 sampai UC-27)

#### UC-26 Mengelola label

**Aktor:** Pengguna · **FR:** C-03, H-07

Pengguna melihat semua label mandiri, mengganti namanya, atau menghapus label yang tidak dipakai.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna memilih Kelola label di Daftar Task.
2. Sistem membuka dialog Kelola label (dialog tengah, juga di HP) yang menampilkan semua label mandiri, termasuk yang tanpa task, dengan aksi ganti nama dan hapus.
3. Untuk ganti nama, pengguna mengisi nama baru. Sistem memvalidasinya: maks 30 karakter, unik tanpa beda kapital, tidak sama dengan nama projek, "Mandiri" dicadangkan.
4. Untuk hapus, pengguna memilih hapus pada label tanpa task sama sekali, lalu mengonfirmasi dialog ringan.

**Alur alternatif:**

- **A1** Label masih punya task (aktif, selesai, atau batal): hapus tidak tersedia.
- **A2** Nama baru bentrok dengan label atau projek lain: ditolak, AU-5.
- **A3** Label task sesi adalah nama projeknya dan tidak muncul di sini. Mengubahnya lewat ganti nama projek (UC-09).
- **A4** "Kembali" atau Esc membatalkan hapus (AU-4). Offline: aksi dinonaktifkan (AU-2).

**Hasil:** Daftar label mandiri sesuai perubahan. Label yang dihapus tidak bisa dipulihkan.

&#91;embedded content: use case diagram · UC-26 Mengelola label\]

#### UC-27 Mencari dan memfilter task

**Aktor:** Pengguna · **FR:** H-01 sampai H-06, H-08, D-04

Pengguna menemukan task di Daftar Task lewat filter dan pencarian, lalu bertindak langsung dari barisnya.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna membuka Daftar Task. Filter default Aktif (termasuk telat).
2. Sistem menampilkan task aktif berurut tanggal, jam, kesulitan 1 ke 5, lalu abjad nama (tanpa jam dianggap 23.59). Task tanpa deadline paling bawah, diurut kesulitan lalu abjad.
3. Pengguna memilih filter: satu nilai per dimensi, dimensi digabung. Dimensinya projek atau Mandiri, sesi (dengan periodenya), label mandiri, dan status (Aktif, Telat, Selesai, Batal, Di luar periode, Tanpa deadline, atau Semua untuk tanpa filter status).
4. Pengguna dapat mengetik pencarian, yang mencocokkan nama task, nama projek, dan nama label. Pencarian melepas default Aktif, sedangkan status yang dipilih eksplisit tetap berlaku. Hasil berurut aktif, selesai, lalu batal.
5. Sistem menampilkan baris task: nama, chip, deadline, kesulitan, progress, dan tanda.
6. Pengguna bertindak dari baris atau panel samping.

**Alur alternatif:**

- **A1** Task aktif menyediakan aksi tambah ke to-do (UC-28), Selesai dan kontrol progress cepat (UC-23), dan detail. Task selesai atau batal hanya punya aksi detail.
- **A2** Chip projek membuka detail projek (UC-10). Chip label menerapkan filter label dan filter tidak kembali ke Aktif untuk kunjungan itu.
- **A3** Status Telat, Di luar periode, dan Tanpa deadline hanya mencocokkan task aktif. Tanda "di luar periode" pada task selesai tetap tampil di barisnya.
- **A4** Task selesai diurut menurut waktu selesai terbaru dan task batal menurut waktu batal terbaru.
- **A5** Panel samping hanya bisa dibaca untuk task selesai atau batal di projek tertutup atau sesi batal. Task aktif di sesi selesai tetap punya semua aksi.
- **A6** Filter kembali ke Aktif saat halaman dibuka lagi. Offline: data cache tetap terbaca (AU-2).

**Hasil:** Pengguna menemukan task yang dicari dan dapat langsung menindaklanjutinya.

&#91;embedded content: use case diagram · UC-27 Mencari dan memfilter task\]

## 8. To-do harian (UC-28 sampai UC-31)

#### UC-28 Merencanakan task ke to-do

**Aktor:** Pengguna · **FR:** E-01, E-02, E-05, E-08

Pengguna memasukkan task aktif ke to-do pada hari tertentu.

**Prasyarat:** Task berstatus aktif dan hari tujuan adalah hari ini atau mendatang.

**Alur utama:**

1. Pengguna memilih tambah ke to-do pada baris task untuk satu hari, atau membuka panel penyusunan dan memilih banyak task sekaligus.
2. Pengguna memilih hari tujuan.
3. Sistem memeriksa bahwa task itu belum punya entri pada hari tersebut.
4. Sistem membuat satu entri per task per hari.

**Alur alternatif:**

- **A1** Task sudah punya entri pada hari itu: tidak dibuat entri kedua.
- **A2** Hari tujuan setelah deadline task: entri dibuat dan diberi penanda "setelah deadline", tidak ditolak.
- **A3** Hari lewat: entri tidak bisa ditambah atau diubah karena hari lewat membeku. Hari ini bebas diubah.
- **A4** Task kemudian selesai atau batal: entri hari ini tetap tampil, entri mendatang dihapus.
- **A5** Pengguna menghapus entri: tanpa konfirmasi.

**Hasil:** Task muncul sebagai entri di to-do hari tujuan, siap diberi blok jam (UC-29).

&#91;embedded content: use case diagram · UC-28 Merencanakan task ke to-do\]

#### UC-29 Menyusun blok jam

**Aktor:** Pengguna · **FR:** E-03, E-04, F-08

Pengguna menjadwalkan jam kerja sebuah entri lewat satu atau beberapa blok.

**Prasyarat:** Entri to-do ada pada hari ini atau mendatang.

**Alur utama:**

1. Pengguna memilih tambah blok pada sebuah entri, atau menyeret entri ke slot jam di panel penyusunan atau panel hari.
2. Pengguna menentukan jam mulai dan selesai (kelipatan 5 menit, seret ke kelipatan 15 menit).
3. Sistem memvalidasi: blok berada antara 06.00 dan 24.00 dalam satu hari, mulai lebih awal dari selesai, dan tidak bentrok dengan blok lain atau Jadwal.
4. Sistem menyimpan blok. Satu entri boleh punya beberapa blok.

**Alur alternatif:**

- **A1** Blok bentrok dengan blok lain atau Jadwal: ditolak dan pengguna memilih jam lain, AU-5.
- **A2** Blok hari ini di jam yang sudah lewat: diizinkan.
- **A3** Hari lewat: tidak bisa diubah.
- **A4** Jadwal baru atau hasil edit Jadwal menimpa blok yang sudah ada: diizinkan dengan peringatan dan blok ditandai "bentrok", disertai penjelasan dan tautan ke Jadwal penyebabnya (UC-32, UC-33).
- **A5** Pengguna menghapus blok: tanpa konfirmasi.

**Hasil:** Entri punya blok jam yang tampil di grid Kalender dan menjadi pengurang jam kosong (UC-35).

&#91;embedded content: use case diagram · UC-29 Menyusun blok jam\]

#### UC-30 Mengerjakan to-do hari ini

**Aktor:** Pengguna · **FR:** E-06, E-07, E-10, E-11

Pengguna menjalankan rencana harian: melihat entri dan blok, mencentang yang dikerjakan, dan memperbarui progress.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna membuka halaman To-do (hari ini dan mendatang).
2. Sistem menampilkan entri per hari dengan blok jamnya. Blok diredupkan bila jamnya sudah lewat dan entrinya belum dicentang.
3. Pengguna mencentang entri yang dikerjakan, atau mencabut ceklisnya.
4. Pengguna dapat memperbarui progress task (UC-23). Mengubah progress otomatis mencentang entri yang sudah ada.
5. Sistem menghitung status entri dari riwayat dengan prioritas dibatalkan, selesai, dikerjakan, lalu tidak dikerjakan.

**Alur alternatif:**

- **A1** Progress diubah pada task yang tidak punya entri hari itu: tidak membuat entri baru.
- **A2** Task selesai lalu dibuka kembali pada hari yang sama: entri dihitung "dikerjakan".
- **A3** Hari lampau tidak ada di halaman ini. Pengguna melihatnya hanya-baca di Kalender (UC-36).
- **A4** Komponen daftar to-do yang sama dipakai di panel hari Kalender.
- **A5** Offline: hanya baca (AU-2).
- **A6** Ceklis gagal tersimpan: ceklis kembali ke keadaan semula dengan pesan dan tautan Coba lagi (AU-7).

**Hasil:** Status entri hari ini mencerminkan pekerjaan yang dilakukan dan menjadi bahan Dashboard (UC-37, UC-38).

&#91;embedded content: use case diagram · UC-30 Mengerjakan to-do hari ini\]

#### UC-31 Memindahkan task belum selesai ke hari ini

**Aktor:** Pengguna · **FR:** E-09

Pengguna menarik kembali task yang tidak dikerjakan di hari-hari lalu ke rencana hari ini.

**Prasyarat:** Ada task aktif yang entrinya tidak dikerjakan dalam 7 hari terakhir.

**Alur utama:**

1. Pengguna membuka daftar "Belum selesai" di halaman To-do (jumlahnya juga tampil di Dashboard).
2. Sistem menampilkan entri tidak dikerjakan dalam 7 hari terakhir dari task aktif, satu baris per task.
3. Pengguna mengetuk satu baris.
4. Sistem menambahkan task itu ke to-do hari ini tanpa blok jam (UC-28).

**Alur alternatif:**

- **A1** Task sudah punya entri hari ini: tidak tampil di daftar.
- **A2** Task yang sudah selesai atau batal: tidak tampil karena hanya task aktif yang masuk daftar.
- **A3** Tidak ada pemindahan otomatis. Semuanya lewat ketukan pengguna.

**Hasil:** Task muncul sebagai entri hari ini tanpa blok, siap diberi jam lewat UC-29.

&#91;embedded content: use case diagram · UC-31 Memindahkan task belum selesai ke hari ini\]

## 9. Jadwal dan jam kosong (UC-32 sampai UC-35)

#### UC-32 Membuat Jadwal

**Aktor:** Pengguna · **FR:** F-01, F-02, F-05, F-06, F-08, J-03

Pengguna membuat kegiatan tetap (kuliah, rapat, kegiatan rutin) yang mengisi jam di hari-hari tertentu.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Untuk Jadwal sekali jalan, pengguna memilih slot kosong di grid lalu pilihan Jadwal sekali jalan. Untuk Jadwal berulang, pengguna membuatnya di tab Jadwal di dalam Kalender.
2. Pengguna mengisi nama (maks 30 karakter), jam mulai dan selesai, pola, dan periode.
3. Sistem memvalidasi: jam antara 06.00 dan 24.00 dalam kelipatan 5 menit dengan mulai lebih awal dari selesai, pola mingguan (minimal satu hari) atau sekali jalan (tanggal pada atau setelah hari ini), tanggal mulai pada atau setelah hari ini, dan tanggal berakhir opsional.
4. Sistem memeriksa bentrok dan pengecualian, lalu menyimpan Jadwal.

**Alur alternatif:**

- **A1** Bentrok dengan Jadwal lain: pengguna diperingatkan dan Jadwal tetap bisa disimpan.
- **A2** Jadwal menimpa blok to-do yang sudah ada: diizinkan dengan peringatan dan blok ditandai "bentrok".
- **A3** Jadwal baru jatuh dalam rentang pengecualian (UC-34): pengguna diperingatkan.
- **A4** Validasi gagal: AU-5. Pola selain mingguan dan sekali jalan tidak tersedia.
- **A5** Tab Jadwal di dalam Kalender punya sub-tab Aktif (belum berakhir), Berakhir (tanggal berakhir sudah lewat), dan Pengecualian (UC-34).

**Hasil:** Jadwal tersimpan dan mengurangi jam kosong (UC-35) pada hari yang dicakupnya.

&#91;embedded content: use case diagram · UC-32 Membuat Jadwal\]

#### UC-33 Mengubah atau mengakhiri Jadwal

**Aktor:** Pengguna · **FR:** F-03, F-09, I-08

Pengguna mengubah, mengakhiri, atau menghapus Jadwal yang sudah ada.

**Prasyarat:** Jadwal sudah ada.

**Alur utama:**

1. Pengguna memilih sebuah Jadwal dan mengeditnya.
2. Pengguna menentukan perubahan, yang berlaku mulai tanggal pada atau setelah hari ini.
3. Sistem memvalidasi seperti UC-32 dan memeriksa bentrok.
4. Sistem mengakhiri versi lama pada sehari sebelumnya dan menyimpan versi baru (Jadwal berversi). Hari lewat tidak berubah.

**Alur alternatif:**

- **A1** Mengakhiri Jadwal berulang: pengguna memilih Akhiri, mengonfirmasi dialog ringan, dan tanggal berakhir (inklusif) default hari ini.
- **A2** Jadwal yang belum pernah berlaku di hari lewat: diedit langsung dan boleh dihapus permanen dengan konfirmasi ringan.
- **A3** Jadwal yang pernah berlaku: tidak bisa dihapus, hanya diakhiri.
- **A4** Jadwal sekali jalan untuk hari ini atau mendatang: diedit dan dihapus tanpa konfirmasi.
- **A5** "Kembali" atau Esc membatalkan aksi berkonfirmasi (AU-4). Offline: aksi dinonaktifkan (AU-2).

**Hasil:** Jadwal mengikuti perubahan mulai tanggal berlaku, dan riwayat hari lewat tetap utuh.

&#91;embedded content: use case diagram · UC-33 Mengubah atau mengakhiri Jadwal\]

#### UC-34 Mengatur pengecualian Jadwal

**Aktor:** Pengguna · **FR:** F-04, F-06, J-03

Pengguna meniadakan Jadwal pada rentang tanggal tertentu, misalnya libur.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna membuka sub-tab Pengecualian di tab Jadwal pada Kalender dan memilih tambah pengecualian.
2. Pengguna mengisi rentang tanggal (tanggal awal pada atau setelah hari ini) dan memilih Jadwal tertentu atau opsi "semua".
3. Sistem memvalidasi rentang.
4. Sistem menyimpan pengecualian. Jadwal yang tercakup tidak berlaku pada rentang itu.

**Alur alternatif:**

- **A1** Opsi "semua" bersifat dinamis: mencakup juga Jadwal yang dibuat belakangan.
- **A2** Tanggal awal sebelum hari ini atau rentang tidak valid: AU-5.
- **A3** Pengguna menghapus pengecualian: tanpa konfirmasi.
- **A4** Jadwal baru jatuh dalam pengecualian: peringatan tampil saat membuat Jadwal (UC-32).

**Hasil:** Pengecualian tersimpan dan jam kosong pada rentang itu menyesuaikan.

&#91;embedded content: use case diagram · UC-34 Mengatur pengecualian Jadwal\]

#### UC-35 Melihat jam kosong

**Aktor:** Pengguna · **FR:** F-07, G-04

Pengguna melihat jam yang masih bebas untuk ditempati task.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna membuka Kalender (UC-36) atau Dashboard (UC-37).
2. Sistem menghitung jam kosong: 06.00 sampai 24.00 dikurangi gabungan Jadwal aktif dan blok. Blok dari entri selesai atau batal tidak dihitung, dan slot di bawah 30 menit tidak dihitung.
3. Sistem menampilkan total jam kosong di sel Kalender untuk hari ini dan mendatang, dan di Dashboard menampilkan sisa jam kosong dari sekarang sampai 24.00 beserta slot terpanjang.
4. Pengguna membuka panel hari untuk melihat slot kosong di grid 06.00 sampai 24.00.

**Alur alternatif:**

- **A1** Pengguna mengeklik slot kosong di hari ini atau mendatang: sistem menawarkan Jadwal sekali jalan (UC-32) atau Blok (UC-29).
- **A2** Hari lampau: jam kosong tidak ditampilkan.
- **A3** Di Dashboard, slot dipotong di waktu sekarang lebih dulu, lalu yang kurang dari 30 menit dibuang. Ini berbeda dari Kalender yang menghitung seluruh hari.

**Hasil:** Pengguna tahu kapan ada waktu bebas sebelum menyusun to-do.

&#91;embedded content: use case diagram · UC-35 Melihat jam kosong\]

## 10. Kalender dan Dashboard (UC-36 sampai UC-38)

#### UC-36 Melihat Kalender

**Aktor:** Pengguna · **FR:** G-01 sampai G-05, J-03

Pengguna melihat sesi, deadline, rencana harian, dan jam kosong dalam tampilan bulan atau minggu.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna membuka Kalender, yang menampilkan tab terakhir yang dipakai, lalu memilih tab Bulan, Minggu (minggu mulai Senin), atau Jadwal (UC-32 sampai UC-34). Pengguna dapat menggeser periode atau menekan "Hari ini".
2. Sistem menampilkan sel bulan berisi garis sesi (maks 3, sisanya "+N"), jumlah deadline task aktif, dan total jam kosong. Tampilan minggu memakai 7 kolom. Di HP tampil strip hari dan grid satu hari.
3. Garis sesi berwarna projek dengan teks "Projek · Sesi". Warna bukan satu-satunya pembeda projek: tiap projek juga punya pola garis, dan di HP (garis tanpa teks) legenda nama projek tampil di bawah kalender. Blok memakai warna projek, task mandiri tanpa warna, dan Jadwal netral.
4. Pengguna memilih sebuah hari. Sistem membuka panel hari: grid 06.00 sampai 24.00 dengan garis tiap 30 menit, penanda deadline, to-do hari itu, dan daftar task yang belum punya jam.

**Alur alternatif:**

- **A1** Penanda deadline: berjam berupa garis, tanpa jam berupa strip, dan deadline 00.00 sampai 05.55 berupa penanda "Sebelum 06.00".
- **A2** Mengeklik garis sesi membuka detail projek (UC-10). Sesi batal disembunyikan, termasuk dari minggu lampau.
- **A3** Mengeklik slot kosong di hari ini atau mendatang: pilihan Jadwal sekali jalan (UC-32) atau Blok (UC-29).
- **A4** Hari lewat bersifat hanya-baca: status dari riwayat, progress, blok, dan Jadwal versi saat itu. Jumlah deadline dan jam kosong tidak tampil untuk hari lampau, hanya garis sesi. Progress task yang tidak ada di to-do hari itu tidak tampil.
- **A5** Hari ini dan mendatang menampilkan rancangan.
- **A6** Offline: data terakhir yang dimuat tetap terbaca (AU-2).
- **A7** Tab terakhir yang dipakai disimpan di perangkat, bukan di akun (J-03).

**Hasil:** Pengguna melihat beban dan rencana per hari dalam satu tampilan.

&#91;embedded content: use case diagram · UC-36 Melihat Kalender\]

#### UC-37 Melihat Dashboard

**Aktor:** Pengguna · **FR:** D-01 sampai D-03, D-05 sampai D-10

Pengguna melihat ringkasan kondisi kerja saat ini begitu masuk ke aplikasi.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna masuk dan Dashboard terbuka sebagai halaman awal.
2. Bagian Sekarang menampilkan: task telat (maks 5, paling lama telat dulu, lalu kesulitan, lalu abjad, dengan "lihat semua" ke Daftar Task berfilter Telat), task hari ini sampai 7 hari ke depan yang belum telat, ringkasan to-do hari ini (jumlah entri, dikerjakan atau selesai, dan "Belum selesai", dengan tautan ke halaman To-do), serta satu baris jam kosong hari ini (sisa dari sekarang sampai 24.00 dan slot terpanjang).
3. Bagian Projek menampilkan maks 5 projek belum tertutup, berurutan seperti Daftar Projek, dengan "lihat semua". Kartu memuat nama, warna, status, sesi sekarang (atau kapan sesi berikutnya mulai saat jeda), "N dari M task selesai", dan jumlah task telat. Kartu membuka detail projek.
4. Kalender mini menampilkan minggu berjalan dengan garis sesi serta jumlah deadline dan jam kosong per hari. Pengguna dapat menggeser antarminggu atau mengeklik sebuah hari untuk membuka panel hari.
5. Pengguna dapat menekan tombol "Tambah task" (UC-19, UC-20).

**Alur alternatif:**

- **A1** Data belum ada: tiap bagian menampilkan empty state dengan aksi langsung.
- **A2** Task mandiri tanpa deadline tidak tampil di Dashboard, kecuali lewat to-do hari ini.
- **A3** Bagian Pola kerja (UC-38) dimuat setelah bagian lain.
- **A4** Offline: data terakhir yang dimuat tetap terbaca (AU-2).
- **A5** Dashboard dibuka saat data lokal sudah ada tetapi server belum menjawab: data lokal tampil dengan bilah "Menyambungkan…" dan tombol ubah menunggu sambungan (AU-7).

**Hasil:** Pengguna tahu apa yang telat, apa yang perlu dikerjakan hari ini, dan kondisi tiap projek.

&#91;embedded content: use case diagram · UC-37 Melihat Dashboard\]

#### UC-38 Melihat pola kerja

**Aktor:** Pengguna · **FR:** D-11, D-12

Pengguna melihat riwayat produktivitasnya dalam rentang waktu pilihan, tanpa skor atau peringkat.

**Prasyarat:** Pengguna sudah login.

**Alur utama:**

1. Pengguna membuka bagian Pola kerja di Dashboard.
2. Pengguna memilih rentang: Minggu ini, 4 minggu terakhir (default), Bulan ini, 3 bulan terakhir, Tahun ini, Semua, atau rentang kustom. Rentang hanya berlaku untuk bagian ini.
3. Sistem menentukan granularitas grafik otomatis (harian, mingguan, atau bulanan).
4. Sistem menampilkan tiga metrik: task selesai per hari atau minggu, task dibuat, selesai, dan batal per periode, serta entri to-do dikerjakan lawan tidak dikerjakan (hanya hari lewat).

**Alur alternatif:**

- **A1** Hari tanpa data: tampil "tidak ada data".
- **A2** "Selesai" dihitung dari kondisi sekarang: task yang saat ini selesai dengan waktu selesai terakhir di dalam periode. Task yang dibuka kembali tidak dihitung sampai selesai lagi.
- **A3** Rasio entri = (dikerjakan + selesai) dibagi (dikerjakan + selesai + tidak dikerjakan). Entri dibatalkan dan hari ini tidak dihitung.
- **A4** Task yang batal karena cascade (batal projek atau sesi) dihitung sama dengan batal manual.
- **A5** Tidak ada skor, streak, atau peringkat. Distribusi per projek atau label, rata-rata kesulitan, beban ke depan, dan ketepatan deadline tidak termasuk.
- **A6** Bagian ini gagal dimuat padahal bagian lain berhasil: hanya Pola kerja yang menampilkan galat dengan tombol Coba lagi (AU-7).

**Hasil:** Pengguna melihat tren kerjanya untuk rentang yang dipilih.

&#91;embedded content: use case diagram · UC-38 Melihat pola kerja\]

## 11. Detail task (UC-39)

#### UC-39 Melihat detail task

**Aktor:** Pengguna · **FR:** H-06, C-08, E-12, J-04, J-06

Pengguna membuka panel detail sebuah task untuk melihat riwayat progress dan hari-hari yang sudah direncanakan, lalu bertindak dari panel itu.

**Prasyarat:** Pengguna sudah login dan task ada.

**Alur utama:**

1. Pengguna memilih aksi detail pada baris task di Daftar Task, atau pada task di panel hari Kalender.
2. Sistem membuka panel detail task: panel samping di laptop, layar penuh di HP. Alamat halaman ikut mencerminkan panel yang terbuka (J-04).
3. Sistem menampilkan riwayat progress (terbaru dulu; tiap baris berisi tanggal dan jam, nilai sebelum dan sesudah, deskripsi, serta penanda Selesai atau Buka kembali; tidak bisa diedit) dan daftar hari terencana yang hanya bisa dibaca (C-08, E-12).
4. Pengguna dapat memilih sebuah hari di daftar itu untuk menuju halaman To-do atau Kalender pada hari tersebut.
5. Pengguna menutup panel lewat tombol tutup atau Esc.

**Alur alternatif:**

- **A1** Task aktif: panel menyediakan aksi sesuai status task, yaitu mengubah (UC-21), memindahkan (UC-22), memperbarui progress (UC-23), dan membatalkan (UC-25). Ini juga berlaku untuk task aktif di sesi selesai.
- **A2** Task selesai atau batal di projek tertutup atau sesi batal: panel hanya-baca dan hanya menyediakan aksi yang sesuai status (H-06).
- **A3** Panel dibuka dari panel hari Kalender: panel tidak menumpuk. Isi panel hari diganti oleh detail task dan tersedia tombol "Kembali ke hari" (J-06).
- **A4** Tombol kembali menutup panel dan tidak meninggalkan halaman (J-04).
- **A5** Alamat panel dibuka tanpa login: pengguna masuk dulu, lalu panel yang terbuka dikembalikan (U-12).
- **A6** Offline: data terakhir yang dimuat tetap terbaca (AU-2).
- **A7** Task yang dibuka lewat alamat panel sudah tidak ada atau sudah dihapus: panel menampilkan "Task tidak ditemukan" dengan tombol Tutup panel (AU-7).

**Hasil:** Pengguna melihat riwayat progress dan hari terencana sebuah task tanpa meninggalkan halaman asalnya.
