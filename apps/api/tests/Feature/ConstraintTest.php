<?php

declare(strict_types=1);

use App\Models\Akun;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

// Arsitektur Sistem 6.3, N-02: aturan yang dijaga database, bukan hanya aplikasi.

beforeEach(function () {
    $this->akun = Akun::factory()->create();
    $this->a = $this->akun->id;
    $this->projek = DB::table('projek')->insertGetId(['akun_id' => $this->a, 'versi' => 1, 'nama' => 'P', 'warna' => '#2e8b7a']);
});

function sisip(string $tabel, array $baris): string
{
    return (string) DB::table($tabel)->insertGetId($baris + ['versi' => 1]);
}

function gagal(callable $aksi): void
{
    expect(fn () => DB::transaction($aksi))->toThrow(QueryException::class);
}

it('sesi non-batal dalam satu projek tidak bertumpuk; berbatasan dan batal boleh', function () {
    $s = ['akun_id' => $this->a, 'projek_id' => $this->projek];
    sisip('sesi', $s + ['nama' => 'S1', 'mulai' => '2026-11-01', 'akhir' => '2026-11-14']);
    sisip('sesi', $s + ['nama' => 'S2', 'mulai' => '2026-11-15', 'akhir' => '2026-11-30']);
    sisip('sesi', $s + ['nama' => 'Lama', 'mulai' => '2026-11-10', 'akhir' => '2026-11-20', 'batal' => true]);

    gagal(fn () => sisip('sesi', $s + ['nama' => 'S3', 'mulai' => '2026-11-14', 'akhir' => '2026-11-16']));
    gagal(fn () => sisip('sesi', $s + ['nama' => 's1', 'mulai' => '2026-12-01', 'akhir' => '2026-12-02']));
});

it('nama projek unik per akun tanpa beda huruf besar', function () {
    gagal(fn () => sisip('projek', ['akun_id' => $this->a, 'nama' => 'p', 'warna' => '#4a8a3c']));
    $lain = Akun::factory()->create();
    sisip('projek', ['akun_id' => $lain->id, 'nama' => 'P', 'warna' => '#4a8a3c']);
});

it('task: tepat satu dari sesi atau label, progress 0..10, kesulitan 1..5', function () {
    $label = sisip('label_mandiri', ['akun_id' => $this->a, 'nama' => 'Rumah']);
    $t = ['akun_id' => $this->a, 'nama' => 'T', 'kesulitan' => 3, 'dibuat_tanggal_lokal' => '2026-11-18'];

    sisip('task', $t + ['label_id' => $label]);
    gagal(fn () => sisip('task', $t));
    gagal(fn () => sisip('task', $t + ['label_id' => $label, 'progress' => 11]));
    gagal(fn () => sisip('task', ['kesulitan' => 6] + $t + ['label_id' => $label]));
});

it('FK komposit menolak baris yang menunjuk data akun lain', function () {
    $lain = Akun::factory()->create();
    gagal(fn () => sisip('dokumen', ['akun_id' => $lain->id, 'projek_id' => $this->projek, 'nama' => 'D', 'url' => 'https://x.id']));
});

it('blok satu tanggal tidak bertumpuk; berbatasan boleh', function () {
    $label = sisip('label_mandiri', ['akun_id' => $this->a, 'nama' => 'Rumah']);
    $task = sisip('task', ['akun_id' => $this->a, 'label_id' => $label, 'nama' => 'T', 'kesulitan' => 1, 'dibuat_tanggal_lokal' => '2026-11-18']);
    $entri = sisip('entri_todo', ['akun_id' => $this->a, 'task_id' => $task, 'tanggal' => '2026-11-18']);
    $b = ['akun_id' => $this->a, 'entri_id' => $entri, 'tanggal' => '2026-11-18'];

    sisip('blok_jam', $b + ['mulai_menit' => 480, 'selesai_menit' => 540]);
    sisip('blok_jam', $b + ['mulai_menit' => 540, 'selesai_menit' => 600]);
    gagal(fn () => sisip('blok_jam', $b + ['mulai_menit' => 590, 'selesai_menit' => 620]));
    gagal(fn () => sisip('blok_jam', ['tanggal' => '2026-11-19'] + $b + ['mulai_menit' => 700, 'selesai_menit' => 720]));
});

it('versi satu Jadwal tidak bertumpuk masa berlakunya', function () {
    $j = sisip('jadwal', ['akun_id' => $this->a, 'nama' => 'Kuliah']);
    $v = ['akun_id' => $this->a, 'jadwal_id' => $j, 'hari' => '{1}', 'mulai_menit' => 480, 'selesai_menit' => 600];

    sisip('jadwal_versi', $v + ['berlaku_mulai' => '2026-09-01', 'berlaku_akhir' => '2026-11-17']);
    sisip('jadwal_versi', $v + ['berlaku_mulai' => '2026-11-18', 'berlaku_akhir' => null]);
    gagal(fn () => sisip('jadwal_versi', $v + ['berlaku_mulai' => '2027-01-01', 'berlaku_akhir' => null]));
});

it('riwayat progress hanya bisa ditambah (DA-6)', function () {
    $label = sisip('label_mandiri', ['akun_id' => $this->a, 'nama' => 'Rumah']);
    $task = sisip('task', ['akun_id' => $this->a, 'label_id' => $label, 'nama' => 'T', 'kesulitan' => 1, 'dibuat_tanggal_lokal' => '2026-11-18']);
    $r = sisip('riwayat_progress', ['akun_id' => $this->a, 'task_id' => $task, 'sebelum' => 0, 'sesudah' => 3, 'tanggal_lokal' => '2026-11-18', 'menit_lokal' => 600]);

    gagal(fn () => DB::table('riwayat_progress')->where('id', $r)->update(['sesudah' => 4]));
    gagal(fn () => DB::table('riwayat_progress')->where('id', $r)->delete());
});
