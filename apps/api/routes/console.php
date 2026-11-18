<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

// DP-7: tombstone lebih tua dari 90 hari dipangkas. Akun mencatat revisi tertinggi yang dipangkas
// agar klien dengan kursor lebih tua menerima sinkron penuh, bukan delta yang bolong.
Artisan::command('penghapusan:pangkas {--hari=90}', function () {
    $hari = (int) $this->option('hari');
    $jumlah = DB::affectingStatement(<<<'SQL'
        WITH dihapus AS (
            DELETE FROM penghapusan WHERE dibuat_pada < ? RETURNING akun_id, revisi
        )
        UPDATE akun a
        SET penghapusan_dipangkas_hingga = GREATEST(a.penghapusan_dipangkas_hingga, d.maks)
        FROM (SELECT akun_id, max(revisi) AS maks FROM dihapus GROUP BY akun_id) d
        WHERE a.id = d.akun_id
    SQL, [Date::now()->subDays($hari)]);
    $this->info("Tombstone dipangkas untuk {$jumlah} akun.");
})->purpose('Pangkas tombstone sinkron yang lebih tua dari N hari');

Schedule::command('penghapusan:pangkas')->daily();
