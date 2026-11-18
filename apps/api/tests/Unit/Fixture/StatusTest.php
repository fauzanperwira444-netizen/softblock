<?php

declare(strict_types=1);

use App\Domain\Status;

// Kembaran apps/web/src/domain/fixture.test.ts: hasil PHP harus identik dengan TS.

it('status-sesi.json', function (array $k) {
    expect(Status::statusSesi($k['input'], $k['today']))->toBe($k['expected']);
})->with(datasetKasus(bacaFixture('status-sesi.json')['kasus']));

it('status-projek.json', function (array $k) {
    $i = $k['input'];
    expect(Status::statusProjek($i['projek'], $i['sesi'], $i['tasks'], $k['today']))->toBe($k['expected']);
})->with(datasetKasus(bacaFixture('status-projek.json')['kasus']));

it('telat.json', function (array $k) {
    expect(Status::taskTelat($k['input'], $k['today'], $k['nowMinutes'] ?? 0))->toBe($k['expected']);
})->with(datasetKasus(bacaFixture('telat.json')['kasus']));

it('di-luar-periode.json', function (array $k) {
    expect(Status::taskDiLuarPeriode($k['input']['task'], $k['input']['sesi']))->toBe($k['expected']);
})->with(datasetKasus(bacaFixture('di-luar-periode.json')['kasus']));
