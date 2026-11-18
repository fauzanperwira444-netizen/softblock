<?php

declare(strict_types=1);

namespace App\Models;

final class Projek extends ModelAkun
{
    public const TABEL = 'projek';

    protected $table = 'projek';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'batal' => 'boolean',
        ];
    }
}
