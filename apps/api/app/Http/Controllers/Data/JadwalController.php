<?php

declare(strict_types=1);

namespace App\Http\Controllers\Data;

use App\Domain\AturanJadwal;
use App\Domain\AturanProjek;
use App\Domain\JadwalEfektif;
use App\Domain\Tanggal;
use App\Models\Jadwal;
use App\Models\JadwalVersi;
use App\Models\Pengecualian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Jadwal berversi dan pengecualian (Spesifikasi F-01..F-04), kontrak apps/web/src/api/jadwal.ts.
 *
 * @phpstan-import-type IsianJadwal from AturanJadwal
 * @phpstan-import-type Versi from JadwalEfektif
 */
final class JadwalController extends ControllerData
{
    public function simpan(Request $request): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k): void {
            $isian = $this->isian($k);
            $this->gagalBila(AturanJadwal::validasi($isian, $k->hariIni));
            $j = Jadwal::create(['nama' => trim($isian['nama'])]);
            JadwalVersi::create(['jadwal_id' => $j->id] + AturanJadwal::versiDariIsian($isian));
            $k->tx->idBaru = $j->id;
        });
    }

    public function ubah(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $j = $this->wajib(Jadwal::class, $id);
            $isian = $this->isian($k);
            $this->gagalBila(AturanJadwal::validasi($isian, $k->hariIni));
            $versi = JadwalVersi::query()->where('jadwal_id', $j->id)->get();
            $j->fill(['nama' => trim($isian['nama'])])->save();

            if (! JadwalEfektif::pernahBerlaku($this->barisVersi($j->id), $j->id, $k->hariIni)) {
                // Belum pernah berlaku: semua versi diganti versi baru.
                foreach ($versi as $v) {
                    $v->delete();
                }
            } else {
                // Pernah berlaku: versi lama berakhir sehari sebelum versi baru mulai.
                $potong = Tanggal::tambahHari($isian['tanggal'], -1);
                foreach ($versi as $v) {
                    $mulai = $v->berlaku_mulai->format('Y-m-d');
                    $akhir = $v->berlaku_akhir?->format('Y-m-d');
                    if ($mulai >= $isian['tanggal']) {
                        $v->delete();
                    } elseif ($akhir === null || $akhir > $potong) {
                        $v->fill(['berlaku_akhir' => $potong])->save();
                    }
                }
            }
            JadwalVersi::create(['jadwal_id' => $j->id] + AturanJadwal::versiDariIsian($isian));
        });
    }

    public function akhiri(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $j = $this->wajib(Jadwal::class, $id);
            $tanggal = $k->teks('tanggal') !== '' ? $k->teks('tanggal') : $k->hariIni;
            $this->tolakBila(AturanProjek::tanggalSah($tanggal) ? null : 'Tanggal tidak valid.');
            $this->tolakBila($tanggal < $k->hariIni ? 'Tanggal berakhir harus hari ini atau setelahnya.' : null);
            $terakhir = AturanJadwal::versiTerakhir($this->barisVersi($j->id));
            $this->tolakBila($terakhir === null ? 'Jadwal tidak punya versi.' : null);
            /** @var Versi $terakhir */
            $this->tolakBila($terakhir['sekali_jalan'] ? 'Jadwal sekali jalan tidak perlu diakhiri; hapus saja.' : null);
            $this->tolakBila($tanggal < $terakhir['berlaku_mulai'] ? 'Tanggal berakhir sebelum versi terakhir mulai berlaku.' : null);
            $this->wajib(JadwalVersi::class, $terakhir['id'])->fill(['berlaku_akhir' => $tanggal])->save();
        });
    }

    public function hapus(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $j = $this->wajib(Jadwal::class, $id);
            $this->tolakBila(JadwalEfektif::pernahBerlaku($this->barisVersi($j->id), $j->id, $k->hariIni)
                ? 'Jadwal yang pernah berlaku tidak bisa dihapus. Pakai Akhiri.' : null);
            foreach (JadwalVersi::query()->where('jadwal_id', $j->id)->get() as $v) {
                $v->delete();
            }
            foreach (Pengecualian::query()->where('jadwal_id', $j->id)->get() as $p) {
                $p->delete();
            }
            $j->delete();
        });
    }

    public function simpanPengecualian(Request $request): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k): void {
            $mulai = $k->teks('mulai');
            $akhir = $k->teks('akhir');
            $g = [];
            if (! AturanProjek::tanggalSah($mulai)) {
                $g['mulai'] = 'Tanggal awal wajib diisi.';
            } elseif ($mulai < $k->hariIni) {
                $g['mulai'] = 'Tanggal awal harus hari ini atau setelahnya.';
            }
            if (! AturanProjek::tanggalSah($akhir)) {
                $g['akhir'] = 'Tanggal akhir wajib diisi.';
            } elseif (! isset($g['mulai']) && $akhir < $mulai) {
                $g['akhir'] = 'Tanggal akhir harus pada atau setelah tanggal awal.';
            }
            $this->gagalBila($g, 'Periksa lagi rentang tanggal.');
            $jadwalId = $k->teksAtauNull('jadwal_id');
            if ($jadwalId !== null) {
                $this->wajib(Jadwal::class, $jadwalId);
            }
            $p = Pengecualian::create([
                'jadwal_id' => $jadwalId,
                'mulai' => $mulai,
                'akhir' => $akhir,
                'keterangan' => mb_substr($k->teks('keterangan'), 0, 100),
            ]);
            $k->tx->idBaru = $p->id;
        });
    }

    public function hapusPengecualian(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $this->wajib(Pengecualian::class, $id)->delete();
        });
    }

    /** @return IsianJadwal */
    private function isian(Konteks $k): array
    {
        $hari = $k->mentah('hari');
        $berakhir = $k->teks('berakhir');

        return [
            'nama' => $k->teks('nama'),
            'mulai' => $k->bulat('mulai'),
            'selesai' => $k->bulat('selesai'),
            'sekaliJalan' => $k->benar('sekaliJalan'),
            'hari' => is_array($hari) ? array_values(array_map(fn (mixed $h): int => is_int($h) ? $h : 0, $hari)) : [],
            'tanggal' => $k->teks('tanggal'),
            'berakhir' => $berakhir === '' ? null : $berakhir,
        ];
    }

    /** @return list<Versi> */
    private function barisVersi(string $jadwalId): array
    {
        /** @var list<Versi> */
        return JadwalVersi::query()->where('jadwal_id', $jadwalId)->get()->toArray();
    }
}
