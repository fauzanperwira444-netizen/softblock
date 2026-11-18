<?php

declare(strict_types=1);

use App\Models\Akun;
use App\Models\EntriTodo;
use App\Models\LabelMandiri;
use App\Models\RiwayatProgress;

// Kontrak apps/web/src/api/task.ts; hari ini 18 Nov 2026 pukul 10.00 WIB.

beforeEach(function () {
    $this->travelTo(new DateTimeImmutable('2026-11-18T03:00:00Z'));
    $this->actingAs(Akun::factory()->create());
    $this->projek = $this->buat('/api/projek', ['nama' => 'Skripsi', 'warna' => '#2e8b7a']);
    $this->sesi = $this->buat("/api/projek/{$this->projek}/sesi", ['nama' => 'Bab 1', 'mulai' => '2026-11-10', 'akhir' => '2026-11-30', 'deskripsi' => '']);
});

function isianTask(array $lain = []): array
{
    return $lain + ['nama' => 'Tulis bab', 'deskripsi' => '', 'deadline_tanggal' => '2026-11-25', 'deadline_menit' => null, 'kesulitan' => 3];
}

function dampakSelesai(array $taskBatal = []): array
{
    return ['projek_menjadi' => 'selesai', 'task_batal' => $taskBatal, 'task_di_luar_periode' => [], 'sesi_dihapus' => [], 'sesi_batal' => [], 'sesi_dipotong' => []];
}

it('task sesi wajib deadline di dalam periode sesi', function () {
    $this->mutasi('POST', '/api/task', isianTask(['sesi_id' => $this->sesi, 'deadline_tanggal' => '']))
        ->assertStatus(422)->assertJsonPath('rincian.deadline_tanggal', 'Deadline wajib untuk task di sesi.');
    $this->mutasi('POST', '/api/task', isianTask(['sesi_id' => $this->sesi, 'deadline_tanggal' => '2026-12-05']))
        ->assertJsonPath('rincian.deadline_tanggal', 'Pilih tanggal dalam periode sesi (10 Nov 2026 – 30 Nov 2026).');
    $this->mutasi('POST', '/api/task', isianTask(['sesi_id' => $this->sesi, 'deadline_tanggal' => '2026-11-18', 'deadline_menit' => 540]))
        ->assertJsonPath('rincian.deadline_menit', 'Jam itu sudah lewat.');

    $this->mutasi('POST', '/api/task', isianTask(['sesi_id' => $this->sesi, 'deadline_menit' => 1020]))
        ->assertOk()
        ->assertJsonPath('ubah.task.0', fn (array $t) => $t['progress'] === 0 && $t['deadline_menit'] === 1020 && $t['dibuat_tanggal_lokal'] === '2026-11-18');
});

it('task mandiri dengan label baru membuat label, nama label sama memakai ulang', function () {
    $this->mutasi('POST', '/api/task', isianTask(['label_baru' => 'Rumah', 'deadline_tanggal' => '', 'deadline_menit' => null]))
        ->assertOk()->assertJsonPath('ubah.label_mandiri.0.nama', 'Rumah');
    $this->mutasi('POST', '/api/task', isianTask(['label_baru' => '', 'deadline_tanggal' => '']))
        ->assertStatus(422)->assertJsonPath('rincian.label', 'Label wajib untuk task mandiri.');

    $label = LabelMandiri::first();
    $this->mutasi('POST', '/api/task', isianTask(['label_id' => $label->id, 'nama' => 'tulis BAB', 'deadline_tanggal' => '']))
        ->assertJsonPath('rincian.nama', 'Nama sudah dipakai task aktif berlabel sama.');
});

it('progress ke 10 yang menutup projek wajib membawa dampak; buka kembali memulihkan progress', function () {
    $t = $this->buat('/api/task', isianTask(['sesi_id' => $this->sesi]));
    $this->mutasi('POST', "/api/task/{$t}/progress", ['nilai' => 4, 'deskripsi' => 'draf', 'dampak' => null])
        ->assertOk()->assertJsonPath('ubah.riwayat_progress.0.sesudah', 4);
    $this->mutasi('POST', "/api/task/{$t}/progress", ['nilai' => 4, 'deskripsi' => '', 'dampak' => null])
        ->assertJsonPath('rincian.nilai', 'Nilai baru harus berbeda dari nilai sekarang.');

    // Sesi masih berjalan, jadi task selesai belum menutup projek: tanpa dampak.
    $this->mutasi('POST', "/api/task/{$t}/progress", ['nilai' => 10, 'deskripsi' => '', 'dampak' => null])->assertOk()
        ->assertJsonPath('ubah.riwayat_progress.0.penanda', 'selesai');

    $this->mutasi('POST', "/api/task/{$t}/buka-kembali", ['nama' => null])
        ->assertOk()
        ->assertJsonPath('ubah.task.0.progress', 4);
    expect(RiwayatProgress::query()->pluck('penanda')->all())->toBe([null, 'selesai', 'buka_kembali']);
});

it('batal task terakhir di sesi lewat menutup projek dan butuh dampak', function () {
    $t = $this->buat('/api/task', isianTask(['sesi_id' => $this->sesi]));
    $this->travelTo(new DateTimeImmutable('2026-12-02T03:00:00Z'));

    $this->mutasi('POST', "/api/task/{$t}/batal", ['dampak' => null])
        ->assertStatus(409)->assertJsonPath('dampak', dampakSelesai([$t]));
    $this->mutasi('POST', "/api/task/{$t}/batal", ['dampak' => dampakSelesai([$t])])
        ->assertOk()
        ->assertJsonPath('ubah.task.0.batal', true)
        ->assertJsonPath('ubah.task.0.dibatalkan_tanggal_lokal', '2026-12-02');
});

it('batal menghapus entri mendatang beserta bloknya, entri hari ini tetap', function () {
    $t = $this->buat('/api/task', isianTask(['sesi_id' => $this->sesi]));
    $hariIni = (string) Str::uuid();
    $besok = (string) Str::uuid();
    $this->buat('/api/entri', ['id' => $hariIni, 'task_id' => $t, 'tanggal' => '2026-11-18']);
    $this->buat('/api/entri', ['id' => $besok, 'task_id' => $t, 'tanggal' => '2026-11-19']);
    $blok = $this->buat("/api/entri/{$besok}/blok", ['mulai_menit' => 600, 'selesai_menit' => 660]);

    $this->mutasi('POST', "/api/task/{$t}/batal", ['dampak' => null])
        ->assertOk()
        ->assertJsonPath('hapus', [['tabel' => 'blok_jam', 'id' => $blok], ['tabel' => 'entri_todo', 'id' => $besok]]);
    expect(EntriTodo::query()->pluck('id')->all())->toBe([$hariIni]);
});

it('pindah ke sesi lain memvalidasi deadline di sesi tujuan', function () {
    $t = $this->buat('/api/task', isianTask(['sesi_id' => $this->sesi]));
    $s2 = $this->buat("/api/projek/{$this->projek}/sesi", ['nama' => 'Bab 2', 'mulai' => '2026-12-01', 'akhir' => '2026-12-15', 'deskripsi' => '']);

    $this->mutasi('POST', "/api/task/{$t}/pindah", ['sesi_id' => $this->sesi, 'deadline_tanggal' => '2026-11-25', 'deadline_menit' => null, 'dampak' => null])
        ->assertJsonPath('pesan', 'Pilih sesi yang berbeda.');
    $this->mutasi('POST', "/api/task/{$t}/pindah", ['sesi_id' => $s2, 'deadline_tanggal' => '2026-11-25', 'deadline_menit' => null, 'dampak' => null])
        ->assertJsonPath('kolom', 'deadline_tanggal');
    $this->mutasi('POST', "/api/task/{$t}/pindah", ['sesi_id' => $s2, 'deadline_tanggal' => '2026-12-10', 'deadline_menit' => null, 'dampak' => null])
        ->assertOk()->assertJsonPath('ubah.task.0.sesi_id', $s2);
});

it('label: ganti nama dan tidak bisa dihapus selama punya task', function () {
    $this->buat('/api/task', isianTask(['label_baru' => 'Rumah', 'deadline_tanggal' => '']));
    $label = LabelMandiri::first();

    $this->mutasi('PATCH', "/api/label/{$label->id}", ['nama' => 'skripsi'])->assertJsonPath('rincian.nama', 'Nama sama dengan projek “Skripsi”.');
    $this->mutasi('PATCH', "/api/label/{$label->id}", ['nama' => 'Kos'])->assertOk()->assertJsonPath('ubah.label_mandiri.0.nama', 'Kos');
    $this->mutasi('DELETE', "/api/label/{$label->id}")->assertStatus(422)->assertJsonPath('pesan', 'Label yang punya task tidak bisa dihapus.');
});
