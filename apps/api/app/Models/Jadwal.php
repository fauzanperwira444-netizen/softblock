<?php

declare(strict_types=1);

namespace App\Models;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string $nama
 */
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
