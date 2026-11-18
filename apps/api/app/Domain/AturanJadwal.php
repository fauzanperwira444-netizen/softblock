<?php

declare(strict_types=1);

namespace App\Domain;

/**
 * Validasi Jadwal dan blok jam (Spesifikasi E-04, E-05, F-01..F-03),
 * kembaran validasiJadwal di jadwal.ts dan validasiBlok di todo.ts.
 *
 * @phpstan-import-type DataJadwal from JadwalEfektif
 * @phpstan-import-type Versi from JadwalEfektif
 *
 * @phpstan-type IsianJadwal array{nama: string, mulai: int|null, selesai: int|null, sekaliJalan: bool, hari: list<int>, tanggal: string, berakhir: string|null}
 */
final class AturanJadwal
{
    public const NAMA_MAX = 30;

    public static function teksJam(int $m): string
    {
        return sprintf('%02d.%02d', intdiv($m, 60), $m % 60);
    }

    /**
     * @param  IsianJadwal  $isian
     * @return array<string, string>
     */
    public static function validasi(array $isian, string $hariIni): array
    {
        $g = [];
        $nama = trim($isian['nama']);
        if ($nama === '') {
            $g['nama'] = 'Nama Jadwal wajib diisi.';
        } elseif (mb_strlen($nama) > self::NAMA_MAX) {
            $g['nama'] = 'Nama maksimal '.self::NAMA_MAX.' karakter.';
        }
        $mulai = $isian['mulai'];
        $selesai = $isian['selesai'];
        if ($mulai === null || $selesai === null || $mulai < JadwalEfektif::JAM_AWAL || $selesai > JadwalEfektif::JAM_AKHIR) {
            $g['jam'] = 'Jam harus di antara 06.00 dan 24.00.';
        } elseif ($mulai % 5 !== 0 || $selesai % 5 !== 0) {
            $g['jam'] = 'Jam harus kelipatan 5 menit.';
        } elseif ($mulai >= $selesai) {
            $g['jam'] = 'Jam mulai harus lebih awal dari jam selesai.';
        }
        $hariSah = array_filter($isian['hari'], fn (int $h): bool => $h >= 1 && $h <= 7);
        if (! $isian['sekaliJalan'] && ($isian['hari'] === [] || count($hariSah) !== count($isian['hari']))) {
            $g['hari'] = 'Pilih minimal satu hari.';
        }
        if (! AturanProjek::tanggalSah($isian['tanggal'])) {
            $g['tanggal'] = 'Tanggal wajib diisi.';
        } elseif ($isian['tanggal'] < $hariIni) {
            $g['tanggal'] = 'Tanggal harus hari ini atau setelahnya.';
        }
        $berakhir = $isian['berakhir'];
        if (! $isian['sekaliJalan'] && $berakhir !== null) {
            if (! AturanProjek::tanggalSah($berakhir)) {
                $g['berakhir'] = 'Tanggal berakhir tidak valid.';
            } elseif (! isset($g['tanggal']) && $berakhir < $isian['tanggal']) {
                $g['berakhir'] = 'Tanggal berakhir harus pada atau setelah tanggal mulai.';
            }
        }

        return $g;
    }

    /**
     * Versi baru dari isian yang sudah valid; sekali jalan = versi satu hari.
     *
     * @param  IsianJadwal  $isian
     * @return array{hari: list<int>, mulai_menit: int, selesai_menit: int, berlaku_mulai: string, berlaku_akhir: string|null, sekali_jalan: bool}
     */
    public static function versiDariIsian(array $isian): array
    {
        $hari = $isian['sekaliJalan'] ? [] : array_values(array_unique($isian['hari']));
        sort($hari);

        return [
            'hari' => $hari,
            'mulai_menit' => (int) $isian['mulai'],
            'selesai_menit' => (int) $isian['selesai'],
            'berlaku_mulai' => $isian['tanggal'],
            'berlaku_akhir' => $isian['sekaliJalan'] ? $isian['tanggal'] : $isian['berakhir'],
            'sekali_jalan' => $isian['sekaliJalan'],
        ];
    }

    /**
     * @param  list<Versi>  $versi
     * @return Versi|null
     */
    public static function versiTerakhir(array $versi): ?array
    {
        $hasil = null;
        foreach ($versi as $v) {
            if ($hasil === null || $v['berlaku_mulai'] > $hasil['berlaku_mulai']) {
                $hasil = $v;
            }
        }

        return $hasil;
    }

    /**
     * E-04: 06.00–24.00, kelipatan 5 menit, tidak bentrok dengan blok lain maupun Jadwal; hari lewat membeku (E-05).
     *
     * @param  list<array{id: string, tanggal: string, mulai_menit: int, selesai_menit: int}>  $blokLain
     * @param  DataJadwal  $jadwal
     */
    public static function galatBlok(int $mulai, int $selesai, string $tanggal, string $hariIni, array $blokLain, array $jadwal, ?string $kecualiId): ?string
    {
        if ($tanggal < $hariIni) {
            return 'Hari yang sudah lewat tidak bisa diubah.';
        }
        if ($mulai < JadwalEfektif::JAM_AWAL || $selesai > JadwalEfektif::JAM_AKHIR) {
            return 'Blok hanya di antara 06.00 dan 24.00.';
        }
        if ($mulai % 5 !== 0 || $selesai % 5 !== 0) {
            return 'Jam harus kelipatan 5 menit.';
        }
        if ($mulai >= $selesai) {
            return 'Jam mulai harus lebih awal dari jam selesai.';
        }
        $isian = ['mulai' => $mulai, 'selesai' => $selesai];
        foreach ($blokLain as $b) {
            if ($b['id'] !== $kecualiId && $b['tanggal'] === $tanggal && JadwalEfektif::jamBertumpuk(['mulai' => $b['mulai_menit'], 'selesai' => $b['selesai_menit']], $isian)) {
                return 'Bentrok dengan blok lain ('.self::teksJam($b['mulai_menit']).'–'.self::teksJam($b['selesai_menit']).').';
            }
        }
        foreach (JadwalEfektif::padaTanggal($jadwal, $tanggal) as $k) {
            if (JadwalEfektif::jamBertumpuk($k, $isian)) {
                return "Bentrok dengan Jadwal “{$k['nama']}” (".self::teksJam($k['mulai']).'–'.self::teksJam($k['selesai']).').';
            }
        }

        return null;
    }
}
