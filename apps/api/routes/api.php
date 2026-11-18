<?php

declare(strict_types=1);

use App\Http\Controllers\Akun\AkunController;
use App\Http\Controllers\Akun\AuthController;
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
});
