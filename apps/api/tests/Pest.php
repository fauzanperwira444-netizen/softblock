<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)->use(RefreshDatabase::class)->in('Feature');

/**
 * Golden fixture bersama dengan Vitest (AD-8, N-10).
 *
 * @return array<string, mixed>
 */
function bacaFixture(string $nama): array
{
    $isi = file_get_contents(dirname(__DIR__, 3).'/fixtures/'.$nama);

    return json_decode((string) $isi, true, flags: JSON_THROW_ON_ERROR);
}

/**
 * Kasus fixture sebagai dataset Pest, diberi nama sesuai kolom "nama".
 *
 * @param  list<array<string, mixed>>  $kasus
 * @return array<string, array{0: array<string, mixed>}>
 */
function datasetKasus(array $kasus): array
{
    $hasil = [];
    foreach ($kasus as $i => $k) {
        $hasil[(string) ($k['nama'] ?? json_encode($k['input'] ?? $i))] = [$k];
    }

    return $hasil;
}
