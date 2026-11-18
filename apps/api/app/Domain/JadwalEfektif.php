<?php

declare(strict_types=1);

namespace App\Domain;

/**
 * Jadwal efektif per tanggal dan bentrok blok (Spesifikasi F-01..F-04, F-08, E-04),
 * kembaran apps/web/src/domain/jadwal.ts dan jadwalPenyebabBentrok di todo.ts.
 *
 * @phpstan-type Versi array{id: string, jadwal_id: string, hari: list<int>, mulai_menit: int, selesai_menit: int, berlaku_mulai: string, berlaku_akhir: string|null, sekali_jalan: bool}
 * @phpstan-type Pengecualian array{jadwal_id: string|null, mulai: string, akhir: string}
 * @phpstan-type DataJadwal array{jadwal: list<array{id: string, nama: string}>, versi: list<Versi>, pengecualian: list<Pengecualian>}
 * @phpstan-type Kejadian array{jadwal_id: string, nama: string, mulai: int, selesai: int}
 */
final class JadwalEfektif
{
    public const JAM_AWAL = 6 * 60;

    public const JAM_AKHIR = 24 * 60;

    /**
     * Versi yang berlaku pada tanggal itu. Versi satu Jadwal tidak bertumpuk.
     *
     * @param  list<Versi>  $versi
     * @return Versi|null
     */
    public static function versiBerlaku(array $versi, string $jadwalId, string $tanggal): ?array
    {
        foreach ($versi as $v) {
            if ($v['jadwal_id'] === $jadwalId && $v['berlaku_mulai'] <= $tanggal && ($v['berlaku_akhir'] === null || $tanggal <= $v['berlaku_akhir'])) {
                return $v;
            }
        }

        return null;
    }

    /**
     * Pengecualian untuk Jadwal tertentu, atau semua Jadwal bila jadwal_id kosong (F-04).
     *
     * @param  list<Pengecualian>  $pengecualian
     */
    public static function dikecualikan(array $pengecualian, string $jadwalId, string $tanggal): bool
    {
        foreach ($pengecualian as $p) {
            if (($p['jadwal_id'] === null || $p['jadwal_id'] === $jadwalId) && $p['mulai'] <= $tanggal && $tanggal <= $p['akhir']) {
                return true;
            }
        }

        return false;
    }

    /**
     * Kejadian Jadwal aktif pada sebuah tanggal, urut jam mulai.
     *
     * @param  DataJadwal  $data
     * @return list<Kejadian>
     */
    public static function padaTanggal(array $data, string $tanggal): array
    {
        $hasil = [];
        $hari = Tanggal::hariIso($tanggal);
        foreach ($data['jadwal'] as $jadwal) {
            $v = self::versiBerlaku($data['versi'], $jadwal['id'], $tanggal);
            if ($v === null) {
                continue;
            }
            $jatuh = $v['sekali_jalan'] ? $v['berlaku_mulai'] === $tanggal : in_array($hari, $v['hari'], true);
            if (! $jatuh || self::dikecualikan($data['pengecualian'], $jadwal['id'], $tanggal)) {
                continue;
            }
            $hasil[] = ['jadwal_id' => $jadwal['id'], 'nama' => $jadwal['nama'], 'mulai' => $v['mulai_menit'], 'selesai' => $v['selesai_menit']];
        }
        usort($hasil, fn (array $a, array $b): int => $a['mulai'] <=> $b['mulai']);

        return $hasil;
    }

    /**
     * Rentang jam [mulai, selesai) bertumpuk; berbatasan tidak dihitung bentrok.
     *
     * @param  array{mulai: int, selesai: int}  $a
     * @param  array{mulai: int, selesai: int}  $b
     */
    public static function jamBertumpuk(array $a, array $b): bool
    {
        return $a['mulai'] < $b['selesai'] && $b['mulai'] < $a['selesai'];
    }

    /**
     * F-08: Jadwal yang menimpa sebuah blok, atau null.
     *
     * @param  array{tanggal: string, mulai_menit: int, selesai_menit: int}  $blok
     * @param  DataJadwal  $data
     * @return Kejadian|null
     */
    public static function penyebabBentrok(array $blok, array $data): ?array
    {
        foreach (self::padaTanggal($data, $blok['tanggal']) as $k) {
            if (self::jamBertumpuk($k, ['mulai' => $blok['mulai_menit'], 'selesai' => $blok['selesai_menit']])) {
                return $k;
            }
        }

        return null;
    }

    /**
     * F-03: Jadwal yang pernah berlaku di hari lewat tidak bisa dihapus, hanya diakhiri.
     *
     * @param  list<Versi>  $versi
     */
    public static function pernahBerlaku(array $versi, string $jadwalId, string $hariIni): bool
    {
        $kemarin = Tanggal::tambahHari($hariIni, -1);
        foreach ($versi as $v) {
            if ($v['jadwal_id'] === $jadwalId && $v['berlaku_mulai'] <= $kemarin && self::jatuhDalam($v, $v['berlaku_mulai'], $kemarin)) {
                return true;
            }
        }

        return false;
    }

    /** @param  Versi  $v */
    private static function jatuhDalam(array $v, string $dari, string $sampai): bool
    {
        $awal = max($v['berlaku_mulai'], $dari);
        $akhir = $v['berlaku_akhir'] !== null && $v['berlaku_akhir'] < $sampai ? $v['berlaku_akhir'] : $sampai;
        if ($awal > $akhir) {
            return false;
        }
        if ($v['sekali_jalan']) {
            return true;
        }
        $t = $awal;
        for ($i = 0; $i < 7 && $t <= $akhir; $i++) {
            if (in_array(Tanggal::hariIso($t), $v['hari'], true)) {
                return true;
            }
            $t = Tanggal::tambahHari($t, 1);
        }

        return false;
    }
}
