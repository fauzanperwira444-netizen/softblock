<?php

declare(strict_types=1);

namespace App\Domain;

/**
 * Aturan Task, Label, dan Progress (Spesifikasi C-01..C-09, H-06), kembaran apps/web/src/domain/task.ts.
 *
 * @phpstan-import-type Data from Dampak
 * @phpstan-import-type Task from Dampak
 * @phpstan-import-type HasilDampak from Dampak
 *
 * @phpstan-type Tujuan array{jenis: 'sesi', sesi_id: string}|array{jenis: 'mandiri', label_id: string|null, label_baru: string}
 * @phpstan-type IsianTask array{nama: string, deskripsi: string, deadline_tanggal: string, deadline_menit: int|null, kesulitan: int|null}
 */
final class AturanTask
{
    public const NAMA_MAX = 30;

    public const NAMA_LABEL_MAX = 30;

    public const DESKRIPSI_MAX = 1000;

    public const CATATAN_PROGRESS_MAX = 500;

    /**
     * Sesi dan projek tempat task berada, atau null untuk task mandiri.
     *
     * @param  Data  $data
     * @param  Task  $task
     * @return array{sesi: array{id: string, projek_id: string, mulai: string, akhir: string, batal: bool}, projek: array{id: string, batal: bool}}|null
     */
    public static function tempat(array $data, array $task): ?array
    {
        if ($task['sesi_id'] === null) {
            return null;
        }
        foreach ($data['sesi'] as $s) {
            if ($s['id'] !== $task['sesi_id']) {
                continue;
            }
            foreach ($data['projek'] as $p) {
                if ($p['id'] === $s['projek_id']) {
                    return ['sesi' => $s, 'projek' => $p];
                }
            }
        }

        return null;
    }

    /**
     * @param  Data  $data
     * @param  Task  $task
     */
    private static function kunciLabel(array $data, array $task): string
    {
        if ($task['sesi_id'] !== null) {
            foreach ($data['sesi'] as $s) {
                if ($s['id'] === $task['sesi_id']) {
                    return 'p:'.$s['projek_id'];
                }
            }

            return 'p:';
        }

        return 'l:'.($task['label_id'] ?? '');
    }

    /**
     * Task hanya-baca bila projeknya tertutup atau sesinya batal (H-06).
     *
     * @param  Data  $data
     * @param  Task  $task
     */
    public static function terkunci(array $data, array $task, string $hariIni): ?string
    {
        $tempat = self::tempat($data, $task);
        if ($tempat === null) {
            return null;
        }
        if (Status::projekTertutup(Dampak::statusProjek($data, $tempat['projek'], $hariIni))) {
            return 'Projek tertutup terkunci. Buka kembali projeknya dulu.';
        }

        return $tempat['sesi']['batal'] ? 'Sesi task ini batal.' : null;
    }

    /**
     * Sesi belum mulai atau berjalan di projek belum tertutup (C-01, C-04).
     *
     * @param  Data  $data
     */
    public static function sesiBolehDituju(array $data, string $sesiId, string $hariIni): bool
    {
        foreach ($data['sesi'] as $s) {
            if ($s['id'] !== $sesiId) {
                continue;
            }
            $st = Status::statusSesi($s, $hariIni);
            if ($st !== 'belum_mulai' && $st !== 'berjalan') {
                return false;
            }
            foreach ($data['projek'] as $p) {
                if ($p['id'] === $s['projek_id']) {
                    return ! Status::projekTertutup(Dampak::statusProjek($data, $p, $hariIni));
                }
            }
        }

        return false;
    }

    /**
     * @param  list<array{id: string, nama: string}>  $label
     * @param  list<array{id: string, nama: string}>  $projek
     */
    public static function validasiNamaLabel(string $nama, array $label, array $projek, ?string $kecualiId): ?string
    {
        $k = AturanProjek::kunciNama($nama);
        if ($k === '') {
            return 'Nama label wajib diisi.';
        }
        if (mb_strlen(trim($nama)) > self::NAMA_LABEL_MAX) {
            return 'Nama label maksimal '.self::NAMA_LABEL_MAX.' karakter.';
        }
        if ($k === 'mandiri') {
            return '"Mandiri" dicadangkan. Pilih nama lain.';
        }
        foreach ($projek as $p) {
            if (AturanProjek::kunciNama($p['nama']) === $k) {
                return "Nama sama dengan projek “{$p['nama']}”.";
            }
        }
        foreach ($label as $l) {
            if ($l['id'] !== $kecualiId && AturanProjek::kunciNama($l['nama']) === $k) {
                return "Label “{$l['nama']}” sudah ada.";
            }
        }

        return null;
    }

    /**
     * @param  IsianTask  $isian
     * @param  Tujuan  $tujuan
     * @param  Data  $data
     * @param  list<array{id: string, nama: string}>  $label
     * @param  list<array{id: string, nama: string}>  $projek
     * @return array<string, string>
     */
    public static function validasi(array $isian, array $tujuan, array $data, array $label, array $projek, string $hariIni, int $menit, ?string $kecualiId, bool $periksaDeadline): array
    {
        $g = [];
        $nama = trim($isian['nama']);
        if ($nama === '') {
            $g['nama'] = 'Nama task wajib diisi.';
        } elseif (mb_strlen($nama) > self::NAMA_MAX) {
            $g['nama'] = 'Nama task maksimal '.self::NAMA_MAX.' karakter.';
        }
        if (mb_strlen($isian['deskripsi']) > self::DESKRIPSI_MAX) {
            $g['deskripsi'] = 'Deskripsi maksimal '.self::DESKRIPSI_MAX.' karakter.';
        }
        if ($isian['kesulitan'] === null || $isian['kesulitan'] < 1 || $isian['kesulitan'] > 5) {
            $g['kesulitan'] = 'Pilih kesulitan 1 sampai 5.';
        }

        $sesi = null;
        if ($tujuan['jenis'] === 'sesi') {
            foreach ($data['sesi'] as $s) {
                if ($s['id'] === $tujuan['sesi_id']) {
                    $sesi = $s;
                }
            }
            if ($sesi === null) {
                $g['tujuan'] = 'Pilih sesi projek.';
            }
        } elseif ($tujuan['label_id'] === null) {
            $gl = self::validasiNamaLabel($tujuan['label_baru'], $label, $projek, null);
            if ($gl !== null) {
                $g['label'] = trim($tujuan['label_baru']) !== '' ? $gl : 'Label wajib untuk task mandiri.';
            }
        }

        if (! isset($g['nama']) && ! isset($g['tujuan']) && ! isset($g['label'])) {
            $kunci = match (true) {
                $tujuan['jenis'] === 'sesi' => 'p:'.($sesi['projek_id'] ?? ''),
                $tujuan['label_id'] !== null => 'l:'.$tujuan['label_id'],
                default => 'baru:'.AturanProjek::kunciNama($tujuan['label_baru']),
            };
            foreach ($data['task'] as $t) {
                if ($t['id'] !== $kecualiId && Status::taskAktif($t) && self::kunciLabel($data, $t) === $kunci
                    && AturanProjek::kunciNama($t['nama'] ?? '') === AturanProjek::kunciNama($nama)) {
                    $g['nama'] = 'Nama sudah dipakai task aktif berlabel sama.';
                    break;
                }
            }
        }

        if ($periksaDeadline) {
            $dl = $isian['deadline_tanggal'];
            $dm = $isian['deadline_menit'];
            if ($dl === '') {
                if ($tujuan['jenis'] === 'sesi') {
                    $g['deadline_tanggal'] = 'Deadline wajib untuk task di sesi.';
                }
                if ($dm !== null) {
                    $g['deadline_menit'] = 'Isi tanggal lebih dulu.';
                }
            } else {
                if (! AturanProjek::tanggalSah($dl)) {
                    $g['deadline_tanggal'] = 'Tanggal tidak valid.';
                } elseif ($dl < $hariIni) {
                    $g['deadline_tanggal'] = 'Deadline harus hari ini atau setelahnya.';
                } elseif ($sesi !== null && ($dl < $sesi['mulai'] || $dl > $sesi['akhir'])) {
                    $g['deadline_tanggal'] = 'Pilih tanggal dalam periode sesi ('.AturanProjek::teksRentang($sesi['mulai'], $sesi['akhir']).').';
                }
                if ($dm !== null) {
                    if ($dm < 0 || $dm > 1440 || $dm % 5 !== 0) {
                        $g['deadline_menit'] = 'Jam harus kelipatan 5 menit.';
                    } elseif ($dl === $hariIni && $dm <= $menit) {
                        $g['deadline_menit'] = 'Jam itu sudah lewat.';
                    }
                }
            }
        }

        return $g;
    }

    /**
     * Dampak aksi task yang menutup projek (2.4); null bila projek tidak menjadi selesai.
     *
     * @param  Data  $data
     * @param  array{progress?: int, batal?: bool, sesi_id?: string|null}  $ubah
     * @return HasilDampak|null
     */
    public static function dampak(array $data, string $taskId, array $ubah, string $hariIni): ?array
    {
        $task = null;
        foreach ($data['task'] as $t) {
            if ($t['id'] === $taskId) {
                $task = $t;
            }
        }
        if ($task === null || $task['sesi_id'] === null) {
            return null;
        }
        $tempat = self::tempat($data, $task);
        if ($tempat === null) {
            return null;
        }
        $projek = $tempat['projek'];
        $sebelum = Dampak::statusProjek($data, $projek, $hariIni);
        $salinan = $data;
        $salinan['task'] = array_map(fn (array $t): array => $t['id'] === $taskId ? array_merge($t, $ubah) : $t, $data['task']);
        $sesudah = Dampak::statusProjek($salinan, $projek, $hariIni);
        if ($sebelum === 'selesai' || $sesudah !== 'selesai') {
            return null;
        }

        return [
            'projek_menjadi' => 'selesai',
            'task_batal' => ($ubah['batal'] ?? false) ? [$taskId] : [],
            'task_di_luar_periode' => [],
            'sesi_dihapus' => [],
            'sesi_batal' => [],
            'sesi_dipotong' => [],
        ];
    }

    /**
     * Nilai progress sebelum 10, dipakai saat buka kembali (C-07).
     *
     * @param  list<array{sebelum: int, sesudah: int, tanggal_lokal: string, menit_lokal: int}>  $riwayat
     */
    public static function progressSebelumSelesai(array $riwayat): int
    {
        $terakhir = null;
        foreach ($riwayat as $r) {
            if ($r['sesudah'] !== Status::PROGRESS_SELESAI) {
                continue;
            }
            $kunci = $r['tanggal_lokal'].sprintf('%04d', $r['menit_lokal']);
            if ($terakhir === null || $kunci > $terakhir[0]) {
                $terakhir = [$kunci, $r['sebelum']];
            }
        }

        return min($terakhir[1] ?? 9, 9);
    }

    /**
     * @param  Data  $data
     * @param  Task  $task
     */
    public static function syaratBukaKembali(array $data, array $task, string $hariIni): ?string
    {
        if (! Status::taskSelesai($task)) {
            return 'Hanya task selesai yang bisa dibuka kembali.';
        }
        $tempat = self::tempat($data, $task);
        if ($tempat !== null) {
            if ($tempat['sesi']['batal']) {
                return 'Sesi task ini batal.';
            }
            if (Status::projekTertutup(Dampak::statusProjek($data, $tempat['projek'], $hariIni))) {
                return 'Projek tertutup. Buka kembali projeknya dulu.';
            }
        }

        return null;
    }

    /**
     * @param  Data  $data
     * @param  Task  $task
     */
    public static function namaBentrokBukaKembali(array $data, array $task, string $nama): bool
    {
        $kunci = self::kunciLabel($data, $task);
        foreach ($data['task'] as $t) {
            if ($t['id'] !== $task['id'] && Status::taskAktif($t) && self::kunciLabel($data, $t) === $kunci
                && AturanProjek::kunciNama($t['nama'] ?? '') === AturanProjek::kunciNama($nama)) {
                return true;
            }
        }

        return false;
    }
}
