<?php

declare(strict_types=1);

namespace App\Domain;

/**
 * Pola kerja (Spesifikasi D-11, D-12), kembaran apps/web/src/domain/polaKerja.ts.
 *
 * @phpstan-type TaskPola array{id: string, progress: int, batal: bool, dibuat_tanggal_lokal: string, dibatalkan_tanggal_lokal: string|null}
 * @phpstan-type RiwayatPola array{task_id: string, penanda: string|null, tanggal_lokal: string, menit_lokal: int}
 * @phpstan-type EntriPola array{task_id: string, tanggal: string, ceklis: bool}
 */
final class PolaKerja
{
    private const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    /** Harian sampai 14 hari, mingguan sampai 120 hari, selebihnya bulanan. */
    public static function granularitas(string $dari, string $sampai): string
    {
        $n = Tanggal::selisihHari($dari, $sampai) + 1;

        return $n <= 14 ? 'hari' : ($n <= 120 ? 'minggu' : 'bulan');
    }

    /** @return list<array{label: string, mulai: string, akhir: string}> */
    private static function ember(string $dari, string $sampai, string $g): array
    {
        $hasil = [];
        $fmt = fn (string $t): string => (int) substr($t, 8).' '.self::BULAN[(int) substr($t, 5, 2) - 1];
        if ($g === 'hari') {
            for ($t = $dari; $t <= $sampai; $t = Tanggal::tambahHari($t, 1)) {
                $hasil[] = ['label' => $fmt($t), 'mulai' => $t, 'akhir' => $t];
            }
        } elseif ($g === 'minggu') {
            for ($t = Tanggal::awalMinggu($dari); $t <= $sampai; $t = Tanggal::tambahHari($t, 7)) {
                $akhir = Tanggal::tambahHari($t, 6);
                $hasil[] = ['label' => $fmt($t), 'mulai' => max($t, $dari), 'akhir' => min($akhir, $sampai)];
            }
        } else {
            $y = (int) substr($dari, 0, 4);
            $m = (int) substr($dari, 5, 2);
            while (true) {
                $awal = sprintf('%04d-%02d-01', $y, $m);
                if ($awal > $sampai) {
                    break;
                }
                [$ny, $nm] = $m === 12 ? [$y + 1, 1] : [$y, $m + 1];
                $akhir = Tanggal::tambahHari(sprintf('%04d-%02d-01', $ny, $nm), -1);
                $hasil[] = ['label' => self::BULAN[$m - 1].' '.substr((string) $y, 2), 'mulai' => max($awal, $dari), 'akhir' => min($akhir, $sampai)];
                [$y, $m] = [$ny, $nm];
            }
        }

        return $hasil;
    }

    /**
     * E-07: dibatalkan > selesai > dikerjakan > tidak dikerjakan.
     *
     * @param  EntriPola  $entri
     * @param  TaskPola  $task
     * @param  list<RiwayatPola>  $riwayatTask  riwayat task ini saja
     */
    public static function statusEntri(array $entri, array $task, array $riwayatTask): string
    {
        if ($task['batal'] && $task['dibatalkan_tanggal_lokal'] === $entri['tanggal']) {
            return 'dibatalkan';
        }
        $hariItu = array_values(array_filter($riwayatTask, fn (array $r): bool => $r['tanggal_lokal'] === $entri['tanggal']));
        usort($hariItu, fn (array $a, array $b): int => $a['menit_lokal'] <=> $b['menit_lokal']);
        $penanda = null;
        foreach ($hariItu as $r) {
            if ($r['penanda'] !== null) {
                $penanda = $r['penanda'];
            }
        }
        if ($penanda === 'selesai') {
            return 'selesai';
        }

        return $entri['ceklis'] || $hariItu !== [] ? 'dikerjakan' : 'tidak_dikerjakan';
    }

    /**
     * D-12: selesai dihitung dari task yang kini selesai (waktu selesai terakhir di periode);
     * rasio dikerjakan hanya hari lewat dan tanpa entri dibatalkan.
     *
     * @param  list<TaskPola>  $task
     * @param  list<RiwayatPola>  $riwayat
     * @param  list<EntriPola>  $entri
     * @return array{dari: string, sampai: string, granularitas: string, seri: list<array{label: string, mulai: string, akhir: string, selesai: int}>, dibuat: int, selesai: int, batal: int, dikerjakan: int, tidak_dikerjakan: int}
     */
    public static function hitung(array $task, array $riwayat, array $entri, string $dari, string $sampai, string $hariIni): array
    {
        $g = self::granularitas($dari, $sampai);
        $dalam = fn (?string $t): bool => $t !== null && $t >= $dari && $t <= $sampai;

        $riwayatPerTask = [];
        foreach ($riwayat as $r) {
            $riwayatPerTask[$r['task_id']][] = $r;
        }
        $taskPerId = [];
        $tanggalSelesai = [];
        foreach ($task as $t) {
            $taskPerId[$t['id']] = $t;
            if (! Status::taskSelesai($t)) {
                continue;
            }
            $terakhir = null;
            foreach ($riwayatPerTask[$t['id']] ?? [] as $r) {
                $kunci = $r['tanggal_lokal'].sprintf('%04d', $r['menit_lokal']);
                if ($r['penanda'] === 'selesai' && ($terakhir === null || $kunci > $terakhir)) {
                    $terakhir = $kunci;
                }
            }
            if ($terakhir !== null) {
                $tanggalSelesai[] = substr($terakhir, 0, 10);
            }
        }

        $seri = array_map(fn (array $e): array => $e + [
            'selesai' => count(array_filter($tanggalSelesai, fn (string $t): bool => $t >= $e['mulai'] && $t <= $e['akhir'])),
        ], self::ember($dari, $sampai, $g));

        $dikerjakan = 0;
        $tidak = 0;
        foreach ($entri as $e) {
            if (! $dalam($e['tanggal']) || $e['tanggal'] >= $hariIni || ! isset($taskPerId[$e['task_id']])) {
                continue;
            }
            $s = self::statusEntri($e, $taskPerId[$e['task_id']], $riwayatPerTask[$e['task_id']] ?? []);
            if ($s === 'tidak_dikerjakan') {
                $tidak++;
            } elseif ($s !== 'dibatalkan') {
                $dikerjakan++;
            }
        }

        return [
            'dari' => $dari,
            'sampai' => $sampai,
            'granularitas' => $g,
            'seri' => $seri,
            'dibuat' => count(array_filter($task, fn (array $t): bool => $dalam($t['dibuat_tanggal_lokal']))),
            'selesai' => count(array_filter($tanggalSelesai, $dalam)),
            'batal' => count(array_filter($task, fn (array $t): bool => $t['batal'] && $dalam($t['dibatalkan_tanggal_lokal']))),
            'dikerjakan' => $dikerjakan,
            'tidak_dikerjakan' => $tidak,
        ];
    }
}
