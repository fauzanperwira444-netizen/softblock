<?php

declare(strict_types=1);

namespace App\Models;

final class Sesi extends ModelAkun
{
    public const TABEL = 'sesi';

    protected $table = 'sesi';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'mulai' => 'date:Y-m-d',
            'akhir' => 'date:Y-m-d',
            'batal' => 'boolean',
        ];
    }
}
