<?php

declare(strict_types=1);

// Amplop galat 7.5 dan pemeriksaan build N-76.

it('build klien berbeda ditolak 409 klien_usang', function () {
    config(['app.build' => 'abc123']);

    $this->getJson('/api/kesehatan', ['X-Build' => 'lama'])
        ->assertStatus(409)
        ->assertExactJson(['kode' => 'klien_usang', 'pesan' => 'Versi aplikasi sudah usang. Muat ulang halaman.']);

    $this->getJson('/api/kesehatan', ['X-Build' => 'abc123'])->assertOk();
    $this->getJson('/api/kesehatan')->assertOk();
    $this->getJson('/api/kesehatan/siap', ['X-Build' => 'lama'])->assertOk();
});

it('build dev melewatkan pemeriksaan', function () {
    config(['app.build' => 'dev']);
    $this->getJson('/api/kesehatan', ['X-Build' => 'apa-saja'])->assertOk();
});

it('tanpa sesi dijawab 401 sesi_habis', function () {
    $this->getJson('/api/sinkron')
        ->assertStatus(401)
        ->assertJsonPath('kode', 'sesi_habis');
});

it('rute api yang tidak ada dijawab 404 tidak_ditemukan', function () {
    $this->getJson('/api/tidak-ada')
        ->assertNotFound()
        ->assertJsonPath('kode', 'tidak_ditemukan');
});
