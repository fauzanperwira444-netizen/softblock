<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\ArrayInt;

final class JadwalVersi extends ModelAkun
{
    public const TABEL = 'jadwal_versi';

    protected $table = 'jadwal_versi';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'hari' => ArrayInt::class,
            'mulai_menit' => 'integer',
            'selesai_menit' => 'integer',
            'berlaku_mulai' => 'date:Y-m-d',
            'berlaku_akhir' => 'date:Y-m-d',
            'sekali_jalan' => 'boolean',
        ];
    }
}
