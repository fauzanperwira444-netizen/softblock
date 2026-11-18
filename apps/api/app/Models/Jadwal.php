<?php

declare(strict_types=1);

namespace App\Models;

final class Jadwal extends ModelAkun
{
    public const TABEL = 'jadwal';

    protected $table = 'jadwal';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',

        ];
    }
}
