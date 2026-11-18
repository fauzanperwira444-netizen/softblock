<?php

declare(strict_types=1);

use App\Http\Middleware\CekBuild;
use App\Support\Amplop;
use App\Support\GalatDomain;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum mode SPA: cookie sesi + CSRF untuk permintaan dari origin sendiri (N-35).
        $middleware->statefulApi();
        $middleware->api(prepend: [CekBuild::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Amplop galat 7.5 untuk semua jawaban API; rincian berisi satu pesan per kolom.
        $exceptions->render(function (ValidationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            $rincian = array_map(fn (array $pesan): string => (string) $pesan[0], $e->errors());

            return Amplop::galat(422, 'validasi_gagal', (string) (reset($rincian) ?: 'Isian tidak valid.'), $rincian);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return $request->is('api/*')
                ? Amplop::galat(401, 'sesi_habis', 'Sesi berakhir. Masuk lagi.')
                : null;
        });

        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            $tunggu = (int) ($e->getHeaders()['Retry-After'] ?? 60);

            return GalatDomain::terlaluBanyak($tunggu)->render();
        });

        // N-61: data akun lain dijawab sama seperti data yang tidak ada.
        $exceptions->render(function (NotFoundHttpException|ModelNotFoundException $e, Request $request) {
            return $request->is('api/*') ? GalatDomain::tidakDitemukan()->render() : null;
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            $kode = match ($e->getStatusCode()) {
                403 => 'dilarang',
                405 => 'metode_tidak_didukung',
                419 => 'csrf_kedaluwarsa',
                default => 'kesalahan_server',
            };

            return Amplop::galat($e->getStatusCode(), $kode, $e->getMessage() ?: 'Permintaan gagal.');
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') || config('app.debug')) {
                return null;
            }

            return Amplop::galat(500, 'kesalahan_server', 'Terjadi kesalahan di server.');
        });
    })->create();
