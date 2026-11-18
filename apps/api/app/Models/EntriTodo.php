<?php

declare(strict_types=1);

namespace App\Models;

final class EntriTodo extends ModelAkun
{
    public const TABEL = 'entri_todo';

    protected $table = 'entri_todo';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'tanggal' => 'date:Y-m-d',
            'ceklis' => 'boolean',
        ];
    }
}
