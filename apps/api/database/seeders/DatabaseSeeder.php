<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Akun;
use App\Models\Jadwal;
use App\Models\JadwalVersi;
use App\Models\LabelMandiri;
use App\Models\Projek;
use App\Models\Sesi;
use App\Models\Task;
use App\Support\Transaksi;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Date;

/** N-40: dua akun palsu dengan sedikit data, untuk dev lokal dan uji isolasi manual. */
final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['dina@contoh.test' => 'Dina', 'raka@contoh.test' => 'Raka'] as $email => $nama) {
            $akun = Akun::factory()->create(['email' => $email, 'nama_tampil' => $nama]);
            $this->isi($akun);
        }
    }

    private function isi(Akun $akun): void
    {
        $hariIni = Date::now('Asia/Jakarta');
        $tgl = fn (int $n): string => $hariIni->copy()->addDays($n)->format('Y-m-d');

        Transaksi::jalankan($akun, (string) $akun->fresh()?->revisi, function () use ($tgl) {
            $projek = Projek::create(['nama' => 'Skripsi', 'deskripsi' => 'Tugas akhir', 'warna' => '#2e8b7a']);
            $sesi = Sesi::create(['projek_id' => $projek->id, 'nama' => 'Bab 1–2', 'mulai' => $tgl(-7), 'akhir' => $tgl(14)]);
            $label = LabelMandiri::create(['nama' => 'Rumah']);

            $task = ['deskripsi' => '', 'kesulitan' => 2, 'dibuat_tanggal_lokal' => $tgl(-7)];
            Task::create($task + ['sesi_id' => $sesi->id, 'nama' => 'Tulis latar belakang', 'deadline_tanggal' => $tgl(3)]);
            Task::create($task + ['sesi_id' => $sesi->id, 'nama' => 'Kumpulkan referensi', 'deadline_tanggal' => $tgl(-1), 'deadline_menit' => 1020]);
            Task::create($task + ['label_id' => $label->id, 'nama' => 'Bayar listrik', 'deadline_tanggal' => null]);

            $jadwal = Jadwal::create(['nama' => 'Kuliah']);
            JadwalVersi::create([
                'jadwal_id' => $jadwal->id, 'hari' => [1, 3], 'mulai_menit' => 480, 'selesai_menit' => 600,
                'berlaku_mulai' => $tgl(-30), 'berlaku_akhir' => null, 'sekali_jalan' => false,
            ]);
        });
    }
}
