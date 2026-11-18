<?php

declare(strict_types=1);

namespace App\Models;

final class Task extends ModelAkun
{
    public const TABEL = 'task';

    protected $table = 'task';

    /** @var list<string> */
    protected $hidden = ['akun_id', 'dibatalkan_menit_lokal'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'deadline_tanggal' => 'date:Y-m-d',
            'deadline_menit' => 'integer',
            'kesulitan' => 'integer',
            'progress' => 'integer',
            'batal' => 'boolean',
            'dibatalkan_pada' => 'immutable_datetime',
            'dibatalkan_tanggal_lokal' => 'date:Y-m-d',
            'dibatalkan_menit_lokal' => 'integer',
            'dibuat_tanggal_lokal' => 'date:Y-m-d',
        ];
    }
}
