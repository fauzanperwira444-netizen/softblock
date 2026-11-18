<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;

/** Pembentuk badan galat API (7.5) agar semua jalur galat memakai bentuk yang sama. */
final class Amplop
{
    /**
     * @param  array<string, string>  $rincian
     * @param  array<string, mixed>|null  $dampak
     * @param  array<string, string>  $header
     */
    public static function galat(
        int $status,
        string $kode,
        string $pesan,
        array $rincian = [],
        ?array $dampak = null,
        ?int $tungguDetik = null,
        array $header = [],
    ): JsonResponse {
        $badan = ['kode' => $kode, 'pesan' => $pesan];
        if ($rincian !== []) {
            $badan['kolom'] = (string) array_key_first($rincian);
        }
        if ($status === 422) {
            $badan['rincian'] = (object) $rincian;
        }
        if ($dampak !== null) {
            $badan['dampak'] = $dampak;
        }
        if ($tungguDetik !== null) {
            $badan['tunggu_detik'] = $tungguDetik;
        }

        return new JsonResponse($badan, $status, $header);
    }
}
