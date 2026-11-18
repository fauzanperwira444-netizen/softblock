<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\RateLimiter;

/**
 * Pembatas percobaan (S-5, N-25, N-73, N-77). Kunci memakai HMAC email agar
 * email tidak tersimpan apa adanya di tabel cache.
 */
final class PembatasMasuk
{
    /** Batas masuk: [awalan kunci, maksimum, jendela detik]. */
    private const MASUK = [
        ['masuk:akun-ip', 5, 900],
        ['masuk:ip', 20, 900],
        ['masuk:akun', 30, 3600],
    ];

    public static function kunciEmail(string $email): string
    {
        return hash_hmac('sha256', mb_strtolower(trim($email)), (string) config('app.key'));
    }

    /** @return array<string, array{0: int, 1: int}> */
    private static function kunciMasuk(string $email, string $ip): array
    {
        $e = self::kunciEmail($email);
        $hasil = [];
        foreach (self::MASUK as [$awalan, $maks, $detik]) {
            $kunci = match ($awalan) {
                'masuk:akun-ip' => "{$awalan}:{$e}:{$ip}",
                'masuk:ip' => "{$awalan}:{$ip}",
                default => "{$awalan}:{$e}",
            };
            $hasil[$kunci] = [$maks, $detik];
        }

        return $hasil;
    }

    public static function cekMasuk(string $email, string $ip): void
    {
        foreach (self::kunciMasuk($email, $ip) as $kunci => [$maks]) {
            if (RateLimiter::tooManyAttempts($kunci, $maks)) {
                throw GalatDomain::terlaluBanyak(max(1, RateLimiter::availableIn($kunci)));
            }
        }
    }

    public static function gagalMasuk(string $email, string $ip): void
    {
        foreach (self::kunciMasuk($email, $ip) as $kunci => [, $detik]) {
            RateLimiter::hit($kunci, $detik);
        }
    }

    /** Berhasil masuk mengosongkan hitungan beruntun untuk pasangan akun dan IP. */
    public static function berhasilMasuk(string $email, string $ip): void
    {
        RateLimiter::clear('masuk:akun-ip:'.self::kunciEmail($email).":{$ip}");
    }

    /** Batas sederhana per kunci; setiap permintaan dihitung. */
    public static function batasi(string $kunci, int $maks, int $detik): void
    {
        if (RateLimiter::tooManyAttempts($kunci, $maks)) {
            throw GalatDomain::terlaluBanyak(max(1, RateLimiter::availableIn($kunci)));
        }
        RateLimiter::hit($kunci, $detik);
    }
}
