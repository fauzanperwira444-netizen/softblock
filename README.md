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
php artisan migrate
php artisan serve
```

Pemeriksaan: `composer test` (Pest, memakai `softblock_test`) dan `composer analyse` (Larastan).

## Menjalankan frontend

```bash
pnpm install
pnpm dev:web
```

Vite berjalan di http://localhost:5173 dan meneruskan `/api`, `/auth`, dan `/sanctum` ke Laravel di port 8000.

## Pemeriksaan

```bash
pnpm typecheck:web
pnpm test:web
pnpm lint:web
pnpm build:web
```
