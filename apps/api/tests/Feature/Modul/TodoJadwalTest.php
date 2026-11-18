<?php

declare(strict_types=1);

use App\Models\Akun;
use App\Models\JadwalVersi;
use App\Models\LabelMandiri;
use Illuminate\Support\Str;

// Kontrak apps/web/src/api/todo.ts dan jadwal.ts; hari ini Rabu 18 Nov 2026 pukul 10.00 WIB.

beforeEach(function () {
    $this->travelTo(new DateTimeImmutable('2026-11-18T03:00:00Z'));
    $this->actingAs(Akun::factory()->create());
    $this->task = $this->buat('/api/task', ['label_baru' => 'Rumah', 'nama' => 'Cuci', 'deskripsi' => '', 'deadline_tanggal' => '', 'deadline_menit' => null, 'kesulitan' => 1]);
});

function jadwal(array $lain = []): array
{
    return $lain + ['nama' => 'Kuliah', 'mulai' => 480, 'selesai' => 600, 'sekaliJalan' => false, 'hari' => [3, 1], 'tanggal' => '2026-11-18', 'berakhir' => null];
}

it('entri idempoten pada id klien, tidak untuk hari lewat, satu per task per hari', function () {
    $id = (string) Str::uuid();
    $this->mutasi('POST', '/api/entri', ['id' => $id, 'task_id' => $this->task, 'tanggal' => '2026-11-18'])->assertOk()->assertJsonPath('id', $id);
    $this->mutasi('POST', '/api/entri', ['id' => $id, 'task_id' => $this->task, 'tanggal' => '2026-11-18'])
        ->assertOk()->assertJsonPath('ubah', []);

    $this->mutasi('POST', '/api/entri', ['id' => (string) Str::uuid(), 'task_id' => $this->task, 'tanggal' => '2026-11-18'])
        ->assertJsonPath('pesan', 'Task ini sudah ada di to-do hari itu.');
    $this->mutasi('POST', '/api/entri', ['id' => (string) Str::uuid(), 'task_id' => $this->task, 'tanggal' => '2026-11-17'])
        ->assertJsonPath('pesan', 'Hari yang sudah lewat tidak bisa diubah.');

    $this->mutasi('PUT', "/api/entri/{$id}/ceklis", ['ceklis' => true])->assertOk()->assertJsonPath('ubah.entri_todo.0.ceklis', true);
});

it('blok: kelipatan 5 menit, tidak bentrok dengan blok lain atau Jadwal', function () {
    $this->buat('/api/jadwal', jadwal());
    $entri = $this->buat('/api/entri', ['id' => (string) Str::uuid(), 'task_id' => $this->task, 'tanggal' => '2026-11-18']);

    $this->mutasi('POST', "/api/entri/{$entri}/blok", ['mulai_menit' => 570, 'selesai_menit' => 630])
        ->assertStatus(422)
        ->assertJsonPath('kolom', 'mulai_menit')
        ->assertJsonPath('pesan', 'Bentrok dengan Jadwal “Kuliah” (08.00–10.00).');
    $this->mutasi('POST', "/api/entri/{$entri}/blok", ['mulai_menit' => 602, 'selesai_menit' => 660])->assertJsonPath('pesan', 'Jam harus kelipatan 5 menit.');

    $blok = $this->buat("/api/entri/{$entri}/blok", ['mulai_menit' => 600, 'selesai_menit' => 660]);
    $this->mutasi('POST', "/api/entri/{$entri}/blok", ['mulai_menit' => 630, 'selesai_menit' => 700])
        ->assertJsonPath('pesan', 'Bentrok dengan blok lain (10.00–11.00).');
    $this->mutasi('PATCH', "/api/blok/{$blok}", ['mulai_menit' => 615, 'selesai_menit' => 675])->assertOk();

    $this->mutasi('DELETE', "/api/entri/{$entri}")
        ->assertOk()->assertJsonPath('hapus', [['tabel' => 'blok_jam', 'id' => $blok], ['tabel' => 'entri_todo', 'id' => $entri]]);
});

it('Jadwal baru menyimpan versi dengan hari terurut', function () {
    $this->mutasi('POST', '/api/jadwal', jadwal())
        ->assertOk()
        ->assertJsonPath('ubah.jadwal.0.nama', 'Kuliah')
        ->assertJsonPath('ubah.jadwal_versi.0', fn (array $v) => $v['hari'] === [1, 3] && $v['berlaku_akhir'] === null);

    $this->mutasi('POST', '/api/jadwal', jadwal(['mulai' => 300, 'hari' => []]))
        ->assertJsonPath('rincian', ['jam' => 'Jam harus di antara 06.00 dan 24.00.', 'hari' => 'Pilih minimal satu hari.']);
});

it('ubah Jadwal yang pernah berlaku memotong versi lama dan menambah versi baru', function () {
    $this->travelTo(new DateTimeImmutable('2026-11-01T03:00:00Z'));
    $this->actingAs(Akun::factory()->create());
    $j = $this->buat('/api/jadwal', jadwal(['tanggal' => '2026-11-02']));
    $this->travelTo(new DateTimeImmutable('2026-11-18T03:00:00Z'));

    $this->mutasi('PATCH', "/api/jadwal/{$j}", jadwal(['mulai' => 540, 'selesai' => 660, 'tanggal' => '2026-11-20']))->assertOk();
    expect(JadwalVersi::query()->orderBy('berlaku_mulai')->get(['berlaku_mulai', 'berlaku_akhir', 'mulai_menit'])->toArray())->toBe([
        ['berlaku_mulai' => '2026-11-02', 'berlaku_akhir' => '2026-11-19', 'mulai_menit' => 480],
        ['berlaku_mulai' => '2026-11-20', 'berlaku_akhir' => null, 'mulai_menit' => 540],
    ]);

    $this->mutasi('DELETE', "/api/jadwal/{$j}")->assertJsonPath('pesan', 'Jadwal yang pernah berlaku tidak bisa dihapus. Pakai Akhiri.');
    $this->mutasi('POST', "/api/jadwal/{$j}/akhiri", ['tanggal' => '2026-12-31'])->assertOk()->assertJsonPath('ubah.jadwal_versi.0.berlaku_akhir', '2026-12-31');
});

it('Jadwal yang belum pernah berlaku diganti langsung dan bisa dihapus beserta pengecualiannya', function () {
    $j = $this->buat('/api/jadwal', jadwal(['tanggal' => '2026-11-20']));
    $this->mutasi('PATCH', "/api/jadwal/{$j}", jadwal(['nama' => 'Kuliah Pagi', 'tanggal' => '2026-11-21']))->assertOk();
    expect(JadwalVersi::count())->toBe(1);

    $x = $this->buat('/api/pengecualian', ['jadwal_id' => $j, 'mulai' => '2026-12-24', 'akhir' => '2026-12-26', 'keterangan' => str_repeat('a', 120)]);
    $this->mutasi('POST', '/api/pengecualian', ['jadwal_id' => null, 'mulai' => '2026-12-26', 'akhir' => '2026-12-24', 'keterangan' => ''])
        ->assertJsonPath('rincian.akhir', 'Tanggal akhir harus pada atau setelah tanggal awal.');

    $this->mutasi('DELETE', "/api/jadwal/{$j}")->assertOk()->assertJsonCount(3, 'hapus')->assertJsonFragment(['tabel' => 'pengecualian', 'id' => $x]);
});

it('pola kerja menghitung task dibuat, selesai, dan rasio dikerjakan', function () {
    $this->travelTo(new DateTimeImmutable('2026-11-16T03:00:00Z'));
    $this->actingAs(Akun::factory()->create());
    $cuci = $this->buat('/api/task', ['label_baru' => 'Rumah', 'nama' => 'Cuci', 'deskripsi' => '', 'deadline_tanggal' => '', 'deadline_menit' => null, 'kesulitan' => 1]);
    $t = $this->buat('/api/task', ['label_baru' => 'Kos', 'nama' => 'Bayar', 'deskripsi' => '', 'deadline_tanggal' => '', 'deadline_menit' => null, 'kesulitan' => 2]);
    $this->buat('/api/entri', ['id' => (string) Str::uuid(), 'task_id' => $t, 'tanggal' => '2026-11-16']);
    $this->buat('/api/entri', ['id' => (string) Str::uuid(), 'task_id' => $cuci, 'tanggal' => '2026-11-17']);
    $this->mutasi('POST', "/api/task/{$t}/progress", ['nilai' => 10, 'deskripsi' => '', 'dampak' => null])->assertOk();
    $this->travelTo(new DateTimeImmutable('2026-11-18T03:00:00Z'));

    $this->getJson('/api/pola-kerja?dari=2026-11-16&sampai=2026-11-30')
        ->assertOk()
        ->assertJson([
            'dari' => '2026-11-16',
            'sampai' => '2026-11-18',
            'granularitas' => 'hari',
            'dibuat' => 2,
            'selesai' => 1,
            'batal' => 0,
            'dikerjakan' => 1,
            'tidak_dikerjakan' => 1,
        ])
        ->assertJsonPath('seri.0', ['label' => '16 Nov', 'mulai' => '2026-11-16', 'akhir' => '2026-11-16', 'selesai' => 1]);

    $this->getJson('/api/pola-kerja?dari=2026-11-20&sampai=2026-11-10')->assertStatus(422);
});

it('setiap rute ber-id menjawab 404 untuk data akun lain (N-39, N-61)', function () {
    $p = $this->buat('/api/projek', ['nama' => 'Skripsi', 'warna' => '#2e8b7a']);
    $s = $this->buat("/api/projek/{$p}/sesi", ['nama' => 'S', 'mulai' => '2026-11-20', 'akhir' => '2026-11-30', 'deskripsi' => '']);
    $d = $this->buat("/api/projek/{$p}/dokumen", ['nama' => 'D', 'url' => 'https://contoh.id']);
    $e = $this->buat('/api/entri', ['id' => (string) Str::uuid(), 'task_id' => $this->task, 'tanggal' => '2026-11-18']);
    $b = $this->buat("/api/entri/{$e}/blok", ['mulai_menit' => 600, 'selesai_menit' => 660]);
    $j = $this->buat('/api/jadwal', jadwal(['tanggal' => '2026-11-25']));
    $x = $this->buat('/api/pengecualian', ['jadwal_id' => null, 'mulai' => '2026-12-01', 'akhir' => '2026-12-01', 'keterangan' => '']);
    $l = LabelMandiri::query()->value('id');
    $t = $this->task;

    $rute = [
        ['PATCH', "/api/projek/{$p}"], ['DELETE', "/api/projek/{$p}"], ['POST', "/api/projek/{$p}/selesai-dini"],
        ['POST', "/api/projek/{$p}/batal"], ['POST', "/api/projek/{$p}/buka-kembali"], ['POST', "/api/projek/{$p}/dokumen"],
        ['PATCH', "/api/dokumen/{$d}"], ['DELETE', "/api/dokumen/{$d}"], ['POST', "/api/projek/{$p}/sesi"],
        ['PATCH', "/api/sesi/{$s}"], ['POST', "/api/sesi/{$s}/batal"], ['DELETE', "/api/sesi/{$s}"],
        ['PATCH', "/api/task/{$t}"], ['POST', "/api/task/{$t}/pindah"], ['POST', "/api/task/{$t}/progress"],
        ['POST', "/api/task/{$t}/batal"], ['POST', "/api/task/{$t}/buka-kembali"], ['PATCH', "/api/label/{$l}"],
        ['DELETE', "/api/label/{$l}"], ['DELETE', "/api/entri/{$e}"], ['PUT', "/api/entri/{$e}/ceklis"],
        ['POST', "/api/entri/{$e}/blok"], ['PATCH', "/api/blok/{$b}"], ['DELETE', "/api/blok/{$b}"],
        ['PATCH', "/api/jadwal/{$j}"], ['POST', "/api/jadwal/{$j}/akhiri"], ['DELETE', "/api/jadwal/{$j}"],
        ['DELETE', "/api/pengecualian/{$x}"],
    ];

    $this->actingAs(Akun::factory()->create());
    foreach ($rute as [$metode, $url]) {
        $this->mutasi($metode, $url, ['nama' => 'X'])->assertNotFound();
    }
    $this->mutasi('POST', '/api/entri', ['id' => (string) Str::uuid(), 'task_id' => $t, 'tanggal' => '2026-11-19'])->assertNotFound();
});
