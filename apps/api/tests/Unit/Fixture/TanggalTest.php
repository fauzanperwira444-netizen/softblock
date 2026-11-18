<?php

declare(strict_types=1);

use App\Domain\Tanggal;

$f = bacaFixture('tanggal.json');

it('tambahHari', fn (array $k) => expect(Tanggal::tambahHari(...$k['input']))->toBe($k['expected']))
    ->with(datasetKasus($f['tambah_hari']));

it('selisihHari', fn (array $k) => expect(Tanggal::selisihHari(...$k['input']))->toBe($k['expected']))
    ->with(datasetKasus($f['selisih_hari']));

it('hariIso', fn (array $k) => expect(Tanggal::hariIso($k['input']))->toBe($k['expected']))
    ->with(datasetKasus($f['hari_iso']));

it('awalMinggu', fn (array $k) => expect(Tanggal::awalMinggu($k['input']))->toBe($k['expected']))
    ->with(datasetKasus($f['awal_minggu']));

it('hariLewat', fn (array $k) => expect(Tanggal::hariLewat($k['input'], $k['today']))->toBe($k['expected']))
    ->with(datasetKasus($f['hari_lewat']));

it('hariIniTerjaga', fn (array $k) => expect(Tanggal::hariIniTerjaga(...$k['input']))->toBe($k['expected']))
    ->with(datasetKasus($f['hari_ini_terjaga']));

it('waktuLokal memakai zona akun, bukan zona server', function () {
    $instan = new DateTimeImmutable('2026-11-18T17:30:00Z');
    expect(Tanggal::waktuLokal($instan, 'Asia/Jakarta'))->toBe(['tanggal' => '2026-11-19', 'menit' => 30])
        ->and(Tanggal::waktuLokal($instan, 'UTC'))->toBe(['tanggal' => '2026-11-18', 'menit' => 1050]);
});
