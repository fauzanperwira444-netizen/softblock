<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Galat yang sudah berbentuk amplop API (Arsitektur Sistem 7.5):
 * {kode, pesan, kolom?, rincian?, dampak?, tunggu_detik?}.
 */
final class GalatDomain extends RuntimeException
{
    /**
     * @param  array<string, string>  $rincian
     * @param  array<string, mixed>|null  $dampak
     */
    public function __construct(
        public readonly int $status,
        public readonly string $kode,
        string $pesan,
        public readonly array $rincian = [],
        public readonly ?array $dampak = null,
        public readonly ?int $tungguDetik = null,
    ) {
        parent::__construct($pesan);
    }

    /** Aturan bisnis yang tidak terikat satu kolom: 422 dengan rincian kosong. */
    public static function aturan(string $pesan): self
    {
        return new self(422, 'validasi_gagal', $pesan);
    }

    public static function kolom(string $kolom, string $pesan): self
    {
        return new self(422, 'validasi_gagal', $pesan, [$kolom => $pesan]);
    }

    public static function versiKonflik(): self
    {
        return new self(409, 'versi_konflik', 'Data sudah berubah di perangkat lain. Memuat ulang.');
    }

    public static function klienUsang(): self
    {
        return new self(409, 'klien_usang', 'Versi aplikasi sudah usang. Muat ulang halaman.');
    }

    /** @param  array<string, mixed>  $dampak */
    public static function dampakBerubah(array $dampak): self
    {
        return new self(409, 'dampak_berubah', 'Dampak aksi berubah. Periksa lagi sebelum melanjutkan.', [], $dampak);
    }

    public static function tidakDitemukan(): self
    {
        return new self(404, 'tidak_ditemukan', 'Data tidak ditemukan.');
    }

    public static function terlaluBanyak(int $tungguDetik): self
    {
        return new self(429, 'terlalu_banyak_percobaan', 'Terlalu banyak percobaan. Coba lagi nanti.', [], null, $tungguDetik);
    }

    public function render(): JsonResponse
    {
        return Amplop::galat(
            $this->status,
            $this->kode,
            $this->getMessage(),
            $this->rincian,
            $this->dampak,
            $this->tungguDetik,
        );
    }
}
