-- Role produksi dengan hak minimum (DP-4, DP-6). Panduan: Dokumen/panduan-penyiapan-produksi.md, langkah 1.
-- Jalankan sekali sebagai neondb_owner di SQL Editor Neon, SEBELUM migrasi pertama.
-- Ganti dua placeholder password. Jangan commit password asli.
--
--   neondb_owner  pemilik skema; dipakai job Deploy untuk migrasi lewat koneksi langsung
--   app_runtime   dipakai aplikasi di SnapDeploy lewat endpoint pooled; baca-tulis data, tanpa DDL
--   app_backup    dipakai job backup; baca saja

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE ROLE app_runtime LOGIN PASSWORD 'GANTI_PASSWORD_RUNTIME';
CREATE ROLE app_backup LOGIN PASSWORD 'GANTI_PASSWORD_BACKUP';

GRANT CONNECT ON DATABASE neondb TO app_runtime, app_backup;
GRANT USAGE ON SCHEMA public TO app_runtime, app_backup;

-- Objek yang sudah ada (kalau script ini dijalankan setelah migrasi).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO app_backup;

-- Objek yang nanti dibuat migrasi oleh neondb_owner.
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT SELECT ON TABLES TO app_backup;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT SELECT ON SEQUENCES TO app_backup;
