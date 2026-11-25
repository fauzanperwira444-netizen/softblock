# Softblock

Aplikasi web perencana kerja pribadi. Dokumen desain ada di [`Dokumen/`](Dokumen/), mockup layar di [`mockup/`](mockup/).

## Struktur

| Folder | Isi |
| --- | --- |
| `apps/web` | SPA React + TypeScript + Vite + Tailwind (PWA) |
| `apps/api` | Laravel 13, API JSON dan penyaji SPA |
| `fixtures` | Golden fixtures aturan domain, dibaca PHP dan TypeScript |
| `docker` | Konfigurasi lingkungan lokal |

## Prasyarat

- Node LTS (24 atau 26) dan pnpm
- PHP 8.4 dengan ekstensi `pdo_pgsql`, `intl`, `sodium`, `mbstring`, `openssl`
- Composer 2
- PostgreSQL 18 (lewat `docker compose up -d db` atau terpasang langsung)

## Menyiapkan database lokal

PostgreSQL 18 berjalan di port 5432 dengan role `softblock` (password `softblock`, khusus lokal), database `softblock` dan `softblock_test`, keduanya dengan ekstensi `btree_gist`. Alternatif dengan Docker: `docker compose up -d db`.

## Menjalankan API

```bash
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Seeder membuat dua akun contoh, `dina@contoh.test` dan `raka@contoh.test`, dengan password `rahasia-123`.

Pastikan `php` di PATH adalah PHP 8.4. XAMPP sering membawa versi lama yang mendahului di PATH.

## Menjalankan frontend

```bash
pnpm install
pnpm dev:web
```

Vite berjalan di http://localhost:5173 dan meneruskan `/api`, `/auth`, dan `/sanctum` ke Laravel di port 8000.

Saat dev, frontend memakai API tiruan (msw). Untuk memakai API Laravel, jalankan dengan `VITE_API_MOCK=off`. Build produksi selalu memakai API asli.

## Pemeriksaan

```bash
pnpm typecheck:web
pnpm test:web
pnpm lint:web
pnpm build:web
pnpm test:api
pnpm analyse:api
```

`test:api` memakai database `softblock_test`.

Setelah mengubah rute atau respons API, perbarui kontraknya: `cd apps/api && php artisan scramble:export --path=openapi.json`, lalu commit `apps/api/openapi.json`. CI gagal bila berkas itu tidak sesuai kode.

## CI

`.github/workflows/ci.yml` berjalan di setiap PR dan push ke `main`: pemeriksaan web (tsc, oxlint, Vitest, build, audit, Playwright dengan msw), pemeriksaan API (PHPStan, Pest dengan PostgreSQL 18, `composer audit`, drift OpenAPI), dan gitleaks. Setelah semuanya lolos, image dibangun dan diuji (migrasi, `/api/kesehatan/siap`, build sama dengan SHA, SPA tersaji). Dari `main`, image didorong ke `ghcr.io/<owner>/softblock` dengan tag SHA dan `main`.

Penyiapan akun produksi (Neon, Resend, SnapDeploy, secret GitHub) ada di [`Dokumen/panduan-penyiapan-produksi.md`](Dokumen/panduan-penyiapan-produksi.md).

## Image produksi

```bash
docker build --build-arg BUILD_SHA=$(git rev-parse --short HEAD) -t softblock .
```

Satu image berisi SPA, Laravel, php-fpm, dan nginx (DP-2), mendengarkan di `$PORT` (bawaan 8080). Variabel wajib saat jalan: `APP_KEY`, `APP_URL`, `DB_*`, `MAIL_*`. Migrasi tidak dijalankan saat start; jalankan `php artisan migrate --force` dari job Deploy (DP-4).
