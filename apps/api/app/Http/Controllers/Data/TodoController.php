<?php

declare(strict_types=1);

namespace App\Http\Controllers\Data;

use App\Domain\AturanJadwal;
use App\Domain\AturanProjek;
use App\Domain\Status;
use App\Models\BlokJam;
use App\Models\EntriTodo;
use App\Models\Jadwal;
use App\Models\JadwalVersi;
use App\Models\Pengecualian;
use App\Models\Task;
use App\Support\GalatDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Entri to-do, ceklis, dan blok jam (Spesifikasi E-01..E-10), kontrak apps/web/src/api/todo.ts.
 *
 * @phpstan-import-type DataJadwal from \App\Domain\JadwalEfektif
 */
final class TodoController extends ControllerData
{
    public function simpanEntri(Request $request): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k): void {
            $id = $k->teks('id');
            if ($id !== '' && ! Str::isUuid($id)) {
                $this->gagalBila(['id' => 'Id entri tidak valid.']);
            }
            // 7.6: id buatan klien membuat permintaan ulang idempoten.
            if ($id !== '' && EntriTodo::query()->whereKey($id)->exists()) {
                $k->tx->idBaru = $id;

                return;
            }
            $tanggal = $k->teks('tanggal');
            $this->wajibBukanLewat($tanggal, $k->hariIni);
            $task = $this->wajib(Task::class, $k->teks('task_id'));
            $this->tolakBila(Status::taskAktif(['progress' => $task->progress, 'batal' => $task->batal]) ? null : 'Hanya task aktif yang bisa ditambahkan ke to-do.');
            if (EntriTodo::query()->where('task_id', $task->id)->where('tanggal', $tanggal)->exists()) {
                throw GalatDomain::aturan('Task ini sudah ada di to-do hari itu.');
            }
            $entri = new EntriTodo(['task_id' => $task->id, 'tanggal' => $tanggal, 'ceklis' => false]);
            if ($id !== '') {
                $entri->id = $id;
            }
            $entri->save();
            $k->tx->idBaru = $entri->id;
        });
    }

    public function hapusEntri(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $e = $this->wajib(EntriTodo::class, $id);
            $this->wajibBukanLewat($e->tanggal->format('Y-m-d'), $k->hariIni);
            $this->buangEntri($e);
        });
    }

    public function ceklis(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $e = $this->wajib(EntriTodo::class, $id);
            $this->wajibBukanLewat($e->tanggal->format('Y-m-d'), $k->hariIni);
            $e->fill(['ceklis' => $k->benar('ceklis')])->save();
        });
    }

    public function simpanBlok(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $e = $this->wajib(EntriTodo::class, $id);
            [$mulai, $selesai] = $this->cekBlok($k, $e, null);
            $blok = BlokJam::create(['entri_id' => $e->id, 'tanggal' => $e->tanggal->format('Y-m-d'), 'mulai_menit' => $mulai, 'selesai_menit' => $selesai]);
            $k->tx->idBaru = $blok->id;
        });
    }

    public function ubahBlok(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $b = $this->wajib(BlokJam::class, $id);
            [$mulai, $selesai] = $this->cekBlok($k, $this->wajib(EntriTodo::class, $b->entri_id), $b->id);
            $b->fill(['mulai_menit' => $mulai, 'selesai_menit' => $selesai])->save();
        });
    }

    public function hapusBlok(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $b = $this->wajib(BlokJam::class, $id);
            $this->wajibBukanLewat($b->tanggal->format('Y-m-d'), $k->hariIni);
            $b->delete();
        });
    }

    private function wajibBukanLewat(string $tanggal, string $hariIni): void
    {
        if (! AturanProjek::tanggalSah($tanggal)) {
            $this->gagalBila(['tanggal' => 'Tanggal tidak valid.']);
        }
        $this->tolakBila($tanggal < $hariIni ? 'Hari yang sudah lewat tidak bisa diubah.' : null);
    }

    /** @return array{0: int, 1: int} */
    private function cekBlok(Konteks $k, EntriTodo $e, ?string $kecualiId): array
    {
        $tanggal = $e->tanggal->format('Y-m-d');
        $mulai = $k->bulat('mulai_menit') ?? -1;
        $selesai = $k->bulat('selesai_menit') ?? -1;
        /** @var list<array{id: string, tanggal: string, mulai_menit: int, selesai_menit: int}> $blokLain */
        $blokLain = BlokJam::query()->where('tanggal', $tanggal)->get(['id', 'tanggal', 'mulai_menit', 'selesai_menit'])->toArray();
        $galat = AturanJadwal::galatBlok($mulai, $selesai, $tanggal, $k->hariIni, $blokLain, self::dataJadwal(), $kecualiId);
        if ($galat !== null) {
            throw new GalatDomain(422, 'validasi_gagal', $galat, ['mulai_menit' => $galat]);
        }

        return [$mulai, $selesai];
    }

    /** @return DataJadwal */
    public static function dataJadwal(): array
    {
        /** @var DataJadwal */
        return [
            'jadwal' => Jadwal::query()->get(['id', 'nama'])->toArray(),
            'versi' => JadwalVersi::query()->get()->toArray(),
            'pengecualian' => Pengecualian::query()->get(['id', 'jadwal_id', 'mulai', 'akhir'])->toArray(),
        ];
    }
}
