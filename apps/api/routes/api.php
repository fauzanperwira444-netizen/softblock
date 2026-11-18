<?php

declare(strict_types=1);

use App\Http\Controllers\Akun\AkunController;
use App\Http\Controllers\Akun\AuthController;
use App\Http\Controllers\Data\JadwalController;
use App\Http\Controllers\Data\ProjekController;
use App\Http\Controllers\Data\TaskController;
use App\Http\Controllers\Data\TodoController;
use App\Http\Controllers\PolaKerjaController;
use App\Http\Controllers\SinkronController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// DP-8: liveness tanpa database, dipakai klien untuk membangunkan server.
Route::get('/kesehatan', fn () => response()->json([
    'status' => 'ok',
    'build' => config('app.build'),
]));

// DP-8: readiness dengan database, dipakai smoke test.
Route::get('/kesehatan/siap', function () {
    DB::select('select 1');

    return response()->json(['status' => 'siap', 'build' => config('app.build')]);
});

// N-24: endpoint publik hanya auth.
Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::post('/daftar', 'daftar');
    Route::post('/masuk', 'masuk');
    Route::post('/keluar', 'keluar');
    Route::post('/lupa-password', 'lupaPassword');
    Route::post('/reset-password', 'resetPassword');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/akun', [AkunController::class, 'tampil']);
    Route::patch('/akun', [AkunController::class, 'ubah']);
    Route::put('/akun/password', [AkunController::class, 'gantiPassword']);

    Route::get('/sinkron', SinkronController::class);
    Route::get('/pola-kerja', PolaKerjaController::class);

    Route::controller(ProjekController::class)->group(function () {
        Route::post('/projek', 'simpan');
        Route::patch('/projek/{id}', 'ubah');
        Route::delete('/projek/{id}', 'hapus');
        Route::post('/projek/{id}/selesai-dini', 'selesaiDini');
        Route::post('/projek/{id}/batal', 'batal');
        Route::post('/projek/{id}/buka-kembali', 'bukaKembali');
        Route::post('/projek/{id}/dokumen', 'simpanDokumen');
        Route::patch('/dokumen/{id}', 'ubahDokumen');
        Route::delete('/dokumen/{id}', 'hapusDokumen');
        Route::post('/projek/{id}/sesi', 'simpanSesi');
        Route::patch('/sesi/{id}', 'ubahSesi');
        Route::post('/sesi/{id}/batal', 'batalSesi');
        Route::delete('/sesi/{id}', 'hapusSesi');
    });

    Route::controller(TaskController::class)->group(function () {
        Route::post('/task', 'simpan');
        Route::patch('/task/{id}', 'ubah');
        Route::post('/task/{id}/pindah', 'pindah');
        Route::post('/task/{id}/progress', 'progress');
        Route::post('/task/{id}/batal', 'batal');
        Route::post('/task/{id}/buka-kembali', 'bukaKembali');
        Route::patch('/label/{id}', 'ubahLabel');
        Route::delete('/label/{id}', 'hapusLabel');
    });

    Route::controller(TodoController::class)->group(function () {
        Route::post('/entri', 'simpanEntri');
        Route::delete('/entri/{id}', 'hapusEntri');
        Route::put('/entri/{id}/ceklis', 'ceklis');
        Route::post('/entri/{id}/blok', 'simpanBlok');
        Route::patch('/blok/{id}', 'ubahBlok');
        Route::delete('/blok/{id}', 'hapusBlok');
    });

    Route::controller(JadwalController::class)->group(function () {
        Route::post('/jadwal', 'simpan');
        Route::patch('/jadwal/{id}', 'ubah');
        Route::post('/jadwal/{id}/akhiri', 'akhiri');
        Route::delete('/jadwal/{id}', 'hapus');
        Route::post('/pengecualian', 'simpanPengecualian');
        Route::delete('/pengecualian/{id}', 'hapusPengecualian');
    });
});
