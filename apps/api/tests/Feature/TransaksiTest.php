<?php

declare(strict_types=1);

use App\Models\Akun;
use App\Models\Projek;
use App\Support\GalatDomain;
use App\Support\Transaksi;
use Illuminate\Support\Facades\DB;

// AD-3: satu aksi = satu transaksi yang menaikkan revisi akun; If-Match = revisi sebelum aksi.

function buatProjek(Akun $akun, string $nama = 'Skripsi', ?string $ifMatch = null): array
{
    return Transaksi::jalankan($akun, $ifMatch ?? (string) $akun->fresh()->revisi, function (Transaksi $t) use ($nama) {
        $p = Projek::create(['nama' => $nama, 'warna' => '#2e8b7a']);
        $t->idBaru = $p->id;
    });
}

beforeEach(function () {
    $this->akun = Akun::factory()->create();
    $this->actingAs($this->akun);
});

it('aksi menaikkan revisi dan mengembalikan baris yang berubah', function () {
    $hasil = buatProjek($this->akun);

    expect($hasil['revisi'])->toBe(2)
        ->and($hasil['revisi_sebelum'])->toBe(1)
        ->and($hasil['hapus'])->toBe([])
        ->and($hasil['peringatan'])->toBe([])
        ->and($hasil['id'])->toBeString();

    $baris = $hasil['ubah']->projek[0];
    expect($baris)->toBe([
        'id' => $hasil['id'],
        'versi' => 2,
        'nama' => 'Skripsi',
        'deskripsi' => '',
        'warna' => '#2e8b7a',
        'batal' => false,
    ]);
    expect($this->akun->fresh()->revisi)->toBe(2);
});

it('If-Match yang tidak sama ditolak versi_konflik dan tidak mengubah apa pun', function () {
    expect(fn () => buatProjek($this->akun, ifMatch: '7'))
        ->toThrow(fn (GalatDomain $e) => expect($e->kode)->toBe('versi_konflik'));
    expect(fn () => Transaksi::jalankan($this->akun, null, fn () => null))->toThrow(GalatDomain::class);

    expect($this->akun->fresh()->revisi)->toBe(1)
        ->and(Projek::count())->toBe(0);
});

it('galat di tengah aksi membatalkan seluruh transaksi', function () {
    expect(fn () => Transaksi::jalankan($this->akun, '1', function () {
        Projek::create(['nama' => 'A', 'warna' => '#2e8b7a']);
        throw GalatDomain::aturan('Gagal.');
    }))->toThrow(GalatDomain::class);

    expect($this->akun->fresh()->revisi)->toBe(1)->and(Projek::count())->toBe(0);
});

it('hapus mencatat tombstone dengan revisi aksi', function () {
    $id = buatProjek($this->akun)['id'];

    $hasil = Transaksi::jalankan($this->akun, '2', fn () => Projek::findOrFail($id)->delete());

    expect($hasil['hapus'])->toBe([['tabel' => 'projek', 'id' => $id]])
        ->and((array) $hasil['ubah'])->toBe([])
        ->and(DB::table('penghapusan')->where('baris_id', $id)->value('revisi'))->toBe(3);
});

it('penulisan di luar Transaksi ditolak', function () {
    expect(fn () => Projek::create(['nama' => 'Liar', 'warna' => '#2e8b7a']))->toThrow(LogicException::class);
});

it('akun lain tidak melihat data akun ini (S-3)', function () {
    $id = buatProjek($this->akun)['id'];
    $lain = Akun::factory()->create();
    $this->actingAs($lain);

    expect(Projek::find($id))->toBeNull()->and(Projek::count())->toBe(0);
});
