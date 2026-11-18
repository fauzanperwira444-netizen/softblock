<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string|null $sesi_id
 * @property string|null $label_id
 * @property string $nama
 * @property string $deskripsi
 * @property Carbon|null $deadline_tanggal
 * @property int|null $deadline_menit
 * @property int $kesulitan
 * @property int $progress
 * @property bool $batal
 * @property CarbonImmutable|null $dibatalkan_pada
 * @property Carbon|null $dibatalkan_tanggal_lokal
 * @property int|null $dibatalkan_menit_lokal
 * @property Carbon $dibuat_tanggal_lokal
 */
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
