<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string $entri_id
 * @property Carbon $tanggal
 * @property int $mulai_menit
 * @property int $selesai_menit
 */
final class BlokJam extends ModelAkun
{
    public const TABEL = 'blok_jam';

    protected $table = 'blok_jam';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'tanggal' => 'date:Y-m-d',
            'mulai_menit' => 'integer',
            'selesai_menit' => 'integer',
        ];
    }
}
