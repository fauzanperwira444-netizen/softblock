# Panduan Penyiapan Produksi: Neon, Resend, SnapDeploy, dan GitHub

Nov 23, 2026

Panduan ini menyiapkan akun dan secret yang dibutuhkan sebelum workflow Deploy (Arsitektur Sistem DP-1 sampai DP-6) bisa berjalan. Semua langkah dikerjakan manual lewat browser dan terminal laptop. Kerjakan berurutan, karena beberapa langkah memakai hasil langkah sebelumnya. Perkiraan waktunya 60 sampai 90 menit.

Hosting memakai SnapDeploy, menggantikan Render pada DP-1. SnapDeploy membangun image sendiri dari `Dockerfile` di branch `produksi`. Branch ini hanya maju setelah kamu menyetujui deploy, jadi push ke `main` tidak langsung tayang.

## 0. Sebelum mulai

- [ ] Siapkan pengelola password, misalnya Bitwarden atau 1Password, dan buat satu catatan "Softblock produksi". **Semua nilai rahasia di panduan ini disimpan di sana.** Jangan ditempel ke chat, issue, commit, atau file di repo.
- [ ] Buat `APP_KEY` di laptop dari root repo, lalu simpan hasilnya (diawali `base64:`). Perintah `php` biasa di laptop ini mengarah ke PHP 8.2 dari XAMPP, padahal proyek butuh 8.4, jadi pakai path lengkapnya:

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" apps/api/artisan key:generate --show
```

Nilai yang terkumpul sampai akhir panduan:

| Nama | Dipakai di | Rahasia |
| --- | --- | --- |
| `APP_KEY` | SnapDeploy | ya |
| Password `app_runtime` | SnapDeploy | ya |
| Password `app_backup` | GitHub | ya |
| Connection string Neon (pooled dan direct) | SnapDeploy, GitHub | ya |
| API key Resend | SnapDeploy | ya |
| Token API SnapDeploy (`sd_pat_...`) | GitHub | ya |
| Kunci privat age | hanya pengelola password | ya |
| Kunci publik age | GitHub | tidak |
| PAT repo backup | GitHub | ya |

## 1. Neon (PostgreSQL 18)

1. [ ] Daftar di [neon.tech](https://neon.tech).
2. [ ] **New Project**: nama `softblock`, versi Postgres **18**, region **AWS Asia Pacific (Singapore)**. SnapDeploy tidak menyebutkan lokasi servernya, jadi waktu respons perlu dicek setelah deploy (langkah 8). Nama database biarkan `neondb`.
3. [ ] Buka **Connect** di dashboard project, lalu catat dua connection string untuk role `neondb_owner`:
   - **Pooled connection** aktif: host-nya mengandung `-pooler`, contoh `ep-xxx-pooler.ap-southeast-1.aws.neon.tech`.
   - **Pooled connection** nonaktif (direct): host tanpa `-pooler`.
4. [ ] Buat dua password acak, satu untuk `app_runtime` dan satu untuk `app_backup`. Pakai generator di pengelola password (32 karakter, huruf dan angka saja supaya aman dipakai di URL), atau di PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

5. [ ] Buka **SQL Editor** di Neon. Tempel seluruh isi [`docker/neon-roles.sql`](../docker/neon-roles.sql), ganti `GANTI_PASSWORD_RUNTIME` dan `GANTI_PASSWORD_BACKUP` dengan password dari langkah 4, lalu **Run**. Jangan simpan versi yang sudah berisi password ke repo.
6. [ ] Jalankan migrasi pertama dari laptop memakai koneksi **direct** milik `neondb_owner`. Jangan jalankan seeder di produksi.

```powershell
$php = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
$env:DB_CONNECTION = "pgsql"
$env:DB_URL = "postgresql://neondb_owner:<password>@<host-direct>/neondb?sslmode=require"
& $php apps/api/artisan migrate --force
Remove-Item Env:DB_URL, Env:DB_CONNECTION
```

7. [ ] Cek di SQL Editor bahwa hak `app_runtime` sudah berlaku pada tabel hasil migrasi. Hasil yang diharapkan `t | f`, artinya boleh menulis data tapi tidak boleh membuat tabel:

```sql
SELECT has_table_privilege('app_runtime', 'akun', 'INSERT'),
       has_schema_privilege('app_runtime', 'public', 'CREATE');
```

Hasil yang dicatat:

| Kegunaan | Host | User | Disimpan sebagai |
| --- | --- | --- | --- |
| Aplikasi (SnapDeploy) | pooled | `app_runtime` | env `DB_*` di SnapDeploy |
| Migrasi (GitHub) | direct | `neondb_owner` | `DATABASE_URL_MIGRASI` |
| Backup (GitHub) | direct | `app_backup` | `DATABASE_URL_BACKUP` |

Format URL: `postgresql://<user>:<password>@<host>/neondb?sslmode=require`.

## 2. Resend (email)

1. [ ] Daftar di [resend.com](https://resend.com).
2. [ ] Tentukan alamat pengirim:
   - **Punya domain**: **Domains → Add Domain**, tambahkan record DNS yang diminta (SPF, DKIM) di penyedia domain, lalu tunggu sampai status **Verified**. Pengirimnya `no-reply@<domain>`.
   - **Belum punya domain**: pakai `onboarding@resend.dev`. Batasannya, email hanya bisa dikirim ke alamat pemilik akun Resend. Cukup untuk uji reset password, tapi pengguna lain tidak akan menerima email.
3. [ ] **API Keys → Create API Key** dengan izin **Sending access**. Salin nilainya (diawali `re_`) karena hanya tampil sekali.

Nilai env untuk SnapDeploy:

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_SCHEME=smtps
MAIL_USERNAME=resend
MAIL_PASSWORD=<API key re_...>
MAIL_FROM_ADDRESS=<alamat pengirim>
MAIL_FROM_NAME=Softblock
```

## 3. Branch `produksi`

SnapDeploy men-deploy ulang setiap ada push ke branch yang ditautkan dan mengabaikan branch lain. Karena itu ia ditautkan ke `produksi`, bukan `main`.

1. [ ] Buat branch dari `main` yang sudah hijau di CI:

```powershell
git push origin main:refs/heads/produksi
```

2. [ ] Repo `softblock` → **Settings → Branches → Add branch ruleset**: target `produksi`, aktifkan **Restrict deletions** dan **Block force pushes**.

## 4. SnapDeploy (web service)

1. [ ] Daftar di [snapdeploy.dev](https://snapdeploy.dev) dengan akun GitHub. Paket gratis tidak butuh kartu.
2. [ ] Buat container baru dari **GitHub repository**: pilih `softblock`, branch **`produksi`**, nama `softblock`, ukuran **Small**. Pastikan SnapDeploy memakai `Dockerfile` di root dan port **8080**.
3. [ ] Sebelum deploy, isi **Environment Variables**:

```
APP_KEY=<dari langkah 0>
APP_URL=<URL di "Your app will be live at", contoh https://softblock-44f82.containers.snapdeploy.app>
APP_LOCALE=id
DB_HOST=<host pooled>
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=app_runtime
DB_PASSWORD=<password app_runtime>
DB_SSLMODE=require
```

   Tambahkan juga semua baris `MAIL_*` dari langkah 2.

   - `APP_URL` harus sama persis dengan URL container, memakai `https`, tanpa garis miring di akhir. Sanctum dan cookie sesi bergantung pada nilai ini.
   - **Jangan** isi `PORT` (dikelola SnapDeploy), `APP_ENV`, `APP_DEBUG`, `APP_BUILD`, `DB_CONNECTION`, `LOG_CHANNEL`, `SESSION_*`, atau `TRUSTED_PROXIES`.
4. [ ] Jalankan deploy dan tunggu sampai berjalan. Build gagal tetap memakai jatah deploy (5 per 12 jam), dan container yang gagal deploy bisa hilang dari daftar sehingga env harus diisi ulang. Simpan blok env di atas, dengan nilainya, di catatan pengelola password supaya tinggal ditempel.
5. [ ] Buka `https://<url>/api/kesehatan/siap` di browser. Respons yang diharapkan berbentuk `{"status":"siap","build":"dev"}`. Nilai `dev` masih wajar di tahap ini, dan akan diganti SHA saat workflow Deploy dibuat.
6. [ ] Buat token di pengaturan API SnapDeploy dengan scope **deploy**, masa berlaku 365 hari (catat di kalender). Salin nilainya (`sd_pat_...`).
7. [ ] Catat **container ID** dari halaman container atau URL dashboard.

## 5. Kunci enkripsi backup (age)

Backup harian dienkripsi dengan [age](https://age-encryption.org) sebelum disimpan (DP-6).

1. [ ] Pasang age:

```powershell
winget install FiloSottile.age
```

2. [ ] Buka terminal baru, lalu buat kunci:

```powershell
age-keygen -o softblock-backup.key
```

3. [ ] Simpan **seluruh isi** `softblock-backup.key` di pengelola password. Tanpa kunci privat ini backup **tidak bisa dipulihkan**.
4. [ ] Salin kunci publiknya (baris `# public key: age1...`, ambil bagian `age1...` saja).
5. [ ] Hapus file kunci dari laptop:

```powershell
Remove-Item softblock-backup.key
```

## 6. Repo penyimpanan backup

1. [ ] Buat repo baru **privat** `softblock-backup`, dengan centang "Add a README".
2. [ ] GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**:
   - nama `softblock-backup`, masa berlaku 1 tahun (catat di kalender)
   - **Repository access**: Only select repositories → `softblock-backup`
   - **Permissions → Contents**: Read and write
3. [ ] Salin tokennya (diawali `github_pat_`).

## 7. GitHub: environment `production` dan secret

1. [ ] Repo `softblock` → **Settings → Environments → New environment**, nama `production`.
2. [ ] Centang **Required reviewers** dan pilih akunmu sendiri. Dengan ini, setiap deploy menunggu persetujuanmu (DP-5).
3. [ ] **Deployment branches and tags** → Selected branches → tambahkan `main`.
4. [ ] Tambahkan **Environment secrets**:

| Secret | Isi |
| --- | --- |
| `DATABASE_URL_MIGRASI` | URL direct `neondb_owner` dengan `?sslmode=require` |
| `DATABASE_URL_BACKUP` | URL direct `app_backup` dengan `?sslmode=require` |
| `SNAPDEPLOY_TOKEN` | Token dari langkah 4.6 |
| `SNAPDEPLOY_CONTAINER_ID` | ID dari langkah 4.7 |
| `APP_URL` | URL publik container |
| `AGE_PUBLIC_KEY` | `age1...` dari langkah 5.4 |
| `BACKUP_REPO_TOKEN` | PAT dari langkah 6.3 |

5. [ ] Tambahkan **Environment variables** (bukan secret): `BACKUP_REPO` = `fauzanperwira444-netizen/softblock-backup`.

## 8. Checklist selesai

- [ ] `https://<url>/api/kesehatan/siap` mengembalikan `"status":"siap"`
- [ ] Setelah login, cookie sesi tersimpan dan reload tidak mengembalikan ke halaman masuk (ini membuktikan proxy SnapDeploy meneruskan HTTPS dengan benar)
- [ ] Aplikasi terasa cukup cepat dengan database di Singapura
- [ ] Setelah container tidur, membuka URL menampilkan halaman bangun lalu aplikasi kembali normal
- [ ] Mendaftar akun baru di URL SnapDeploy berhasil, lalu masuk ke Dashboard
- [ ] "Lupa password" mengirim email yang sampai ke kotak masuk (atau ke alamat pemilik akun Resend kalau memakai `onboarding@resend.dev`)
- [ ] Data tetap ada setelah reload dan setelah login ulang
- [ ] Tujuh secret dan satu variable di langkah 7 sudah terisi
- [ ] Workflow Deploy, backup, dan perawatan siap ditulis (Tahap 3 dan 5)

## Catatan

- **Server tidur.** Container gratis tidur setelah sekitar 15 menit tanpa trafik. Yang membangunkannya adalah kunjungan browser, sekitar 60 detik. Monitor, cron, dan CI hanya menerima 503, jadi workflow Deploy harus memakai API `wake`.
- **Batas paket gratis.** 512 MB RAM, 0,25 vCPU, 100 jam container per bulan (waktu tidur tidak dihitung), 10 deploy per hari, dan 100 permintaan per menit per IP. Tidak ada disk permanen, jadi semua data harus di Neon.
- **Hari demo atau penjurian.** Sprint Pack ($1 untuk 24 jam) atau Always-On Small ($12 per bulan) membuat container tidak tidur.
- **Deploy-on-push berhenti** kalau kamu tidak login ke SnapDeploy selama 15 hari. Login dulu sebelum deploy setelah lama tidak aktif.
- **Kuota** (DP-1, DP-10). Cek mingguan: storage Neon di bawah 70%, CU-jam di bawah 80 dari 100, email Resend di bawah 70 per hari, dan sisa jam container SnapDeploy.
- **Rotasi token.** Token SnapDeploy dan PAT `softblock-backup` kedaluwarsa dalam 1 tahun. Ganti sebelum tanggalnya, lalu perbarui secret GitHub.
- **IP klien** (DP-9). Image sekarang memakai `TRUSTED_PROXIES=*`. Setelah deploy pertama, header proxy SnapDeploy perlu diuji dan konfigurasinya dipersempit. Langkah ini dikerjakan bersama workflow Deploy.
- **Kalau ada rahasia yang bocor**, segera rotasi: password role lewat `ALTER ROLE ... PASSWORD` di Neon, API key Resend, token SnapDeploy, PAT di GitHub, dan `APP_KEY` dengan memindahkan nilai lama ke `APP_PREVIOUS_KEYS`.
