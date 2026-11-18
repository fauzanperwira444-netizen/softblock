<?php

declare(strict_types=1);

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

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/sinkron', SinkronController::class);
});
