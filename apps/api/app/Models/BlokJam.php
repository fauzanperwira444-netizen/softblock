<?php

declare(strict_types=1);

namespace App\Models;

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
