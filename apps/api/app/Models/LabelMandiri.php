<?php

declare(strict_types=1);

namespace App\Models;

final class LabelMandiri extends ModelAkun
{
    public const TABEL = 'label_mandiri';

    protected $table = 'label_mandiri';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'terakhir_dipakai' => 'immutable_datetime',
        ];
    }
}
