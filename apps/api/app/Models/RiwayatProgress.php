<?php

declare(strict_types=1);

namespace App\Models;

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
