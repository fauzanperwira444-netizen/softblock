<?php

declare(strict_types=1);

namespace App\Http\Controllers\Data;

use App\Domain\AturanTask;
use App\Domain\Status;
use App\Models\EntriTodo;
use App\Models\LabelMandiri;
use App\Models\RiwayatProgress;
use App\Models\Task;
use App\Support\GalatDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;

/**
 * Task, Label, dan Progress (Spesifikasi C-01..C-09), kontrak apps/web/src/api/task.ts.
 *
 * @phpstan-import-type Tujuan from AturanTask
 * @phpstan-import-type IsianTask from AturanTask
 * @phpstan-import-type DataMuat from ProjekController
 */
final class TaskController extends ControllerData
{
    public function simpan(Request $request): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k): void {
            $data = $this->muatData();
            $tujuan = $this->tujuan($k);
            $isian = $this->isian($k);
            if ($tujuan['jenis'] === 'sesi' && ! AturanTask::sesiBolehDituju($data, $tujuan['sesi_id'], $k->hariIni)) {
                $this->gagalBila(['tujuan' => 'Sesi harus belum mulai atau berjalan di projek yang belum tertutup.']);
            }
            $this->gagalBila(AturanTask::validasi($isian, $tujuan, $data, $data['label'], $data['projek'], $k->hariIni, $k->menit, null, true));

            $task = Task::create([
                'sesi_id' => $tujuan['jenis'] === 'sesi' ? $tujuan['sesi_id'] : null,
                'label_id' => $this->siapkanLabel($tujuan),
                'nama' => trim($isian['nama']),
                'deskripsi' => $isian['deskripsi'],
                'kesulitan' => $isian['kesulitan'],
                'dibuat_tanggal_lokal' => $k->hariIni,
            ] + $this->deadline($isian));
            $k->tx->idBaru = $task->id;
        });
    }

    public function ubah(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $t = $this->wajib(Task::class, $id);
            $data = $this->muatData();
            $baris = $this->baris($t);
            $this->tolakBila(Status::taskAktif($baris) ? null : 'Hanya task aktif yang bisa diubah.');
            $this->tolakBila(AturanTask::terkunci($data, $baris, $k->hariIni));
            $isian = $this->isian($k);
            $tujuan = $t->sesi_id !== null
                ? ['jenis' => 'sesi', 'sesi_id' => $t->sesi_id]
                : ['jenis' => 'mandiri', 'label_id' => $t->label_id, 'label_baru' => ''];
            $periksa = ($isian['deadline_tanggal'] === '' ? null : $isian['deadline_tanggal']) !== $baris['deadline_tanggal']
                || $isian['deadline_menit'] !== $baris['deadline_menit'];
            $this->gagalBila(AturanTask::validasi($isian, $tujuan, $data, $data['label'], $data['projek'], $k->hariIni, $k->menit, $t->id, $periksa));

            $t->fill([
                'nama' => trim($isian['nama']),
                'deskripsi' => $isian['deskripsi'],
                'kesulitan' => $isian['kesulitan'],
            ] + $this->deadline($isian))->save();
        });
    }

    public function pindah(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $t = $this->wajib(Task::class, $id);
            $data = $this->muatData();
            $baris = $this->baris($t);
            $this->tolakBila(Status::taskAktif($baris) ? null : 'Hanya task aktif yang bisa dipindahkan.');
            $tujuan = $this->tujuan($k);
            if ($tujuan['jenis'] === 'mandiri' && $t->sesi_id === null) {
                throw GalatDomain::aturan('Task mandiri tidak bisa dipindah ke label lain.');
            }
            if ($tujuan['jenis'] === 'sesi') {
                $this->tolakBila($tujuan['sesi_id'] === $t->sesi_id ? 'Pilih sesi yang berbeda.' : null);
                $this->tolakBila(AturanTask::sesiBolehDituju($data, $tujuan['sesi_id'], $k->hariIni) ? null : 'Sesi tujuan harus belum mulai atau berjalan.');
            }
            $isian = [
                'nama' => $t->nama,
                'deskripsi' => $t->deskripsi,
                'deadline_tanggal' => $k->teks('deadline_tanggal'),
                'deadline_menit' => $k->bulat('deadline_menit'),
                'kesulitan' => $t->kesulitan,
            ];
            $this->gagalBila(AturanTask::validasi($isian, $tujuan, $data, $data['label'], $data['projek'], $k->hariIni, $k->menit, $t->id, true));
            $sesiBaru = $tujuan['jenis'] === 'sesi' ? $tujuan['sesi_id'] : null;
            $this->cekPenutupan($k, AturanTask::dampak($data, $t->id, ['sesi_id' => $sesiBaru], $k->hariIni));

            $t->fill(['sesi_id' => $sesiBaru, 'label_id' => $this->siapkanLabel($tujuan)] + $this->deadline($isian))->save();
        });
    }

    public function progress(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $t = $this->wajib(Task::class, $id);
            $data = $this->muatData();
            $baris = $this->baris($t);
            $this->tolakBila(Status::taskAktif($baris) ? null : 'Progress hanya untuk task aktif.');
            $this->tolakBila(AturanTask::terkunci($data, $baris, $k->hariIni));
            $nilai = $k->bulat('nilai');
            $deskripsi = $k->teks('deskripsi');
            if ($nilai === null || $nilai < 0 || $nilai > Status::PROGRESS_SELESAI) {
                $this->gagalBila(['nilai' => 'Progress harus bilangan bulat 0 sampai 10.']);
            }
            if ($nilai === $t->progress) {
                $this->gagalBila(['nilai' => 'Nilai baru harus berbeda dari nilai sekarang.']);
            }
            if (mb_strlen($deskripsi) > AturanTask::CATATAN_PROGRESS_MAX) {
                $this->gagalBila(['deskripsi' => 'Catatan maksimal '.AturanTask::CATATAN_PROGRESS_MAX.' karakter.']);
            }
            $selesai = $nilai === Status::PROGRESS_SELESAI;
            $this->cekPenutupan($k, $selesai ? AturanTask::dampak($data, $t->id, ['progress' => (int) $nilai], $k->hariIni) : null);

            $this->catatRiwayat($t, (int) $nilai, $deskripsi, $k, $selesai ? 'selesai' : null);
            $t->fill(['progress' => $nilai])->save();
            // E-06: progress mencentang entri hari ini yang sudah ada.
            $entri = EntriTodo::query()->where('task_id', $t->id)->where('tanggal', $k->hariIni)->first();
            if ($entri instanceof EntriTodo && ! $entri->ceklis) {
                $entri->fill(['ceklis' => true])->save();
            }
            if ($selesai) {
                $this->hapusEntriMendatang($t->id, $k->hariIni);
            }
        });
    }

    public function batal(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $t = $this->wajib(Task::class, $id);
            $data = $this->muatData();
            $baris = $this->baris($t);
            $this->tolakBila(Status::taskAktif($baris) ? null : 'Hanya task aktif yang bisa dibatalkan.');
            $this->tolakBila(AturanTask::terkunci($data, $baris, $k->hariIni));
            $this->cekPenutupan($k, AturanTask::dampak($data, $t->id, ['batal' => true], $k->hariIni));
            $this->batalkanTask($t, $k);
        });
    }

    public function bukaKembali(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $t = $this->wajib(Task::class, $id);
            $data = $this->muatData();
            $baris = $this->baris($t);
            $this->tolakBila(AturanTask::syaratBukaKembali($data, $baris, $k->hariIni));
            $nama = trim($k->teks('nama')) !== '' ? trim($k->teks('nama')) : $t->nama;
            if (AturanTask::namaBentrokBukaKembali($data, $baris, $nama)) {
                $this->gagalBila(['nama' => 'Nama bentrok dengan task aktif berlabel sama. Pakai nama lain.']);
            }
            if (mb_strlen($nama) > AturanTask::NAMA_MAX) {
                $this->gagalBila(['nama' => 'Nama task maksimal '.AturanTask::NAMA_MAX.' karakter.']);
            }
            /** @var list<array{sebelum: int, sesudah: int, tanggal_lokal: string, menit_lokal: int}> $riwayat */
            $riwayat = RiwayatProgress::query()->where('task_id', $t->id)->get(['sebelum', 'sesudah', 'tanggal_lokal', 'menit_lokal'])->toArray();
            $kembali = AturanTask::progressSebelumSelesai($riwayat);
            $this->catatRiwayat($t, $kembali, '', $k, 'buka_kembali');
            $t->fill(['nama' => $nama, 'progress' => $kembali])->save();
        });
    }

    public function ubahLabel(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $l = $this->wajib(LabelMandiri::class, $id);
            $data = $this->muatData();
            $g = AturanTask::validasiNamaLabel($k->teks('nama'), $data['label'], $data['projek'], $l->id);
            if ($g !== null) {
                $this->gagalBila(['nama' => $g]);
            }
            $l->fill(['nama' => trim($k->teks('nama'))])->save();
        });
    }

    public function hapusLabel(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $l = $this->wajib(LabelMandiri::class, $id);
            $this->tolakBila(Task::query()->where('label_id', $l->id)->exists() ? 'Label yang punya task tidak bisa dihapus.' : null);
            $l->delete();
        });
    }

    /** @return array{id: string, sesi_id: string|null, label_id: string|null, nama: string, progress: int, batal: bool, deadline_tanggal: string|null, deadline_menit: int|null} */
    private function baris(Task $t): array
    {
        /** @var array{id: string, sesi_id: string|null, label_id: string|null, nama: string, progress: int, batal: bool, deadline_tanggal: string|null, deadline_menit: int|null} */
        return array_intersect_key($t->toArray(), array_flip(['id', 'sesi_id', 'label_id', 'nama', 'progress', 'batal', 'deadline_tanggal', 'deadline_menit']));
    }

    /** @return Tujuan */
    private function tujuan(Konteks $k): array
    {
        $sesi = $k->teks('sesi_id');
        if ($sesi !== '') {
            return ['jenis' => 'sesi', 'sesi_id' => $sesi];
        }

        return ['jenis' => 'mandiri', 'label_id' => $k->teksAtauNull('label_id'), 'label_baru' => $k->teks('label_baru')];
    }

    /** @return IsianTask */
    private function isian(Konteks $k): array
    {
        return [
            'nama' => trim($k->teks('nama')),
            'deskripsi' => $k->teks('deskripsi'),
            'deadline_tanggal' => $k->teks('deadline_tanggal'),
            'deadline_menit' => $k->bulat('deadline_menit'),
            'kesulitan' => $k->bulat('kesulitan'),
        ];
    }

    /**
     * Tanpa tanggal deadline, jam deadline ikut kosong.
     *
     * @param  IsianTask  $isian
     * @return array{deadline_tanggal: string|null, deadline_menit: int|null}
     */
    private function deadline(array $isian): array
    {
        $ada = $isian['deadline_tanggal'] !== '';

        return ['deadline_tanggal' => $ada ? $isian['deadline_tanggal'] : null, 'deadline_menit' => $ada ? $isian['deadline_menit'] : null];
    }

    /**
     * Id label tujuan; label baru dibuat, nama yang sama memakai ulang label lama (C-03).
     *
     * @param  Tujuan  $tujuan
     */
    private function siapkanLabel(array $tujuan): ?string
    {
        if ($tujuan['jenis'] === 'sesi') {
            return null;
        }
        if ($tujuan['label_id'] !== null) {
            $label = $this->wajib(LabelMandiri::class, $tujuan['label_id']);
        } else {
            $nama = trim($tujuan['label_baru']);
            $label = LabelMandiri::query()->whereRaw('lower(nama) = ?', [mb_strtolower($nama)])->first()
                ?? new LabelMandiri(['nama' => $nama]);
        }
        $label->fill(['terakhir_dipakai' => Date::now()])->save();

        return $label->id;
    }

    /** @param  array<string, mixed>|null  $terkini */
    private function cekPenutupan(Konteks $k, ?array $terkini): void
    {
        if ($terkini !== null) {
            /** @var array{projek_menjadi: string, task_batal: list<string>, task_di_luar_periode: list<string>, sesi_dihapus: list<string>, sesi_batal: list<string>, sesi_dipotong: list<array{id: string, akhir_baru: string}>} $terkini */
            $this->cocokkanDampak($k->mentah('dampak'), $terkini);
        }
    }

    private function catatRiwayat(Task $t, int $sesudah, string $deskripsi, Konteks $k, ?string $penanda): void
    {
        RiwayatProgress::create([
            'task_id' => $t->id,
            'sebelum' => $t->progress,
            'sesudah' => $sesudah,
            'deskripsi' => $deskripsi,
            'penanda' => $penanda,
            'tanggal_lokal' => $k->hariIni,
            'menit_lokal' => $k->menit,
        ]);
    }
}
