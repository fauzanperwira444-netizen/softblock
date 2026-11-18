<?php

declare(strict_types=1);

use App\Models\Akun;
use App\Models\Concerns\MilikAkun;
use App\Models\ModelAkun;

// N-39, S-3: semua tabel data memakai cakupan akun; N-65: strict_types di semua kode.

arch('semua model data mewarisi ModelAkun yang memakai MilikAkun')
    ->expect('App\Models')
    ->classes()
    ->toExtend(ModelAkun::class)
    ->ignoring([Akun::class, ModelAkun::class, 'App\Models\Concerns']);

arch('ModelAkun memakai cakupan akun')
    ->expect(ModelAkun::class)
    ->toUseTrait(MilikAkun::class);

arch('kode aplikasi memakai strict_types')
    ->expect('App')
    ->toUseStrictTypes();

arch('domain murni tidak menyentuh framework (AD-8)')
    ->expect('App\Domain')
    ->not->toUse(['Illuminate', 'App\Models', 'App\Support']);
