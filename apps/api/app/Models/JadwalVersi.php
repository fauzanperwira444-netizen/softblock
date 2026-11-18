<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\ArrayInt;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string $jadwal_id
 * @property list<int> $hari
 * @property int $mulai_menit
 * @property int $selesai_menit
 * @property Carbon $berlaku_mulai
 * @property Carbon|null $berlaku_akhir
 * @property bool $sekali_jalan
 */
final class JadwalVersi extends ModelAkun
{
    public const TABEL = 'jadwal_versi';

    protected $table = 'jadwal_versi';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'hari' => ArrayInt::class,
            'mulai_menit' => 'integer',
            'selesai_menit' => 'integer',
            'berlaku_mulai' => 'date:Y-m-d',
            'berlaku_akhir' => 'date:Y-m-d',
            'sekali_jalan' => 'boolean',
        ];
    }
}
