<?php

declare(strict_types=1);

namespace App\Http\Controllers\Data;

use App\Domain\AturanProjek;
use App\Domain\Dampak;
use App\Domain\Status;
use App\Models\Dokumen;
use App\Models\Projek;
use App\Models\Sesi;
use App\Support\GalatDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Projek, Dokumen, dan Sesi (Spesifikasi A-01..A-08, B-01..B-06),
 * kontrak apps/web/src/api/projek.ts.
 *
 * @phpstan-type DataMuat array{projek: list<array{id: string, nama: string, warna: string, batal: bool}>, sesi: list<array{id: string, projek_id: string, nama: string, mulai: string, akhir: string, batal: bool}>, task: list<array{id: string, sesi_id: string|null, label_id: string|null, nama: string, progress: int, batal: bool, deadline_tanggal: string|null, deadline_menit: int|null}>, label: list<array{id: string, nama: string}>}
 */
final class ProjekController extends ControllerData
{
    public function simpan(Request $request): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k): void {
            $this->cekIsian($k, $this->muatData(), null, true);
            $p = Projek::create([
                'nama' => trim($k->teks('nama')),
                'deskripsi' => $k->teks('deskripsi'),
                'warna' => strtolower($k->teks('warna')),
            ]);
            $k->tx->idBaru = $p->id;
        });
    }

    public function ubah(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $p = $this->wajib(Projek::class, $id);
            $data = $this->muatData();
            $this->wajibTerbuka($data, $p, $k);
            $this->cekIsian($k, $data, $p->id, false);
            $ubah = [];
            if ($k->ada('nama')) {
                $ubah['nama'] = trim($k->teks('nama'));
            }
            if ($k->ada('deskripsi')) {
                $ubah['deskripsi'] = $k->teks('deskripsi');
            }
            if ($k->ada('warna')) {
                $ubah['warna'] = strtolower($k->teks('warna'));
            }
            $p->fill($ubah)->save();
        });
    }

    public function hapus(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $p = $this->wajib(Projek::class, $id);
            $this->tolakBila(Dampak::syaratHapusProjek($this->muatData(), $this->baris($p)));
            $this->hapusProjek($p);
        });
    }

    public function selesaiDini(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $p = $this->wajib(Projek::class, $id);
            $data = $this->muatData();
            $this->tolakBila(Dampak::syaratSelesaiDini($data, $this->baris($p), $k->hariIni));
            $d = Dampak::selesaiDini($data, $this->baris($p), $k->hariIni);
            $this->cocokkanDampak($k->mentah('dampak'), $d);
            $this->terapkanDampak($d, $k);
        });
    }

    public function batal(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $p = $this->wajib(Projek::class, $id);
            $data = $this->muatData();
            $this->tolakBila(Dampak::syaratBatalProjek($data, $this->baris($p), $k->hariIni));
            $d = Dampak::batalProjek($data, $this->baris($p), $k->hariIni);
            $this->cocokkanDampak($k->mentah('dampak'), $d);
            $this->terapkanDampak($d, $k);
            if ($d['projek_menjadi'] === 'dihapus') {
                foreach (Sesi::query()->where('projek_id', $p->id)->get() as $s) {
                    $s->delete();
                }
                $this->hapusProjek($p);
            } else {
                $p->fill(['batal' => true])->save();
            }
        });
    }

    public function bukaKembali(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $p = $this->wajib(Projek::class, $id);
            $data = $this->muatData();
            $st = Dampak::statusProjek($data, $this->baris($p), $k->hariIni);
            $this->tolakBila(Status::projekTertutup($st) ? null : 'Hanya projek selesai atau batal yang bisa dibuka kembali.');

            $sesi = $k->mentah('sesi');
            $sesi = is_array($sesi) ? $sesi : [];
            $isian = [
                'nama' => trim(is_string($sesi['nama'] ?? null) ? $sesi['nama'] : ''),
                'mulai' => is_string($sesi['mulai'] ?? null) ? $sesi['mulai'] : '',
                'akhir' => is_string($sesi['akhir'] ?? null) ? $sesi['akhir'] : '',
                'deskripsi' => is_string($sesi['deskripsi'] ?? null) ? $sesi['deskripsi'] : '',
            ];
            $g = AturanProjek::validasiSesi($isian, $this->sesiProjek($data, $p->id), $k->hariIni, null, true);
            $warna = $k->teks('warna') !== '' ? strtolower($k->teks('warna')) : $p->warna;
            if (! in_array($warna, AturanProjek::PALET, true)) {
                $g['warna'] = 'Pilih warna dari palet.';
            } elseif (in_array($warna, AturanProjek::warnaTerpakai($data, $k->hariIni, $p->id), true)) {
                $g['umum'] ??= 'Warna lama sedang dipakai projek lain. Pilih warna baru.';
            }
            $this->gagalBila($g);

            $p->fill(['batal' => false, 'warna' => $warna])->save();
            Sesi::create(['projek_id' => $p->id] + $isian);
        });
    }

    public function simpanDokumen(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $p = $this->wajib(Projek::class, $id);
            $this->wajibTerbuka($this->muatData(), $p, $k);
            if (Dokumen::query()->where('projek_id', $p->id)->count() >= AturanProjek::DOKUMEN_MAX) {
                throw GalatDomain::aturan('Maksimal '.AturanProjek::DOKUMEN_MAX.' dokumen per projek.');
            }
            [$nama, $url] = $this->isianDokumen($k);
            $k->tx->idBaru = Dokumen::create(['projek_id' => $p->id, 'nama' => $nama, 'url' => $url])->id;
        });
    }

    public function ubahDokumen(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $d = $this->wajib(Dokumen::class, $id);
            $this->wajibTerbuka($this->muatData(), $this->wajib(Projek::class, $d->projek_id), $k);
            [$nama, $url] = $this->isianDokumen($k);
            $d->fill(['nama' => $nama, 'url' => $url])->save();
        });
    }

    public function hapusDokumen(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $d = $this->wajib(Dokumen::class, $id);
            $this->wajibTerbuka($this->muatData(), $this->wajib(Projek::class, $d->projek_id), $k);
            $d->delete();
        });
    }

    public function simpanSesi(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $p = $this->wajib(Projek::class, $id);
            $data = $this->muatData();
            $this->wajibTerbuka($data, $p, $k);
            $isian = $this->isianSesi($k);
            $this->gagalBila(AturanProjek::validasiSesi($isian, $this->sesiProjek($data, $p->id), $k->hariIni, null, true));
            $k->tx->idBaru = Sesi::create(['projek_id' => $p->id] + $isian)->id;
        });
    }

    public function ubahSesi(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $s = $this->wajib(Sesi::class, $id);
            $p = $this->wajib(Projek::class, $s->projek_id);
            $data = $this->muatData();
            $this->wajibTerbuka($data, $p, $k);
            $this->tolakBila($s->batal ? 'Sesi batal hanya bisa dilihat.' : null);
            $isian = $this->isianSesi($k);
            $baris = $this->barisSesi($s);
            $periodeBerubah = $isian['mulai'] !== $baris['mulai'] || $isian['akhir'] !== $baris['akhir'];
            if ($periodeBerubah) {
                $this->tolakBila(Dampak::syaratUbahPeriode($baris, $k->hariIni));
            }
            $this->gagalBila(AturanProjek::validasiSesi($isian, $this->sesiProjek($data, $p->id), $k->hariIni, $s->id, $periodeBerubah));
            if ($periodeBerubah) {
                $d = Dampak::ubahPeriode($data, $this->baris($p), $baris, $isian['mulai'], $isian['akhir'], $k->hariIni);
                if ($d['task_di_luar_periode'] !== [] || $d['projek_menjadi'] === 'selesai') {
                    $this->cocokkanDampak($k->mentah('dampak'), $d);
                }
                $this->terapkanDampak($d, $k);
            }
            $s->fill($isian)->save();
        });
    }

    public function batalSesi(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $s = $this->wajib(Sesi::class, $id);
            $p = $this->wajib(Projek::class, $s->projek_id);
            $data = $this->muatData();
            $this->wajibTerbuka($data, $p, $k);
            $this->tolakBila(Dampak::syaratBatalSesi($this->barisSesi($s), $k->hariIni));
            $d = Dampak::batalSesi($data, $this->baris($p), $this->barisSesi($s), $k->hariIni);
            $this->cocokkanDampak($k->mentah('dampak'), $d);
            $this->terapkanDampak($d, $k);
        });
    }

    public function hapusSesi(Request $request, string $id): JsonResponse
    {
        return $this->aksi($request, function (Konteks $k) use ($id): void {
            $s = $this->wajib(Sesi::class, $id);
            $p = $this->wajib(Projek::class, $s->projek_id);
            $data = $this->muatData();
            $this->wajibTerbuka($data, $p, $k);
            $this->tolakBila(Dampak::syaratHapusSesi($data, $this->barisSesi($s), $k->hariIni));
            $d = Dampak::hapusSesi($data, $this->baris($p), $this->barisSesi($s), $k->hariIni);
            $this->cocokkanDampak($k->mentah('dampak'), $d);
            $this->terapkanDampak($d, $k);
        });
    }

    /** @return array{id: string, batal: bool} */
    private function baris(Projek $p): array
    {
        return ['id' => $p->id, 'batal' => $p->batal];
    }

    /** @return array{id: string, projek_id: string, nama: string, mulai: string, akhir: string, batal: bool} */
    private function barisSesi(Sesi $s): array
    {
        /** @var array{id: string, projek_id: string, nama: string, mulai: string, akhir: string, batal: bool} */
        return array_intersect_key($s->toArray(), array_flip(['id', 'projek_id', 'nama', 'mulai', 'akhir', 'batal']));
    }

    /**
     * @param  DataMuat  $data
     * @return list<array{id: string, projek_id: string, nama: string, mulai: string, akhir: string, batal: bool}>
     */
    private function sesiProjek(array $data, string $projekId): array
    {
        return array_values(array_filter($data['sesi'], fn (array $s): bool => $s['projek_id'] === $projekId));
    }

    /** @param  DataMuat  $data */
    private function wajibTerbuka(array $data, Projek $p, Konteks $k): void
    {
        if (Status::projekTertutup(Dampak::statusProjek($data, $this->baris($p), $k->hariIni))) {
            throw GalatDomain::aturan('Projek tertutup terkunci. Buka kembali dulu.');
        }
    }

    /** @param  DataMuat  $data */
    private function cekIsian(Konteks $k, array $data, ?string $kecualiId, bool $baru): void
    {
        $g = [];
        if ($baru || $k->ada('nama')) {
            $galat = AturanProjek::validasiNama($k->teks('nama'), $data['projek'], $data['label'], $kecualiId);
            if ($galat !== null) {
                $g['nama'] = $galat;
            }
        }
        if (mb_strlen($k->teks('deskripsi')) > AturanProjek::DESKRIPSI_MAX) {
            $g['deskripsi'] = 'Deskripsi maksimal '.AturanProjek::DESKRIPSI_MAX.' karakter.';
        }
        if ($baru || $k->ada('warna')) {
            $w = strtolower($k->teks('warna'));
            if (! in_array($w, AturanProjek::PALET, true)) {
                $g['warna'] = 'Pilih warna dari palet.';
            } elseif (in_array($w, AturanProjek::warnaTerpakai($data, $k->hariIni, $kecualiId), true)) {
                $g['warna'] = 'Warna ini dipakai projek lain yang belum tertutup.';
            }
        }
        $this->gagalBila($g);
    }

    /** @return array{nama: string, mulai: string, akhir: string, deskripsi: string} */
    private function isianSesi(Konteks $k): array
    {
        return ['nama' => trim($k->teks('nama')), 'mulai' => $k->teks('mulai'), 'akhir' => $k->teks('akhir'), 'deskripsi' => $k->teks('deskripsi')];
    }

    /** @return array{0: string, 1: string} */
    private function isianDokumen(Konteks $k): array
    {
        $nama = trim($k->teks('nama'));
        $url = AturanProjek::rapikanUrl($k->teks('url'));
        $g = [];
        if ($nama === '') {
            $g['nama'] = 'Nama dokumen wajib diisi.';
        } elseif (mb_strlen($nama) > 100) {
            $g['nama'] = 'Nama dokumen maksimal 100 karakter.';
        }
        if ($url === null || strlen($url) > 2048) {
            $g['url'] = 'Tautan harus berupa alamat web yang valid (http atau https).';
        }
        $this->gagalBila($g);

        return [$nama, (string) $url];
    }

    private function hapusProjek(Projek $p): void
    {
        foreach (Dokumen::query()->where('projek_id', $p->id)->get() as $d) {
            $d->delete();
        }
        $p->delete();
    }
}
