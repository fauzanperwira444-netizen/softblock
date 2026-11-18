<?php

declare(strict_types=1);

use App\Domain\Dampak;
use App\Domain\JadwalEfektif;

// Kembaran apps/web/src/domain/todo.test.ts dan dampak.test.ts.

$efektif = bacaFixture('jadwal-efektif.json');

it('jadwal-efektif.json', function (array $k) use ($efektif) {
    $hasil = array_map(
        fn (array $x): array => ['jadwal_id' => $x['jadwal_id'], 'mulai' => $x['mulai'], 'selesai' => $x['selesai']],
        JadwalEfektif::padaTanggal($efektif['data'], $k['tanggal']),
    );
    expect($hasil)->toBe($k['expected']);
})->with(datasetKasus($efektif['kasus']));

$bentrok = bacaFixture('bentrok-blok.json');

it('bentrok-blok.json', function (array $k) use ($bentrok) {
    expect(JadwalEfektif::penyebabBentrok($k['blok'], $bentrok['jadwal'])['jadwal_id'] ?? null)->toBe($k['expected']);
})->with(datasetKasus($bentrok['kasus']));

it('dampak.json', function (array $k) {
    $i = $k['input'];
    $data = ['projek' => $i['projek'], 'sesi' => $i['sesi'], 'task' => $i['task']];
    $projek = collect($i['projek'])->firstWhere('id', $i['projek_id']);
    $sesi = collect($i['sesi'])->firstWhere('id', $i['sesi_id'] ?? null);

    $hasil = match ($k['aksi']) {
        'selesai_dini' => Dampak::selesaiDini($data, $projek, $k['today']),
        'batal_projek' => Dampak::batalProjek($data, $projek, $k['today']),
        'batal_sesi' => Dampak::batalSesi($data, $projek, $sesi, $k['today']),
        'hapus_sesi' => Dampak::hapusSesi($data, $projek, $sesi, $k['today']),
        'ubah_periode' => Dampak::ubahPeriode($data, $projek, $sesi, $i['rentang']['mulai'], $i['rentang']['akhir'], $k['today']),
    };

    expect($hasil)->toBe($k['expected']);
})->with(datasetKasus(bacaFixture('dampak.json')['kasus']));
