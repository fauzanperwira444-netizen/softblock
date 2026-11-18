<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\PengirimEmail;
use App\Support\PengirimEmailMail;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    /** @var array<class-string, class-string> */
    public array $bindings = [
        PengirimEmail::class => PengirimEmailMail::class,
    ];
}
