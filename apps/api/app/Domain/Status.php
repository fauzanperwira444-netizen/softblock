<?php

declare(strict_types=1);

namespace App\Domain;

/**
 * Status turunan (Spesifikasi 2.1, 2.2, B-04, H-03), kembaran apps/web/src/domain/status.ts.
 * Status tidak disimpan (N-04); dihitung dari baris dan "hari ini".
 *
 * @phpstan-type TaskStatus array{progress: int, batal: bool, deadline_tanggal?: string|null, deadline_menit?: int|null}
 * @phpstan-type SesiStatus array{mulai: string, akhir: string, batal: bool}
 */
final class Status
{
    public const PROGRESS_SELESAI = 10;

    /** Deadline tanpa jam dianggap 23.59. */
    public const MENIT_TANPA_JAM = 23 * 60 + 59;

    /** @param  array{progress: int, batal: bool}  $task */
    public static function taskSelesai(array $task): bool
    {
        return ! $task['batal'] && $task['progress'] >= self::PROGRESS_SELESAI;
    }

    /** @param  array{progress: int, batal: bool}  $task */
    public static function taskAktif(array $task): bool
    {
        return ! $task['batal'] && $task['progress'] < self::PROGRESS_SELESAI;
    }

    /** @param  array{progress: int, batal: bool, deadline_tanggal: string|null, deadline_menit: int|null}  $task */
    public static function taskTelat(array $task, string $hariIni, int $menitSekarang): bool
    {
        if (! self::taskAktif($task) || $task['deadline_tanggal'] === null) {
            return false;
        }
        if ($task['deadline_tanggal'] < $hariIni) {
            return true;
        }
        if ($task['deadline_tanggal'] > $hariIni) {
            return false;
        }

        return $menitSekarang > ($task['deadline_menit'] ?? self::MENIT_TANPA_JAM);
    }

    /**
     * @param  array{deadline_tanggal: string|null}  $task
     * @param  array{mulai: string, akhir: string}|null  $sesi
     */
    public static function taskDiLuarPeriode(array $task, ?array $sesi): bool
    {
        if ($sesi === null || $task['deadline_tanggal'] === null) {
            return false;
        }

        return ! Tanggal::dalamRentang($task['deadline_tanggal'], $sesi['mulai'], $sesi['akhir']);
    }

    /** @param  array{mulai: string, akhir: string, batal: bool}  $sesi */
    public static function statusSesi(array $sesi, string $hariIni): string
    {
        return match (true) {
            $sesi['batal'] => 'batal',
            $hariIni < $sesi['mulai'] => 'belum_mulai',
            $hariIni > $sesi['akhir'] => 'selesai',
            default => 'berjalan',
        };
    }

    /**
     * Status projek menurut tabel 2.2. $tasks = semua task di sesi projek ini.
     *
     * @param  array{batal: bool}  $projek
     * @param  list<array{mulai: string, akhir: string, batal: bool}>  $sesi
     * @param  list<array{progress: int, batal: bool}>  $tasks
     */
    public static function statusProjek(array $projek, array $sesi, array $tasks, string $hariIni): string
    {
        if ($projek['batal']) {
            return 'batal';
        }
        $aktif = array_values(array_filter($sesi, fn (array $s): bool => ! $s['batal']));
        if ($aktif === []) {
            return 'belum_dijadwalkan';
        }
        foreach ($aktif as $s) {
            if (Tanggal::dalamRentang($hariIni, $s['mulai'], $s['akhir'])) {
                return 'berjalan';
            }
        }
        $lewat = count(array_filter($aktif, fn (array $s): bool => $s['akhir'] < $hariIni));
        if ($lewat === 0) {
            return 'belum_mulai';
        }
        if ($lewat < count($aktif)) {
            return 'jeda';
        }
        foreach ($tasks as $t) {
            if (self::taskAktif($t)) {
                return 'melewati_jadwal';
            }
        }

        return 'selesai';
    }

    public static function projekTertutup(string $status): bool
    {
        return $status === 'selesai' || $status === 'batal';
    }
}
