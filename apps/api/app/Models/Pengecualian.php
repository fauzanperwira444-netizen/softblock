<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string|null $jadwal_id
 * @property Carbon $mulai
 * @property Carbon $akhir
 * @property string $keterangan
 */
final class Pengecualian extends ModelAkun
{
    public const TABEL = 'pengecualian';

    protected $table = 'pengecualian';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'mulai' => 'date:Y-m-d',
            'akhir' => 'date:Y-m-d',
        ];
    }
}
