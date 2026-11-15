<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

// AD-7: Laravel menyajikan SPA hasil build (disalin ke public/ saat membangun image).
// Semua alamat di luar /api dan /auth dikembalikan ke index.html agar router SPA yang menangani.
Route::fallback(function () {
    $index = public_path('index.html');
    abort_unless(is_file($index), 404);

    return response()->file($index, ['Cache-Control' => 'no-cache']);
});
