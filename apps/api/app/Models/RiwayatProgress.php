<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string $task_id
 * @property int $sebelum
 * @property int $sesudah
 * @property string $deskripsi
 * @property string|null $penanda
 * @property Carbon $tanggal_lokal
 * @property int $menit_lokal
 */
final class RiwayatProgress extends ModelAkun
{
    public const TABEL = 'riwayat_progress';

    protected $table = 'riwayat_progress';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'sebelum' => 'integer',
            'sesudah' => 'integer',
            'tanggal_lokal' => 'date:Y-m-d',
            'menit_lokal' => 'integer',
        ];
    }
}
