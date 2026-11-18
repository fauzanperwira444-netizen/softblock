<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\GalatDomain;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * N-76: klien yang membawa build berbeda dari server ditolak 409 klien_usang
 * agar tidak menulis dengan aturan lama. Build "dev" dan permintaan tanpa
 * header (smoke test, health check platform) dilewatkan.
 */
final class CekBuild
{
    public function handle(Request $request, Closure $next): Response
    {
        $server = (string) config('app.build');
        $klien = $request->header('X-Build');

        if ($server !== 'dev' && is_string($klien) && $klien !== '' && $klien !== $server && ! $request->is('api/kesehatan/siap')) {
            throw GalatDomain::klienUsang();
        }

        return $next($request);
    }
}
