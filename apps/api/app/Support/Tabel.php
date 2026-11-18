<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\BlokJam;
use App\Models\Dokumen;
use App\Models\EntriTodo;
use App\Models\Jadwal;
use App\Models\JadwalVersi;
use App\Models\LabelMandiri;
use App\Models\ModelAkun;
use App\Models\Pengecualian;
use App\Models\Projek;
use App\Models\RiwayatProgress;
use App\Models\Sesi;
use App\Models\Task;

/** Daftar tabel kontrak sinkron, urutan sama dengan NAMA_TABEL di klien (tipe.ts). */
final class Tabel
{
    /** @var array<string, class-string<ModelAkun>> */
    public const MODEL = [
        'projek' => Projek::class,
        'dokumen' => Dokumen::class,
        'sesi' => Sesi::class,
        'label_mandiri' => LabelMandiri::class,
        'task' => Task::class,
        'riwayat_progress' => RiwayatProgress::class,
        'entri_todo' => EntriTodo::class,
        'blok_jam' => BlokJam::class,
        'jadwal' => Jadwal::class,
        'jadwal_versi' => JadwalVersi::class,
        'pengecualian' => Pengecualian::class,
    ];
}
