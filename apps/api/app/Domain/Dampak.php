<?php

declare(strict_types=1);

namespace App\Domain;

/**
 * Syarat dan dampak aksi berat Projek/Sesi (Spesifikasi 2.4, A-04, A-05, B-05, B-06;
 * kontrak Arsitektur Sistem 7.4), kembaran apps/web/src/domain/projek.ts.
 * Hasil harus identik dengan TS: daftar id terurut, karena server membandingkan
 * dampak kiriman klien dan membalas 409 dampak_berubah bila berbeda (AD-4).
 *
 * @phpstan-type Projek array{id: string, batal: bool, nama?: string, warna?: string}
 * @phpstan-type Sesi array{id: string, projek_id: string, nama?: string, mulai: string, akhir: string, batal: bool}
 * @phpstan-type Task array{id: string, sesi_id: string|null, progress: int, batal: bool, deadline_tanggal: string|null, label_id?: string|null, nama?: string, deadline_menit?: int|null}
 * @phpstan-type Data array{projek: list<Projek>, sesi: list<Sesi>, task: list<Task>}
 * @phpstan-type HasilDampak array{projek_menjadi: string, task_batal: list<string>, task_di_luar_periode: list<string>, sesi_dihapus: list<string>, sesi_batal: list<string>, sesi_dipotong: list<array{id: string, akhir_baru: string}>}
 */
final class Dampak
{
    /**
     * @param  Data  $data
     * @return list<Sesi>
     */
    public static function sesiProjek(array $data, string $projekId): array
    {
        return array_values(array_filter($data['sesi'], fn (array $s): bool => $s['projek_id'] === $projekId));
    }

    /**
     * @param  Data  $data
     * @return list<Task>
     */
    public static function taskProjek(array $data, string $projekId): array
    {
        $ids = array_column(self::sesiProjek($data, $projekId), 'id');

        return array_values(array_filter($data['task'], fn (array $t): bool => $t['sesi_id'] !== null && in_array($t['sesi_id'], $ids, true)));
    }

    /**
     * @param  Data  $data
     * @param  Projek  $projek
     */
    public static function statusProjek(array $data, array $projek, string $hariIni): string
    {
        return Status::statusProjek($projek, self::sesiProjek($data, $projek['id']), self::taskProjek($data, $projek['id']), $hariIni);
    }

    /**
     * @param  HasilDampak  $a
     * @param  HasilDampak  $b
     */
    public static function sama(array $a, array $b): bool
    {
        return self::rapikan($a) === self::rapikan($b);
    }

    /**
     * @param  HasilDampak  $d
     * @return HasilDampak
     */
    public static function rapikan(array $d): array
    {
        foreach (['task_batal', 'task_di_luar_periode', 'sesi_dihapus', 'sesi_batal'] as $k) {
            $daftar = array_map('strval', $d[$k]);
            sort($daftar, SORT_STRING);
            $d[$k] = $daftar;
        }
        $potong = array_map(fn (array $x): array => ['id' => (string) $x['id'], 'akhir_baru' => (string) $x['akhir_baru']], $d['sesi_dipotong']);
        usort($potong, fn (array $a, array $b): int => strcmp($a['id'], $b['id']));

        return [
            'projek_menjadi' => $d['projek_menjadi'],
            'task_batal' => $d['task_batal'],
            'task_di_luar_periode' => $d['task_di_luar_periode'],
            'sesi_dihapus' => $d['sesi_dihapus'],
            'sesi_batal' => $d['sesi_batal'],
            'sesi_dipotong' => $potong,
        ];
    }

    /** @return array{task_batal: list<string>, task_di_luar_periode: list<string>, sesi_dihapus: list<string>, sesi_batal: list<string>, sesi_dipotong: list<array{id: string, akhir_baru: string}>} */
    private static function kosong(): array
    {
        return ['task_batal' => [], 'task_di_luar_periode' => [], 'sesi_dihapus' => [], 'sesi_batal' => [], 'sesi_dipotong' => []];
    }

    /**
     * @param  array{task_batal: list<string>, task_di_luar_periode: list<string>, sesi_dihapus: list<string>, sesi_batal: list<string>, sesi_dipotong: list<array{id: string, akhir_baru: string}>}  $d
     * @return HasilDampak
     */
    private static function dengan(array $d, string $menjadi): array
    {
        return self::rapikan(['projek_menjadi' => $menjadi] + $d);
    }

    /**
     * Status projek setelah dampak diterapkan pada salinan data.
     *
     * @param  Data  $data
     * @param  Projek  $projek
     * @param  array{task_batal: list<string>, task_di_luar_periode: list<string>, sesi_dihapus: list<string>, sesi_batal: list<string>, sesi_dipotong: list<array{id: string, akhir_baru: string}>}  $d
     */
    private static function statusSetelah(array $data, array $projek, array $d, string $hariIni): string
    {
        $potong = array_column($d['sesi_dipotong'], 'akhir_baru', 'id');
        $sesi = [];
        foreach (self::sesiProjek($data, $projek['id']) as $s) {
            if (in_array($s['id'], $d['sesi_dihapus'], true)) {
                continue;
            }
            $s['batal'] = $s['batal'] || in_array($s['id'], $d['sesi_batal'], true);
            $s['akhir'] = $potong[$s['id']] ?? $s['akhir'];
            $sesi[] = $s;
        }
        $task = array_map(function (array $t) use ($d): array {
            $t['batal'] = $t['batal'] || in_array($t['id'], $d['task_batal'], true);

            return $t;
        }, self::taskProjek($data, $projek['id']));

        return Status::statusProjek($projek, $sesi, $task, $hariIni);
    }

    /**
     * @param  Data  $data
     * @param  Projek  $projek
     */
    public static function syaratSelesaiDini(array $data, array $projek, string $hariIni): ?string
    {
        $st = self::statusProjek($data, $projek, $hariIni);
        if ($st !== 'berjalan' && $st !== 'jeda') {
            return 'Selesai dini hanya untuk projek berjalan atau jeda.';
        }
        foreach (self::taskProjek($data, $projek['id']) as $t) {
            if (Status::taskAktif($t)) {
                return 'Selesaikan atau batalkan semua task aktif lebih dulu.';
            }
        }

        return null;
    }

    /**
     * A-04: sesi berjalan dipotong sampai kemarin; sesi mulai hari ini atau nanti dihapus (kosong) atau batal (bertask).
     *
     * @param  Data  $data
     * @param  Projek  $projek
     * @return HasilDampak
     */
    public static function selesaiDini(array $data, array $projek, string $hariIni): array
    {
        $d = self::kosong();
        $kemarin = Tanggal::tambahHari($hariIni, -1);
        $tasks = self::taskProjek($data, $projek['id']);
        foreach (self::sesiProjek($data, $projek['id']) as $s) {
            if ($s['batal'] || $s['akhir'] < $hariIni) {
                continue;
            }
            $isi = array_values(array_filter($tasks, fn (array $t): bool => $t['sesi_id'] === $s['id']));
            if ($s['mulai'] >= $hariIni) {
                if ($isi === []) {
                    $d['sesi_dihapus'][] = $s['id'];
                } else {
                    $d['sesi_batal'][] = $s['id'];
                }

                continue;
            }
            $d['sesi_dipotong'][] = ['id' => $s['id'], 'akhir_baru' => $kemarin];
            foreach ($isi as $t) {
                if (Status::taskSelesai($t) && $t['deadline_tanggal'] !== null && $t['deadline_tanggal'] > $kemarin) {
                    $d['task_di_luar_periode'][] = $t['id'];
                }
            }
        }

        return self::dengan($d, self::statusSetelah($data, $projek, $d, $hariIni));
    }

    /**
     * @param  Data  $data
     * @param  Projek  $projek
     */
    public static function syaratBatalProjek(array $data, array $projek, string $hariIni): ?string
    {
        return Status::projekTertutup(self::statusProjek($data, $projek, $hariIni)) ? 'Projek tertutup tidak bisa dibatalkan.' : null;
    }

    /**
     * A-05: task aktif batal; sesi berjalan dan belum mulai batal; projek tanpa sesi bertask dihapus.
     *
     * @param  Data  $data
     * @param  Projek  $projek
     * @return HasilDampak
     */
    public static function batalProjek(array $data, array $projek, string $hariIni): array
    {
        $d = self::kosong();
        $tasks = self::taskProjek($data, $projek['id']);
        $d['task_batal'] = array_values(array_map(fn (array $t): string => $t['id'], array_filter($tasks, fn (array $t): bool => Status::taskAktif($t))));
        $bertask = false;
        foreach (self::sesiProjek($data, $projek['id']) as $s) {
            if (! $s['batal'] && $s['akhir'] >= $hariIni) {
                $d['sesi_batal'][] = $s['id'];
            }
            foreach ($tasks as $t) {
                if ($t['sesi_id'] === $s['id']) {
                    $bertask = true;
                }
            }
        }

        return self::dengan($d, $bertask ? 'batal' : 'dihapus');
    }

    /**
     * @param  Data  $data
     * @param  Projek  $projek
     */
    public static function syaratHapusProjek(array $data, array $projek): ?string
    {
        return self::sesiProjek($data, $projek['id']) !== [] ? 'Hanya projek tanpa sesi yang bisa dihapus. Pakai Batal projek.' : null;
    }

    /** @param  Sesi  $sesi */
    public static function syaratBatalSesi(array $sesi, string $hariIni): ?string
    {
        if ($sesi['batal']) {
            return 'Sesi sudah batal.';
        }

        return Status::statusSesi($sesi, $hariIni) === 'selesai' ? 'Sesi yang sudah selesai tidak bisa dibatalkan.' : null;
    }

    /**
     * B-06: task aktif di sesi batal; periode tidak dipotong.
     *
     * @param  Data  $data
     * @param  Projek  $projek
     * @param  Sesi  $sesi
     * @return HasilDampak
     */
    public static function batalSesi(array $data, array $projek, array $sesi, string $hariIni): array
    {
        $d = self::kosong();
        foreach ($data['task'] as $t) {
            if ($t['sesi_id'] === $sesi['id'] && Status::taskAktif($t)) {
                $d['task_batal'][] = $t['id'];
            }
        }
        $d['sesi_batal'] = [$sesi['id']];

        return self::dengan($d, self::statusSetelah($data, $projek, $d, $hariIni));
    }

    /**
     * @param  Data  $data
     * @param  Sesi  $sesi
     */
    public static function syaratHapusSesi(array $data, array $sesi, string $hariIni): ?string
    {
        foreach ($data['task'] as $t) {
            if ($t['sesi_id'] === $sesi['id']) {
                return 'Sesi berisi task tidak bisa dihapus. Pakai Batal sesi.';
            }
        }
        $st = Status::statusSesi($sesi, $hariIni);

        return $st !== 'belum_mulai' && $st !== 'batal' ? 'Hanya sesi belum mulai atau batal yang bisa dihapus.' : null;
    }

    /**
     * @param  Data  $data
     * @param  Projek  $projek
     * @param  Sesi  $sesi
     * @return HasilDampak
     */
    public static function hapusSesi(array $data, array $projek, array $sesi, string $hariIni): array
    {
        $d = self::kosong();
        $d['sesi_dihapus'] = [$sesi['id']];

        return self::dengan($d, self::statusSetelah($data, $projek, $d, $hariIni));
    }

    /** @param  Sesi  $sesi */
    public static function syaratUbahPeriode(array $sesi, string $hariIni): ?string
    {
        $st = Status::statusSesi($sesi, $hariIni);

        return $st !== 'belum_mulai' && $st !== 'berjalan' ? 'Periode sesi selesai atau batal terkunci.' : null;
    }

    /**
     * B-05: task yang baru keluar periode karena rentang baru.
     *
     * @param  Data  $data
     * @param  Projek  $projek
     * @param  Sesi  $sesi
     * @return HasilDampak
     */
    public static function ubahPeriode(array $data, array $projek, array $sesi, string $mulai, string $akhir, string $hariIni): array
    {
        $d = self::kosong();
        foreach ($data['task'] as $t) {
            if ($t['sesi_id'] !== $sesi['id'] || $t['batal'] || $t['deadline_tanggal'] === null) {
                continue;
            }
            $dulu = Tanggal::dalamRentang($t['deadline_tanggal'], $sesi['mulai'], $sesi['akhir']);
            $kini = Tanggal::dalamRentang($t['deadline_tanggal'], $mulai, $akhir);
            if ($dulu && ! $kini) {
                $d['task_di_luar_periode'][] = $t['id'];
            }
        }
        $salinan = $data;
        $salinan['sesi'] = array_map(
            fn (array $s): array => $s['id'] === $sesi['id'] ? array_merge($s, ['mulai' => $mulai, 'akhir' => $akhir]) : $s,
            $data['sesi'],
        );

        return self::dengan($d, self::statusSetelah($salinan, $projek, $d, $hariIni));
    }
}
