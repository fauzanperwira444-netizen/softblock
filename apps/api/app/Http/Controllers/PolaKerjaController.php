<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\AturanProjek;
use App\Domain\PolaKerja;
use App\Models\Akun;
use App\Models\EntriTodo;
use App\Models\RiwayatProgress;
use App\Models\Task;
use App\Support\GalatDomain;
use App\Support\HariIni;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/pola-kerja?dari=&sampai= (Spesifikasi D-11, D-12). Riwayat dan entri dibatasi
 * ke rentang di SQL; aturan hitungnya di domain PolaKerja agar sama dengan TS.
 *
 * @phpstan-import-type TaskPola from PolaKerja
 * @phpstan-import-type RiwayatPola from PolaKerja
 * @phpstan-import-type EntriPola from PolaKerja
 */
final class PolaKerjaController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var Akun $akun */
        $akun = $request->user();
        $dari = (string) $request->query('dari', '');
        $sampai = (string) $request->query('sampai', '');
        if (! AturanProjek::tanggalSah($dari) || ! AturanProjek::tanggalSah($sampai) || $dari > $sampai) {
            throw GalatDomain::aturan('Rentang tanggal tidak valid.');
        }
        $hariIni = HariIni::untuk($akun)['tanggal'];
        $sampai = min($sampai, $hariIni);
        $dari = min($dari, $sampai);

        /** @var list<TaskPola> $task */
        $task = Task::query()->get(['id', 'progress', 'batal', 'dibuat_tanggal_lokal', 'dibatalkan_tanggal_lokal'])->toArray();
        // Waktu selesai terakhir bisa jatuh di luar rentang, jadi riwayat bertanda dibaca semua.
        /** @var list<RiwayatPola> $riwayat */
        $riwayat = RiwayatProgress::query()
            ->where(fn ($q) => $q->whereNotNull('penanda')->orWhereBetween('tanggal_lokal', [$dari, $sampai]))
            ->get(['task_id', 'penanda', 'tanggal_lokal', 'menit_lokal'])
            ->toArray();
        /** @var list<EntriPola> $entri */
        $entri = EntriTodo::query()->whereBetween('tanggal', [$dari, $sampai])->get(['task_id', 'tanggal', 'ceklis'])->toArray();

        return response()->json(PolaKerja::hitung($task, $riwayat, $entri, $dari, $sampai, $hariIni));
    }
}
