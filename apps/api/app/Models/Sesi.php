<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string $projek_id
 * @property string $nama
 * @property string $deskripsi
 * @property Carbon $mulai
 * @property Carbon $akhir
 * @property bool $batal
 */
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
