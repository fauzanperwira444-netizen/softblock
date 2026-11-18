<?php

declare(strict_types=1);

namespace App\Domain;

use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

/**
 * Pembantu tanggal murni (Arsitektur Sistem 5.3), kembaran apps/web/src/domain/tanggal.ts.
 * Tanggal = string "YYYY-MM-DD"; aritmetika di UTC agar bebas zona waktu server.
 */
final class Tanggal
{
    private static function keUtc(string $t): DateTimeImmutable
    {
        return new DateTimeImmutable($t.' 00:00:00', new DateTimeZone('UTC'));
    }

    public static function tambahHari(string $t, int $n): string
    {
        return self::keUtc($t)->modify(sprintf('%+d days', $n))->format('Y-m-d');
    }

    /** Jumlah hari dari $a ke $b (positif bila $b setelah $a). */
    public static function selisihHari(string $a, string $b): int
    {
        $selisih = self::keUtc($a)->diff(self::keUtc($b));

        return (int) $selisih->days * ($selisih->invert === 1 ? -1 : 1);
    }

    /** Hari ISO: 1 Senin sampai 7 Minggu. */
    public static function hariIso(string $t): int
    {
        return (int) self::keUtc($t)->format('N');
    }

    /** Senin pada minggu yang memuat $t. */
    public static function awalMinggu(string $t): string
    {
        return self::tambahHari($t, 1 - self::hariIso($t));
    }

    public static function hariLewat(string $t, string $hariIni): bool
    {
        return $t < $hariIni;
    }

    public static function dalamRentang(string $t, string $mulai, string $akhir): bool
    {
        return $t >= $mulai && $t <= $akhir;
    }

    /**
     * Rentang tanggal inklusif bertumpuk.
     *
     * @param  array{mulai: string, akhir: string}  $a
     * @param  array{mulai: string, akhir: string}  $b
     */
    public static function rentangBertumpuk(array $a, array $b): bool
    {
        return $a['mulai'] <= $b['akhir'] && $b['mulai'] <= $a['akhir'];
    }

    /**
     * Tanggal dan menit lokal untuk sebuah instan di zona waktu tertentu.
     *
     * @return array{tanggal: string, menit: int}
     */
    public static function waktuLokal(DateTimeInterface $instan, string $zona): array
    {
        $lokal = DateTimeImmutable::createFromInterface($instan)->setTimezone(new DateTimeZone($zona));

        return [
            'tanggal' => $lokal->format('Y-m-d'),
            'menit' => (int) $lokal->format('G') * 60 + (int) $lokal->format('i'),
        ];
    }

    /** "Hari ini" tidak pernah mundur (N-44). */
    public static function hariIniTerjaga(string $hariIniJam, ?string $hariIniTerakhir): string
    {
        return $hariIniTerakhir !== null && $hariIniTerakhir > $hariIniJam ? $hariIniTerakhir : $hariIniJam;
    }
}
