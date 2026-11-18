<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\AkunFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Akun pengguna. Bukan tabel data (tidak memakai MilikAkun): baris ini sendiri
 * yang dikunci setiap transaksi tulis (AD-3).
 *
 * @property string $id
 * @property string $email
 * @property string|null $password
 * @property string $nama_tampil
 * @property string $zona_waktu
 * @property string|null $google_id
 * @property int $revisi
 * @property int $penghapusan_dipangkas_hingga
 * @property CarbonImmutable|null $hari_ini_terakhir
 */
final class Akun extends Authenticatable
{
    /** @use HasFactory<AkunFactory> */
    use HasFactory, HasUuids;

    protected $table = 'akun';

    /** Tidak ada fitur "ingat saya"; sesi 30 hari sudah cukup (S-2). */
    protected $rememberTokenName = '';

    /** @var list<string> */
    protected $fillable = ['email', 'password', 'nama_tampil', 'zona_waktu'];

    /** @var list<string> */
    protected $hidden = ['password'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'revisi' => 'integer',
            'penghapusan_dipangkas_hingga' => 'integer',
            'hari_ini_terakhir' => 'immutable_date',
        ];
    }

    /**
     * Bentuk Akun di API (apps/web/src/api/akun.ts).
     *
     * @return array{id: string, email: string, nama_tampil: string, zona_waktu: string, punya_password: bool, tertaut_google: bool}
     */
    public function keApi(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'nama_tampil' => $this->nama_tampil,
            'zona_waktu' => $this->zona_waktu,
            'punya_password' => $this->password !== null,
            'tertaut_google' => $this->google_id !== null,
        ];
    }
}
