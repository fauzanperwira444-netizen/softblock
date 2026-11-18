<?php

declare(strict_types=1);

namespace App\Models;

final class Dokumen extends ModelAkun
{
    public const TABEL = 'dokumen';

    protected $table = 'dokumen';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',

        ];
    }
}
