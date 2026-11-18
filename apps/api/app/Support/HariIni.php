<?php

declare(strict_types=1);

namespace App\Support;

use App\Domain\Tanggal;
use App\Models\Akun;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;

/**
 * "Hari ini" dan menit sekarang menurut zona waktu akun (AD-6, N-44, N-45).
 * Tanggal tidak pernah mundur: max(jam server di zona akun, hari_ini_terakhir).
 */
final class HariIni
{
    /** @return array{tanggal: string, menit: int} */
    public static function untuk(Akun $akun): array
    {
        $lokal = Tanggal::waktuLokal(Date::now(), $akun->zona_waktu);
        $terakhir = $akun->hari_ini_terakhir?->format('Y-m-d');
        $tanggal = Tanggal::hariIniTerjaga($lokal['tanggal'], $terakhir);

        if ($tanggal !== $terakhir) {
            DB::update(
                'UPDATE akun SET hari_ini_terakhir = ? WHERE id = ? AND (hari_ini_terakhir IS NULL OR hari_ini_terakhir < ?)',
                [$tanggal, $akun->getKey(), $tanggal],
            );
            $akun->setRawAttributes(['hari_ini_terakhir' => $tanggal] + $akun->getAttributes(), true);
        }

        // Tanggal yang dijaga lebih besar dari jam berarti jam mundur: menit dianggap awal hari.
        return ['tanggal' => $tanggal, 'menit' => $tanggal === $lokal['tanggal'] ? $lokal['menit'] : 0];
    }
}
