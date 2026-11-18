<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\MilikAkun;
use Illuminate\Database\Eloquent\Model;

/**
 * Induk semua tabel data. Serialisasi (toArray) = bentuk baris snapshot di klien
 * (apps/web/src/domain/tipe.ts): tanpa akun_id, tanggal "YYYY-MM-DD".
 */
abstract class ModelAkun extends Model
{
    use MilikAkun;

    /** Nama tabel di kontrak sinkron (sama dengan nama tabel database). */
    public const TABEL = '';

    public $timestamps = false;

    /** @var list<string> */
    protected $guarded = ['akun_id', 'versi'];

    /** @var list<string> */
    protected $hidden = ['akun_id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['versi' => 'integer'];
    }
}
