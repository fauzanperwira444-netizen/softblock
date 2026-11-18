<?php

declare(strict_types=1);

namespace App\Http\Controllers\Data;

use App\Domain\Dampak;
use App\Http\Controllers\Controller;
use App\Models\Akun;
use App\Models\BlokJam;
use App\Models\EntriTodo;
use App\Models\LabelMandiri;
use App\Models\ModelAkun;
use App\Models\Projek;
use App\Models\Sesi;
use App\Models\Task;
use App\Support\GalatDomain;
use App\Support\HariIni;
use App\Support\Transaksi;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;

/**
 * Induk controller modul data. Setiap aksi pengubah berjalan di satu Transaksi (AD-3)
 * dan menjawab dengan bentuk ResponsMutasi (Arsitektur Sistem 7.3).
 *
 * @phpstan-import-type Data from Dampak
 * @phpstan-import-type HasilDampak from Dampak
 */
abstract class ControllerData extends Controller
{
    /** @param  Closure(Konteks): void  $kerja */
    protected function aksi(Request $request, Closure $kerja): JsonResponse
    {
        /** @var Akun $akun */
        $akun = $request->user();
        $hasil = Transaksi::jalankan($akun, $request->header('If-Match'), function (Transaksi $tx) use ($akun, $request, $kerja): void {
            $hariIni = HariIni::untuk($akun);
            $kerja(new Konteks($tx, $akun, $hariIni['tanggal'], $hariIni['menit'], $request));
        });

        return response()->json($hasil);
    }

    /**
     * Baris milik akun ini, atau 404. Id bukan UUID juga 404, tidak sampai ke database.
     *
     * @template T of ModelAkun
     *
     * @param  class-string<T>  $kelas
     * @return T
     */
    protected function wajib(string $kelas, string $id): ModelAkun
    {
        $baris = Str::isUuid($id) ? $kelas::query()->find($id) : null;
        if (! $baris instanceof $kelas) {
            throw GalatDomain::tidakDitemukan();
        }

        return $baris;
    }

    protected function tolakBila(?string $syarat): void
    {
        if ($syarat !== null) {
            throw GalatDomain::aturan($syarat);
        }
    }

    /** @param  array<string, string>  $rincian */
    protected function gagalBila(array $rincian, string $pesan = 'Periksa lagi isian yang ditandai.'): void
    {
        if ($rincian !== []) {
            throw new GalatDomain(422, 'validasi_gagal', $pesan, $rincian);
        }
    }

    /**
     * Data Projek/Sesi/Task/Label akun sebagai baris larik untuk domain murni.
     *
     * @return array{projek: list<array{id: string, nama: string, warna: string, batal: bool}>, sesi: list<array{id: string, projek_id: string, nama: string, mulai: string, akhir: string, batal: bool}>, task: list<array{id: string, sesi_id: string|null, label_id: string|null, nama: string, progress: int, batal: bool, deadline_tanggal: string|null, deadline_menit: int|null}>, label: list<array{id: string, nama: string}>}
     */
    protected function muatData(): array
    {
        /** @var list<array{id: string, nama: string, warna: string, batal: bool}> $projek */
        $projek = Projek::query()->get(['id', 'nama', 'warna', 'batal'])->toArray();
        /** @var list<array{id: string, projek_id: string, nama: string, mulai: string, akhir: string, batal: bool}> $sesi */
        $sesi = Sesi::query()->get(['id', 'projek_id', 'nama', 'mulai', 'akhir', 'batal'])->toArray();
        /** @var list<array{id: string, sesi_id: string|null, label_id: string|null, nama: string, progress: int, batal: bool, deadline_tanggal: string|null, deadline_menit: int|null}> $task */
        $task = Task::query()->get(['id', 'sesi_id', 'label_id', 'nama', 'progress', 'batal', 'deadline_tanggal', 'deadline_menit'])->toArray();
        /** @var list<array{id: string, nama: string}> $label */
        $label = LabelMandiri::query()->get(['id', 'nama'])->toArray();

        return ['projek' => $projek, 'sesi' => $sesi, 'task' => $task, 'label' => $label];
    }

    /**
     * Server menghitung ulang dampak di bawah kunci akun; beda sedikit pun = 409 (AD-4).
     *
     * @param  HasilDampak  $terkini
     */
    protected function cocokkanDampak(mixed $dikirim, array $terkini): void
    {
        $normal = self::normalDampak($dikirim);
        if ($normal === null || ! Dampak::sama($normal, $terkini)) {
            throw GalatDomain::dampakBerubah($terkini);
        }
    }

    /** @return HasilDampak|null */
    private static function normalDampak(mixed $d): ?array
    {
        if (! is_array($d) || ! is_string($d['projek_menjadi'] ?? null)) {
            return null;
        }
        $hasil = ['projek_menjadi' => $d['projek_menjadi']];
        foreach (['task_batal', 'task_di_luar_periode', 'sesi_dihapus', 'sesi_batal'] as $k) {
            if (! is_array($d[$k] ?? null) || ! array_is_list($d[$k])) {
                return null;
            }
            $hasil[$k] = array_map(fn (mixed $x): string => is_string($x) ? $x : '', $d[$k]);
        }
        if (! is_array($d['sesi_dipotong'] ?? null) || ! array_is_list($d['sesi_dipotong'])) {
            return null;
        }
        $hasil['sesi_dipotong'] = [];
        foreach ($d['sesi_dipotong'] as $x) {
            if (! is_array($x) || ! is_string($x['id'] ?? null) || ! is_string($x['akhir_baru'] ?? null)) {
                return null;
            }
            $hasil['sesi_dipotong'][] = ['id' => $x['id'], 'akhir_baru' => $x['akhir_baru']];
        }

        return $hasil;
    }

    /** @param  HasilDampak  $d */
    protected function terapkanDampak(array $d, Konteks $k): void
    {
        foreach ($d['task_batal'] as $id) {
            $task = Task::query()->find($id);
            if ($task instanceof Task) {
                $this->batalkanTask($task, $k);
            }
        }
        foreach ($d['sesi_batal'] as $id) {
            Sesi::query()->find($id)?->fill(['batal' => true])->save();
        }
        foreach ($d['sesi_dipotong'] as $x) {
            Sesi::query()->find($x['id'])?->fill(['akhir' => $x['akhir_baru']])->save();
        }
        foreach ($d['sesi_dihapus'] as $id) {
            Sesi::query()->find($id)?->delete();
        }
    }

    protected function batalkanTask(Task $task, Konteks $k): void
    {
        $task->fill([
            'batal' => true,
            'dibatalkan_pada' => Date::now(),
            'dibatalkan_tanggal_lokal' => $k->hariIni,
            'dibatalkan_menit_lokal' => $k->menit,
        ])->save();
        $this->hapusEntriMendatang($task->id, $k->hariIni);
    }

    /** E-08: entri hari ini tetap, entri mendatang dihapus beserta bloknya. */
    protected function hapusEntriMendatang(string $taskId, string $hariIni): void
    {
        $entri = EntriTodo::query()->where('task_id', $taskId)->where('tanggal', '>', $hariIni)->get();
        foreach ($entri as $e) {
            $this->buangEntri($e);
        }
    }

    protected function buangEntri(EntriTodo $e): void
    {
        foreach (BlokJam::query()->where('entri_id', $e->id)->get() as $b) {
            $b->delete();
        }
        $e->delete();
    }
}
