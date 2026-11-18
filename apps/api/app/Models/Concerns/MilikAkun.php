<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Support\Transaksi;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use LogicException;

/**
 * Isolasi akun (S-3, N-61) dan pencatatan revisi (AD-3) untuk semua tabel data.
 * - Query selalu dibatasi akun yang masuk; tanpa akun, permintaan HTTP tidak melihat apa pun.
 * - akun_id tidak pernah diambil dari input: diisi dari akun yang masuk.
 * - Setiap tulis wajib di dalam Transaksi agar versi = revisi baru dan perubahan masuk respons mutasi.
 */
trait MilikAkun
{
    use HasUuids;

    public static function bootMilikAkun(): void
    {
        static::addGlobalScope('akun', function (Builder $query): void {
            $tabel = $query->getModel()->getTable();
            if (Auth::hasUser()) {
                $query->where("{$tabel}.akun_id", Auth::id());
            } elseif (! app()->runningInConsole() || app()->runningUnitTests()) {
                $query->whereRaw('false');
            }
        });

        static::creating(function (Model $model): void {
            if ($model->getAttribute('akun_id') === null) {
                $model->setAttribute('akun_id', Transaksi::aktif()?->akun->getKey() ?? Auth::id());
            }
        });

        static::saving(function (Model $model): void {
            $transaksi = Transaksi::aktif();
            if ($transaksi !== null) {
                $model->setAttribute('versi', $transaksi->revisi);
            } elseif ($model->getAttribute('versi') === null) {
                throw new LogicException('Penulisan data harus melalui Transaksi (AD-3).');
            }
        });

        static::saved(fn (Model $model) => Transaksi::aktif()?->catatUbah($model));
        static::deleted(fn (Model $model) => Transaksi::aktif()?->catatHapus($model));
    }
}
