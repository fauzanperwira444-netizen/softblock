<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/*
 * Tabel data (Arsitektur Sistem 6.2, 6.3; DA-1..DA-6).
 * - Setiap baris membawa akun_id dan versi (= revisi akun saat terakhir ditulis).
 * - FK anak komposit (akun_id, id) agar baris tidak bisa menunjuk data akun lain; semua RESTRICT.
 * - Tanggal = date, jam = menit smallint 0..1440.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach ($this->ddl() as $sql) {
            DB::statement($sql);
        }
    }

    public function down(): void
    {
        foreach (['penghapusan', 'pengecualian', 'jadwal_versi', 'jadwal', 'blok_jam', 'entri_todo', 'riwayat_progress', 'task', 'label_mandiri', 'sesi', 'dokumen', 'projek'] as $tabel) {
            DB::statement("DROP TABLE IF EXISTS {$tabel}");
        }
        DB::statement('DROP FUNCTION IF EXISTS tolak_ubah_riwayat()');
    }

    /** @return list<string> */
    private function ddl(): array
    {
        $dasar = 'id uuid PRIMARY KEY DEFAULT uuidv7(), akun_id uuid NOT NULL REFERENCES akun (id), versi bigint NOT NULL';

        return [
            "CREATE TABLE projek (
                {$dasar},
                nama varchar(45) NOT NULL,
                deskripsi varchar(500) NOT NULL DEFAULT '',
                warna char(7) NOT NULL,
                batal boolean NOT NULL DEFAULT false,
                UNIQUE (akun_id, id)
            )",
            'CREATE UNIQUE INDEX projek_nama_unik ON projek (akun_id, lower(nama))',

            "CREATE TABLE dokumen (
                {$dasar},
                projek_id uuid NOT NULL,
                nama varchar(100) NOT NULL,
                url varchar(2048) NOT NULL,
                FOREIGN KEY (akun_id, projek_id) REFERENCES projek (akun_id, id)
            )",
            'CREATE INDEX dokumen_projek_index ON dokumen (projek_id)',

            // B-03: sesi non-batal dalam satu projek tidak bertumpuk (tanggal inklusif).
            "CREATE TABLE sesi (
                {$dasar},
                projek_id uuid NOT NULL,
                nama varchar(45) NOT NULL,
                deskripsi varchar(500) NOT NULL DEFAULT '',
                mulai date NOT NULL,
                akhir date NOT NULL,
                batal boolean NOT NULL DEFAULT false,
                UNIQUE (akun_id, id),
                FOREIGN KEY (akun_id, projek_id) REFERENCES projek (akun_id, id),
                CHECK (akhir >= mulai),
                CONSTRAINT sesi_tidak_bertumpuk EXCLUDE USING gist (projek_id WITH =, daterange(mulai, akhir, '[]') WITH &&) WHERE (NOT batal)
            )",
            'CREATE UNIQUE INDEX sesi_nama_unik ON sesi (projek_id, lower(nama)) WHERE NOT batal',

            "CREATE TABLE label_mandiri (
                {$dasar},
                nama varchar(30) NOT NULL,
                terakhir_dipakai timestamptz NULL,
                UNIQUE (akun_id, id)
            )",
            'CREATE UNIQUE INDEX label_nama_unik ON label_mandiri (akun_id, lower(nama))',

            "CREATE TABLE task (
                {$dasar},
                sesi_id uuid NULL,
                label_id uuid NULL,
                nama varchar(30) NOT NULL,
                deskripsi varchar(1000) NOT NULL DEFAULT '',
                deadline_tanggal date NULL,
                deadline_menit smallint NULL,
                kesulitan smallint NOT NULL,
                progress smallint NOT NULL DEFAULT 0,
                batal boolean NOT NULL DEFAULT false,
                dibatalkan_pada timestamptz NULL,
                dibatalkan_tanggal_lokal date NULL,
                dibatalkan_menit_lokal smallint NULL,
                dibuat_tanggal_lokal date NOT NULL,
                UNIQUE (akun_id, id),
                FOREIGN KEY (akun_id, sesi_id) REFERENCES sesi (akun_id, id),
                FOREIGN KEY (akun_id, label_id) REFERENCES label_mandiri (akun_id, id),
                CHECK ((sesi_id IS NULL) <> (label_id IS NULL)),
                CHECK (sesi_id IS NULL OR deadline_tanggal IS NOT NULL),
                CHECK (deadline_menit IS NULL OR (deadline_tanggal IS NOT NULL AND deadline_menit BETWEEN 0 AND 1440)),
                CHECK (kesulitan BETWEEN 1 AND 5),
                CHECK (progress BETWEEN 0 AND 10)
            )",
            'CREATE INDEX task_sesi_index ON task (sesi_id)',
            'CREATE INDEX task_label_index ON task (label_id)',

            // DA-6: riwayat hanya bertambah; trigger menolak UPDATE dan DELETE.
            "CREATE TABLE riwayat_progress (
                {$dasar},
                task_id uuid NOT NULL,
                sebelum smallint NOT NULL,
                sesudah smallint NOT NULL,
                deskripsi varchar(500) NOT NULL DEFAULT '',
                penanda varchar(12) NULL,
                tanggal_lokal date NOT NULL,
                menit_lokal smallint NOT NULL,
                FOREIGN KEY (akun_id, task_id) REFERENCES task (akun_id, id),
                CHECK (sebelum BETWEEN 0 AND 10 AND sesudah BETWEEN 0 AND 10),
                CHECK (penanda IS NULL OR penanda IN ('selesai', 'buka_kembali')),
                CHECK (menit_lokal BETWEEN 0 AND 1440)
            )",
            'CREATE INDEX riwayat_task_index ON riwayat_progress (task_id)',
            "CREATE OR REPLACE FUNCTION tolak_ubah_riwayat() RETURNS trigger LANGUAGE plpgsql AS \$\$
                BEGIN
                    RAISE EXCEPTION 'riwayat_progress hanya boleh ditambah (DA-6)';
                END
            \$\$",
            'CREATE TRIGGER riwayat_append_only BEFORE UPDATE OR DELETE ON riwayat_progress FOR EACH ROW EXECUTE FUNCTION tolak_ubah_riwayat()',

            // DA-1: id entri boleh dibuat klien (idempoten).
            "CREATE TABLE entri_todo (
                {$dasar},
                task_id uuid NOT NULL,
                tanggal date NOT NULL,
                ceklis boolean NOT NULL DEFAULT false,
                UNIQUE (akun_id, id, tanggal),
                UNIQUE (task_id, tanggal),
                FOREIGN KEY (akun_id, task_id) REFERENCES task (akun_id, id)
            )",

            // E-04: blok satu akun pada satu tanggal tidak bertumpuk, rentang [mulai, selesai).
            "CREATE TABLE blok_jam (
                {$dasar},
                entri_id uuid NOT NULL,
                tanggal date NOT NULL,
                mulai_menit smallint NOT NULL,
                selesai_menit smallint NOT NULL,
                FOREIGN KEY (akun_id, entri_id, tanggal) REFERENCES entri_todo (akun_id, id, tanggal),
                CHECK (mulai_menit >= 0 AND mulai_menit < selesai_menit AND selesai_menit <= 1440),
                CONSTRAINT blok_tidak_bertumpuk EXCLUDE USING gist (akun_id WITH =, tanggal WITH =, int4range(mulai_menit, selesai_menit) WITH &&)
            )",
            'CREATE INDEX blok_entri_index ON blok_jam (entri_id)',

            "CREATE TABLE jadwal (
                {$dasar},
                nama varchar(30) NOT NULL,
                UNIQUE (akun_id, id)
            )",

            // F-03: versi satu Jadwal tidak bertumpuk masa berlakunya (berlaku_akhir NULL = terbuka).
            "CREATE TABLE jadwal_versi (
                {$dasar},
                jadwal_id uuid NOT NULL,
                hari smallint[] NOT NULL DEFAULT '{}',
                mulai_menit smallint NOT NULL,
                selesai_menit smallint NOT NULL,
                berlaku_mulai date NOT NULL,
                berlaku_akhir date NULL,
                sekali_jalan boolean NOT NULL DEFAULT false,
                FOREIGN KEY (akun_id, jadwal_id) REFERENCES jadwal (akun_id, id),
                CHECK (mulai_menit >= 0 AND mulai_menit < selesai_menit AND selesai_menit <= 1440),
                CHECK (berlaku_akhir IS NULL OR berlaku_akhir >= berlaku_mulai),
                CONSTRAINT versi_tidak_bertumpuk EXCLUDE USING gist (jadwal_id WITH =, daterange(berlaku_mulai, berlaku_akhir, '[]') WITH &&)
            )",
            'CREATE INDEX versi_jadwal_index ON jadwal_versi (jadwal_id)',

            "CREATE TABLE pengecualian (
                {$dasar},
                jadwal_id uuid NULL,
                mulai date NOT NULL,
                akhir date NOT NULL,
                keterangan varchar(100) NOT NULL DEFAULT '',
                FOREIGN KEY (akun_id, jadwal_id) REFERENCES jadwal (akun_id, id),
                CHECK (akhir >= mulai)
            )",

            // Tombstone untuk sinkron delta; dipangkas setelah 90 hari (DP-7).
            'CREATE TABLE penghapusan (
                id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                akun_id uuid NOT NULL REFERENCES akun (id),
                tabel varchar(20) NOT NULL,
                baris_id uuid NOT NULL,
                revisi bigint NOT NULL,
                dibuat_pada timestamptz NOT NULL DEFAULT now()
            )',
            'CREATE INDEX penghapusan_revisi_index ON penghapusan (akun_id, revisi)',

            // Sinkron delta membaca baris per akun dengan versi > sejak.
            ...array_map(
                fn (string $t): string => "CREATE INDEX {$t}_versi_index ON {$t} (akun_id, versi)",
                ['projek', 'dokumen', 'sesi', 'label_mandiri', 'task', 'riwayat_progress', 'entri_todo', 'blok_jam', 'jadwal', 'jadwal_versi', 'pengecualian'],
            ),
        ];
    }
};
