<?php

declare(strict_types=1);

namespace App\Domain;

/**
 * Aturan Projek, Sesi, dan Dokumen (Spesifikasi 2.3, A-01..A-08, B-01..B-06),
 * kembaran apps/web/src/domain/projek.ts.
 *
 * @phpstan-import-type Data from Dampak
 */
final class AturanProjek
{
    public const NAMA_MAX = 45;

    public const DESKRIPSI_MAX = 500;

    public const DOKUMEN_MAX = 10;

    /** 12 warna otomatis (A-02). */
    public const PALET = [
        '#2e8b7a', '#4a8a3c', '#8a7d1f', '#b26a00', '#c2571a', '#c0392b',
        '#c2416b', '#8e5bb5', '#5b6ad0', '#2f7fc1', '#1f8aa0', '#9a6b4f',
    ];

    private const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    public static function kunciNama(string $s): string
    {
        return mb_strtolower(trim($s));
    }

    public static function tanggalSah(string $t): bool
    {
        return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $t, $m) === 1 && checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
    }

    public static function teksTanggal(string $t): string
    {
        return (int) substr($t, 8, 2).' '.self::BULAN[(int) substr($t, 5, 2) - 1].' '.substr($t, 0, 4);
    }

    public static function teksRentang(string $mulai, string $akhir): string
    {
        return $mulai === $akhir ? self::teksTanggal($mulai) : self::teksTanggal($mulai).' – '.self::teksTanggal($akhir);
    }

    /**
     * @param  list<array{id: string, nama: string}>  $projek
     * @param  list<array{id: string, nama: string}>  $label
     */
    public static function validasiNama(string $nama, array $projek, array $label, ?string $kecualiId): ?string
    {
        $k = self::kunciNama($nama);
        if ($k === '') {
            return 'Nama projek wajib diisi.';
        }
        if (mb_strlen(trim($nama)) > self::NAMA_MAX) {
            return 'Nama projek maksimal '.self::NAMA_MAX.' karakter.';
        }
        if ($k === 'mandiri') {
            return '"Mandiri" dipakai untuk task tanpa projek. Pilih nama lain.';
        }
        foreach ($projek as $p) {
            if ($p['id'] !== $kecualiId && self::kunciNama($p['nama']) === $k) {
                return "Nama sudah dipakai projek “{$p['nama']}”.";
            }
        }
        foreach ($label as $l) {
            if (self::kunciNama($l['nama']) === $k) {
                return "Nama sama dengan label mandiri “{$l['nama']}”. Ganti nama projek atau label itu.";
            }
        }

        return null;
    }

    /**
     * Warna yang sedang dipakai projek belum tertutup, selain projek ini.
     *
     * @param  Data  $data
     * @return list<string>
     */
    public static function warnaTerpakai(array $data, string $hariIni, ?string $kecualiId): array
    {
        $terpakai = [];
        foreach ($data['projek'] as $p) {
            if ($p['id'] !== $kecualiId && ! Status::projekTertutup(Dampak::statusProjek($data, $p, $hariIni))) {
                $terpakai[] = strtolower($p['warna'] ?? '');
            }
        }

        return $terpakai;
    }

    /**
     * @param  array{nama: string, mulai: string, akhir: string, deskripsi: string}  $isian
     * @param  list<array{id: string, nama: string, mulai: string, akhir: string, batal: bool}>  $sesiLain
     * @return array<string, string>
     */
    public static function validasiSesi(array $isian, array $sesiLain, string $hariIni, ?string $kecualiId, bool $periodeBerubah): array
    {
        $g = [];
        $k = self::kunciNama($isian['nama']);
        $aktif = array_values(array_filter($sesiLain, fn (array $s): bool => ! $s['batal'] && $s['id'] !== $kecualiId));
        if ($k === '') {
            $g['nama'] = 'Nama sesi wajib diisi.';
        } elseif (mb_strlen(trim($isian['nama'])) > self::NAMA_MAX) {
            $g['nama'] = 'Nama sesi maksimal '.self::NAMA_MAX.' karakter.';
        } else {
            foreach ($aktif as $s) {
                if (self::kunciNama($s['nama']) === $k) {
                    $g['nama'] = 'Nama sesi sudah dipakai di projek ini.';
                    break;
                }
            }
        }
        if (mb_strlen($isian['deskripsi']) > self::DESKRIPSI_MAX) {
            $g['deskripsi'] = 'Deskripsi maksimal '.self::DESKRIPSI_MAX.' karakter.';
        }
        if (! $periodeBerubah) {
            return $g;
        }

        if (! self::tanggalSah($isian['mulai'])) {
            $g['mulai'] = 'Tanggal mulai wajib diisi.';
        }
        if (! self::tanggalSah($isian['akhir'])) {
            $g['akhir'] = 'Tanggal akhir wajib diisi.';
        }
        if (isset($g['mulai']) || isset($g['akhir'])) {
            return $g;
        }
        if ($isian['akhir'] < $isian['mulai']) {
            $g['akhir'] = 'Tanggal akhir harus pada atau setelah tanggal mulai.';
        } elseif ($isian['akhir'] < $hariIni) {
            $g['akhir'] = 'Tanggal akhir harus hari ini atau setelahnya.';
        } else {
            foreach ($aktif as $s) {
                if (Tanggal::rentangBertumpuk($s, $isian)) {
                    $saran = Tanggal::tambahHari($s['akhir'], 1);
                    $g['umum'] = "Periode bertabrakan dengan “{$s['nama']}” (".self::teksRentang($s['mulai'], $s['akhir']).'). '
                        .'Mulai paling cepat '.self::teksTanggal($saran).' atau akhiri sebelum '.self::teksTanggal($s['mulai']).'.';
                    break;
                }
            }
        }

        return $g;
    }

    /** "https://" ditambahkan bila tanpa skema; hanya http/https yang diterima (A-08, N-27). */
    public static function rapikanUrl(string $masukan): ?string
    {
        $s = trim($masukan);
        if ($s === '') {
            return null;
        }
        $url = preg_match('/^[a-z][a-z0-9+.-]*:/i', $s) === 1 ? $s : 'https://'.$s;
        $u = parse_url($url);
        if ($u === false || ! isset($u['scheme'], $u['host'])) {
            return null;
        }
        $skema = strtolower($u['scheme']);
        $host = strtolower($u['host']);
        if (! in_array($skema, ['http', 'https'], true) || ! str_contains($host, '.') || preg_match('/^[a-z0-9.-]+$/', $host) !== 1) {
            return null;
        }
        if (preg_match('/\s/', $url) === 1) {
            return null;
        }

        return $skema.'://'
            .(isset($u['user']) ? $u['user'].(isset($u['pass']) ? ':'.$u['pass'] : '').'@' : '')
            .$host
            .(isset($u['port']) ? ':'.$u['port'] : '')
            .($u['path'] ?? '/')
            .(isset($u['query']) ? '?'.$u['query'] : '')
            .(isset($u['fragment']) ? '#'.$u['fragment'] : '');
    }
}
