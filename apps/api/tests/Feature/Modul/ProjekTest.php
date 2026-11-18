<?php

declare(strict_types=1);

use App\Models\Akun;
use App\Models\Projek;
use App\Models\Sesi;
use Illuminate\Support\Facades\DB;

// Kontrak apps/web/src/api/projek.ts; hari ini dibekukan 18 Nov 2026 pukul 10.00 WIB.

beforeEach(function () {
    $this->travelTo(new DateTimeImmutable('2026-11-18T03:00:00Z'));
    $this->akun = Akun::factory()->create();
    $this->actingAs($this->akun);
});

function projekBaru(object $t, string $nama = 'Skripsi', string $warna = '#2e8b7a'): string
{
    return $t->buat('/api/projek', ['nama' => $nama, 'deskripsi' => '', 'warna' => $warna]);
}

function sesiBaru(object $t, string $projek, string $mulai, string $akhir, string $nama = 'Sesi'): string
{
    return $t->buat("/api/projek/{$projek}/sesi", ['nama' => $nama, 'mulai' => $mulai, 'akhir' => $akhir, 'deskripsi' => '']);
}

it('membuat projek dan mengembalikan baris serta id', function () {
    $respons = $this->mutasi('POST', '/api/projek', ['nama' => ' Skripsi ', 'deskripsi' => 'Bab 1', 'warna' => '#2E8B7A'])->assertOk();

    expect($respons->json('revisi'))->toBe(2)
        ->and($respons->json('revisi_sebelum'))->toBe(1)
        ->and($respons->json('ubah.projek.0'))->toMatchArray(['nama' => 'Skripsi', 'warna' => '#2e8b7a', 'batal' => false, 'versi' => 2])
        ->and($respons->json('id'))->toBe($respons->json('ubah.projek.0.id'));
});

it('If-Match usang ditolak versi_konflik', function () {
    $this->json('POST', '/api/projek', ['nama' => 'A', 'warna' => '#2e8b7a'], ['If-Match' => '9'])
        ->assertStatus(409)->assertJsonPath('kode', 'versi_konflik');
    $this->postJson('/api/projek', ['nama' => 'A', 'warna' => '#2e8b7a'])->assertStatus(409);
});

it('nama unik, bukan "Mandiri", dan warna dari palet yang belum dipakai', function () {
    projekBaru($this);

    $this->mutasi('POST', '/api/projek', ['nama' => 'skripsi', 'warna' => '#4a8a3c'])
        ->assertStatus(422)->assertJsonPath('rincian.nama', 'Nama sudah dipakai projek “Skripsi”.');
    $this->mutasi('POST', '/api/projek', ['nama' => 'Mandiri', 'warna' => '#4a8a3c'])->assertJsonPath('kolom', 'nama');
    $this->mutasi('POST', '/api/projek', ['nama' => 'Lain', 'warna' => '#2e8b7a'])
        ->assertJsonPath('rincian.warna', 'Warna ini dipakai projek lain yang belum tertutup.');
    $this->mutasi('POST', '/api/projek', ['nama' => 'Lain', 'warna' => '#000000'])->assertJsonPath('rincian.warna', 'Pilih warna dari palet.');
    expect($this->akun->fresh()->revisi)->toBe(2);
});

it('sesi tidak boleh bertumpuk; berbatasan boleh', function () {
    $p = projekBaru($this);
    sesiBaru($this, $p, '2026-11-10', '2026-11-20', 'Bab 1');
    sesiBaru($this, $p, '2026-11-21', '2026-11-30', 'Bab 2');

    $this->mutasi('POST', "/api/projek/{$p}/sesi", ['nama' => 'Bab 3', 'mulai' => '2026-11-25', 'akhir' => '2026-12-05', 'deskripsi' => ''])
        ->assertStatus(422)
        ->assertJsonPath('kolom', 'umum')
        ->assertJsonPath('rincian.umum', fn (string $p) => str_contains($p, '“Bab 2”') && str_contains($p, '1 Des 2026'));
});

it('hapus projek hanya tanpa sesi, dokumennya ikut terhapus', function () {
    $p = projekBaru($this);
    $d = $this->buat("/api/projek/{$p}/dokumen", ['nama' => 'Draf', 'url' => 'docs.google.com/x']);

    $this->mutasi('DELETE', "/api/projek/{$p}")
        ->assertOk()
        ->assertJsonPath('hapus', [['tabel' => 'dokumen', 'id' => $d], ['tabel' => 'projek', 'id' => $p]]);
});

it('dokumen: URL dirapikan, skema selain http/https ditolak, maksimal 10', function () {
    $p = projekBaru($this);
    $this->mutasi('POST', "/api/projek/{$p}/dokumen", ['nama' => 'A', 'url' => 'docs.google.com/abc'])
        ->assertJsonPath('ubah.dokumen.0.url', 'https://docs.google.com/abc');
    $this->mutasi('POST', "/api/projek/{$p}/dokumen", ['nama' => 'B', 'url' => 'javascript:alert(1)'])->assertJsonPath('kolom', 'url');
    foreach (range(2, 10) as $i) {
        $this->buat("/api/projek/{$p}/dokumen", ['nama' => "D{$i}", 'url' => 'http://contoh.id']);
    }
    $this->mutasi('POST', "/api/projek/{$p}/dokumen", ['nama' => 'X', 'url' => 'http://contoh.id'])
        ->assertStatus(422)->assertJsonPath('pesan', 'Maksimal 10 dokumen per projek.');
});

it('batal projek tanpa sesi bertask menghapus projek; dampak yang beda dijawab 409 dengan dampak terkini', function () {
    $p = projekBaru($this);
    $s = sesiBaru($this, $p, '2026-11-25', '2026-11-30');
    $dampak = ['projek_menjadi' => 'dihapus', 'task_batal' => [], 'task_di_luar_periode' => [], 'sesi_dihapus' => [], 'sesi_batal' => [$s], 'sesi_dipotong' => []];

    $this->mutasi('POST', "/api/projek/{$p}/batal", ['dampak' => ['projek_menjadi' => 'batal'] + $dampak])
        ->assertStatus(409)
        ->assertJsonPath('kode', 'dampak_berubah')
        ->assertJsonPath('dampak', $dampak);

    $this->mutasi('POST', "/api/projek/{$p}/batal", ['dampak' => $dampak])->assertOk();
    expect(Projek::count())->toBe(0)->and(Sesi::count())->toBe(0);
});

it('selesai dini memotong sesi berjalan sampai kemarin dan menghapus sesi nanti yang kosong', function () {
    $p = projekBaru($this);
    $jalan = sesiBaru($this, $p, '2026-11-10', '2026-11-30', 'Jalan');
    $nanti = sesiBaru($this, $p, '2026-12-01', '2026-12-10', 'Nanti');
    $dampak = ['projek_menjadi' => 'selesai', 'task_batal' => [], 'task_di_luar_periode' => [], 'sesi_dihapus' => [$nanti], 'sesi_batal' => [], 'sesi_dipotong' => [['id' => $jalan, 'akhir_baru' => '2026-11-17']]];

    $this->mutasi('POST', "/api/projek/{$p}/selesai-dini", ['dampak' => $dampak])
        ->assertOk()
        ->assertJsonPath('ubah.sesi.0.akhir', '2026-11-17')
        ->assertJsonPath('hapus', [['tabel' => 'sesi', 'id' => $nanti]]);

    // Projek selesai kini terkunci, lalu bisa dibuka kembali dengan sesi baru.
    $this->mutasi('PATCH', "/api/projek/{$p}", ['nama' => 'Baru'])->assertStatus(422)->assertJsonPath('pesan', 'Projek tertutup terkunci. Buka kembali dulu.');
    $this->mutasi('POST', "/api/projek/{$p}/buka-kembali", ['sesi' => ['nama' => 'Revisi', 'mulai' => '2026-11-20', 'akhir' => '2026-11-25', 'deskripsi' => ''], 'warna' => null])
        ->assertOk()->assertJsonPath('ubah.sesi.0.nama', 'Revisi');
});

it('ubah periode sesi menolak periode lewat dan menerima rentang baru', function () {
    $p = projekBaru($this);
    $s = sesiBaru($this, $p, '2026-11-20', '2026-11-30');

    $this->mutasi('PATCH', "/api/sesi/{$s}", ['nama' => 'Sesi', 'mulai' => '2026-11-01', 'akhir' => '2026-11-10', 'deskripsi' => '', 'dampak' => null])
        ->assertJsonPath('rincian.akhir', 'Tanggal akhir harus hari ini atau setelahnya.');
    $this->mutasi('PATCH', "/api/sesi/{$s}", ['nama' => 'Sesi', 'mulai' => '2026-11-22', 'akhir' => '2026-12-05', 'deskripsi' => 'x', 'dampak' => null])
        ->assertOk()->assertJsonPath('ubah.sesi.0.akhir', '2026-12-05');
});

it('hapus sesi membaca dampak dari badan DELETE', function () {
    $p = projekBaru($this);
    $s = sesiBaru($this, $p, '2026-11-20', '2026-11-30');
    $dampak = ['projek_menjadi' => 'belum_dijadwalkan', 'task_batal' => [], 'task_di_luar_periode' => [], 'sesi_dihapus' => [$s], 'sesi_batal' => [], 'sesi_dipotong' => []];

    $this->mutasi('DELETE', "/api/sesi/{$s}", ['dampak' => $dampak])->assertOk()->assertJsonPath('hapus.0.id', $s);
});

it('id bukan UUID dan data akun lain dijawab 404', function () {
    $p = projekBaru($this);
    $this->mutasi('PATCH', '/api/projek/bukan-uuid', ['nama' => 'X'])->assertNotFound()->assertJsonPath('kode', 'tidak_ditemukan');

    $this->actingAs(Akun::factory()->create());
    $this->mutasi('PATCH', "/api/projek/{$p}", ['nama' => 'Curian'])->assertNotFound();
    expect(DB::table('projek')->value('nama'))->toBe('Skripsi');
});
