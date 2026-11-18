<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Akun;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;

/**
 * Satu aksi pengubah = satu transaksi (AD-3, N-01).
 * Pernyataan pertama menaikkan akun.revisi: sekaligus kunci per akun, nomor versi,
 * dan kursor sinkron. If-Match harus sama dengan revisi sebelum aksi.
 */
final class Transaksi
{
    private static ?self $aktif = null;

    /** @var array<string, array<string, Model>> */
    private array $ubah = [];

    /** @var array<string, array{tabel: string, id: string}> */
    private array $hapus = [];

    /** @var list<string> */
    public array $peringatan = [];

    /** Id baris baru yang dibuat aksi ini, dikembalikan sebagai `id`. */
    public ?string $idBaru = null;

    private function __construct(
        public readonly Akun $akun,
        public readonly int $revisi,
        public readonly int $revisiSebelum,
    ) {}

    public static function aktif(): ?self
    {
        return self::$aktif;
    }

    /**
     * @param  callable(self): void  $aksi
     * @return array{revisi: int, revisi_sebelum: int, ubah: object, hapus: list<array{tabel: string, id: string}>, peringatan: list<string>, id?: string}
     */
    public static function jalankan(Akun $akun, ?string $ifMatch, callable $aksi): array
    {
        return DB::transaction(function () use ($akun, $ifMatch, $aksi): array {
            $baris = DB::selectOne('UPDATE akun SET revisi = revisi + 1 WHERE id = ? RETURNING revisi', [$akun->getKey()]);
            $revisi = (int) $baris->revisi;
            $sebelum = $revisi - 1;

            if ($ifMatch === null || trim($ifMatch, ' "') !== (string) $sebelum) {
                throw GalatDomain::versiKonflik();
            }

            $akun->setAttribute('revisi', $revisi);
            $transaksi = new self($akun, $revisi, $sebelum);
            self::$aktif = $transaksi;
            try {
                $aksi($transaksi);
            } finally {
                self::$aktif = null;
            }

            return $transaksi->respons();
        });
    }

    public function catatUbah(Model $model): void
    {
        $this->ubah[$model->getTable()][(string) $model->getKey()] = $model;
    }

    public function catatHapus(Model $model): void
    {
        $tabel = $model->getTable();
        $id = (string) $model->getKey();
        unset($this->ubah[$tabel][$id]);
        $this->hapus["{$tabel}:{$id}"] = ['tabel' => $tabel, 'id' => $id];

        DB::table('penghapusan')->insert([
            'akun_id' => $this->akun->getKey(),
            'tabel' => $tabel,
            'baris_id' => $id,
            'revisi' => $this->revisi,
            'dibuat_pada' => Date::now(),
        ]);
    }

    /** @return array{revisi: int, revisi_sebelum: int, ubah: object, hapus: list<array{tabel: string, id: string}>, peringatan: list<string>, id?: string} */
    private function respons(): array
    {
        $ubah = [];
        foreach (array_keys(Tabel::MODEL) as $tabel) {
            if (! empty($this->ubah[$tabel])) {
                // Muat ulang agar nilai default dan hasil trigger database ikut terkirim.
                $ubah[$tabel] = array_values(array_map(fn (Model $m): array => $m->refresh()->toArray(), $this->ubah[$tabel]));
            }
        }

        $hasil = [
            'revisi' => $this->revisi,
            'revisi_sebelum' => $this->revisiSebelum,
            'ubah' => (object) $ubah,
            'hapus' => array_values($this->hapus),
            'peringatan' => $this->peringatan,
        ];
        if ($this->idBaru !== null) {
            $hasil['id'] = $this->idBaru;
        }

        return $hasil;
    }
}
