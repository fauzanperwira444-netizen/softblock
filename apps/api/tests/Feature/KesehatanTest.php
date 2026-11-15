<?php

declare(strict_types=1);

it('liveness menjawab tanpa database', function () {
    $this->getJson('/api/kesehatan')
        ->assertOk()
        ->assertJsonPath('status', 'ok');
});

it('readiness memeriksa database', function () {
    $this->getJson('/api/kesehatan/siap')
        ->assertOk()
        ->assertJsonPath('status', 'siap');
});
