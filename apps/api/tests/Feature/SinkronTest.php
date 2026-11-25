<?php

declare(strict_types=1);

use App\Models\Akun;
use App\Models\Jadwal;
use App\Models\JadwalVersi;
use App\Models\Projek;
use App\Support\Transaksi;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

// GET /api/sinkron (7.3): penuh atau delta, tombstone, meta hari_ini di zona akun.

beforeEach(function () {
    $this->akun = Akun::factory()->create(['zona_waktu' => 'Asia/Jakarta']);
    $this->actingAs($this->akun);
});

function aksi(Akun $akun, callable $isi): array
{
    return Transaksi::jalankan($akun, (string) $akun->fresh()->revisi, $isi);
}

it('akun baru: sinkron penuh yang kosong', function () {
    $this->travelTo(new DateTimeImmutable('2026-11-18T18:00:00Z'));
    $this->akun->forceFill(['created_at' => '2026-11-18T17:30:00Z'])->save();

    $this->getJson('/api/sinkron?sejak=0')
        ->assertOk()
        ->assertExactJson([
            'revisi' => 1,
            'penuh' => true,
            'ubah' => [],
            'hapus' => [],
            'meta' => ['hari_ini' => '2026-11-19', 'zona_waktu' => 'Asia/Jakarta', 'akun_dibuat' => '2026-11-19'],
        ]);
});

it('delta hanya berisi baris dan tombstone setelah kursor', function () {
    $a = aksi($this->akun, fn (Transaksi $t) => $t->idBaru = Projek::create(['nama' => 'A', 'warna' => '#2e8b7a'])->id)['id'];
    $b = aksi($this->akun, fn (Transaksi $t) => $t->idBaru = Projek::create(['nama' => 'B', 'warna' => '#4a8a3c'])->id)['id'];
    aksi($this->akun, fn () => Projek::findOrFail($a)->delete());

    $respons = $this->getJson('/api/sinkron?sejak=2')->assertOk();
    expect($respons->json('revisi'))->toBe(4)
        ->and($respons->json('penuh'))->toBeFalse()
        ->and($respons->json('ubah.projek.*.id'))->toBe([$b])
        ->and($respons->json('hapus'))->toBe([['tabel' => 'projek', 'id' => $a]]);

    $penuh = $this->getJson('/api/sinkron?sejak=0')->json();
    expect(array_column($penuh['ubah']['projek'], 'id'))->toBe([$b])->and($penuh['hapus'])->toBe([]);
});

it('kursor di depan server atau lebih tua dari tombstone yang dipangkas memicu sinkron penuh', function () {
    $id = aksi($this->akun, fn (Transaksi $t) => $t->idBaru = Projek::create(['nama' => 'A', 'warna' => '#2e8b7a'])->id)['id'];
    aksi($this->akun, fn () => Projek::findOrFail($id)->delete());

    expect($this->getJson('/api/sinkron?sejak=99')->json('penuh'))->toBeTrue();
    expect($this->getJson('/api/sinkron?sejak=1')->json('penuh'))->toBeFalse();

    $this->travel(91)->days();
    Artisan::call('penghapusan:pangkas');

    expect(DB::table('penghapusan')->count())->toBe(0)
        ->and($this->getJson('/api/sinkron?sejak=1')->json('penuh'))->toBeTrue()
        ->and($this->getJson('/api/sinkron?sejak=3')->json('penuh'))->toBeFalse();
});

it('baris dikirim dalam bentuk snapshot klien', function () {
    aksi($this->akun, function () {
        $j = Jadwal::create(['nama' => 'Kuliah']);
        JadwalVersi::create([
            'jadwal_id' => $j->id, 'hari' => [3, 1], 'mulai_menit' => 480, 'selesai_menit' => 600,
            'berlaku_mulai' => '2026-11-18', 'berlaku_akhir' => null, 'sekali_jalan' => false,
        ]);
    });

    $versi = $this->getJson('/api/sinkron?sejak=0')->json('ubah.jadwal_versi.0');
    expect($versi)->toMatchArray([
        'hari' => [3, 1],
        'berlaku_mulai' => '2026-11-18',
        'berlaku_akhir' => null,
        'sekali_jalan' => false,
        'versi' => 2,
    ])->not->toHaveKey('akun_id');
});

it('hari ini tidak mundur walau jam server mundur', function () {
    $this->travelTo(new DateTimeImmutable('2026-11-20T03:00:00Z'));
    $this->getJson('/api/sinkron')->assertJsonPath('meta.hari_ini', '2026-11-20');

    $this->travelTo(new DateTimeImmutable('2026-11-18T03:00:00Z'));
    $this->getJson('/api/sinkron')->assertJsonPath('meta.hari_ini', '2026-11-20');
});
