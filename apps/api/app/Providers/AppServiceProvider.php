<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\PengirimEmail;
use App\Support\PengirimEmailMail;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    /** @var array<class-string, class-string> */
    public array $bindings = [
        PengirimEmail::class => PengirimEmailMail::class,
    ];

    public function boot(): void
    {
        $proxy = (string) config('app.proxy_tepercaya');
        if ($proxy !== '') {
            TrustProxies::at($proxy === '*' ? '*' : explode(',', $proxy));
        }
    }
}
