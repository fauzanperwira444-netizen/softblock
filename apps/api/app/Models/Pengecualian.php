<?php

declare(strict_types=1);

namespace App\Models;

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
