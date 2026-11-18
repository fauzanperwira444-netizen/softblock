<?php

declare(strict_types=1);

namespace App\Models;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string $projek_id
 * @property string $nama
 * @property string $url
 */
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
