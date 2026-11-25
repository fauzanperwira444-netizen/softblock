<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Akun;
use App\Support\HariIni;
use App\Support\Tabel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * GET /api/sinkron?sejak=<revisi> (Arsitektur Sistem 7.3).
 * Penuh bila klien baru, berada di depan server, atau lebih tua dari tombstone yang masih disimpan.
 */
final class SinkronController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var Akun $akun */
        $akun = $request->user();
        $sejak = max(0, (int) $request->query('sejak', '0'));
        $hariIni = HariIni::untuk($akun);

        // Satu snapshot yang konsisten: revisi dan baris dibaca dari titik waktu yang sama.
        $hasil = DB::transaction(function () use ($akun, $sejak): array {
            // Hanya bisa di transaksi terluar; di dalam transaksi tes, baca biasa sudah cukup.
            if (DB::transactionLevel() === 1) {
                DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
            }
            $baris = DB::selectOne('SELECT revisi, penghapusan_dipangkas_hingga FROM akun WHERE id = ?', [$akun->getKey()]);
            $revisi = (int) $baris->revisi;
            $penuh = $sejak <= 0 || $sejak > $revisi || $sejak < (int) $baris->penghapusan_dipangkas_hingga;

            $ubah = [];
            foreach (Tabel::MODEL as $tabel => $kelas) {
                $query = $kelas::query()->orderBy('id');
                if (! $penuh) {
                    $query->where('versi', '>', $sejak);
                }
                $isi = $query->get();
                if ($isi->isNotEmpty()) {
                    $ubah[$tabel] = $isi->toArray();
                }
            }

            $hapus = $penuh ? [] : DB::table('penghapusan')
                ->where('akun_id', $akun->getKey())
                ->where('revisi', '>', $sejak)
                ->orderBy('id')
                ->get(['tabel', 'baris_id'])
                ->map(fn (object $h): array => ['tabel' => $h->tabel, 'id' => $h->baris_id])
                ->all();

            return ['revisi' => $revisi, 'penuh' => $penuh, 'ubah' => (object) $ubah, 'hapus' => $hapus];
        });

        return response()->json($hasil + [
            'meta' => [
                'hari_ini' => $hariIni['tanggal'],
                'zona_waktu' => $akun->zona_waktu,
                // Penentu sasaran pengenalan fitur (O-01), dalam zona akun.
                'akun_dibuat' => $akun->created_at?->setTimezone($akun->zona_waktu)->toDateString(),
            ],
        ]);
    }
}
