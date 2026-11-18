<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Akun, token reset, dan sesi (Arsitektur Sistem 6.2, S-1, S-2). revisi = kunci, versi, dan kursor sinkron (AD-3).
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');

        DB::statement(<<<'SQL'
            CREATE TABLE akun (
                id uuid PRIMARY KEY DEFAULT uuidv7(),
                email varchar(254) NOT NULL,
                password varchar(255) NULL,
                nama_tampil varchar(45) NOT NULL,
                zona_waktu varchar(64) NOT NULL DEFAULT 'Asia/Jakarta',
                google_id varchar(255) NULL UNIQUE,
                revisi bigint NOT NULL DEFAULT 1,
                -- Tombstone dengan revisi <= nilai ini sudah dipangkas; klien yang lebih tua wajib sinkron penuh.
                penghapusan_dipangkas_hingga bigint NOT NULL DEFAULT 0,
                hari_ini_terakhir date NULL,
                created_at timestamptz NULL,
                updated_at timestamptz NULL
            )
        SQL);
        DB::statement('CREATE UNIQUE INDEX akun_email_unik ON akun (lower(email))');

        // Satu token aktif per akun; yang disimpan hanya hash SHA-256 (N-73).
        DB::statement(<<<'SQL'
            CREATE TABLE password_reset_tokens (
                akun_id uuid PRIMARY KEY REFERENCES akun (id) ON DELETE CASCADE,
                token char(64) NOT NULL UNIQUE,
                created_at timestamptz NOT NULL
            )
        SQL);

        // Bentuk tabel bawaan DatabaseSessionHandler; user_id berisi id akun (uuid).
        DB::statement(<<<'SQL'
            CREATE TABLE sessions (
                id varchar(255) PRIMARY KEY,
                user_id uuid NULL,
                ip_address varchar(45) NULL,
                user_agent text NULL,
                payload text NOT NULL,
                last_activity integer NOT NULL
            )
        SQL);
        DB::statement('CREATE INDEX sessions_user_id_index ON sessions (user_id)');
        DB::statement('CREATE INDEX sessions_last_activity_index ON sessions (last_activity)');
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS sessions');
        DB::statement('DROP TABLE IF EXISTS password_reset_tokens');
        DB::statement('DROP TABLE IF EXISTS akun');
    }
};
