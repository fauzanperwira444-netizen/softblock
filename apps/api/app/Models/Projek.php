<?php

declare(strict_types=1);

namespace App\Models;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string $nama
 * @property string $deskripsi
 * @property string $warna
 * @property bool $batal
 */
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
