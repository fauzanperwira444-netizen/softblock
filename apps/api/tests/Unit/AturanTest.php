<?php

declare(strict_types=1);

use App\Domain\AturanProjek;
use App\Domain\AturanTask;

// Kasus yang sama dengan blok "validasi" di apps/web/src/domain/dampak.test.ts.

it('nama projek: wajib, unik tanpa beda kapital, bukan label, bukan "Mandiri"', function () {
    $projek = [['id' => 'p1', 'nama' => 'Skripsi']];
    $label = [['id' => 'l1', 'nama' => 'Rumah']];

    expect(AturanProjek::validasiNama('  ', $projek, $label, null))->toContain('wajib')
        ->and(AturanProjek::validasiNama(' skripsi ', $projek, $label, null))->toContain('sudah dipakai')
        ->and(AturanProjek::validasiNama('Skripsi', $projek, $label, 'p1'))->toBeNull()
        ->and(AturanProjek::validasiNama('RUMAH', $projek, $label, null))->toContain('label mandiri')
        ->and(AturanProjek::validasiNama('Mandiri', $projek, $label, null))->toContain('Mandiri')
        ->and(AturanProjek::validasiNama(str_repeat('x', 46), $projek, $label, null))->toContain('45');
});

it('sesi tidak boleh bertumpuk dengan sesi non-batal; berbatasan diperbolehkan', function () {
    $lain = [
        ['id' => 's1', 'nama' => 'Sesi 1', 'mulai' => '2026-11-01', 'akhir' => '2026-11-14', 'batal' => false],
        ['id' => 's2', 'nama' => 'Sesi lama', 'mulai' => '2026-11-15', 'akhir' => '2026-11-30', 'batal' => true],
    ];
    $isian = fn (string $nama, string $mulai, string $akhir) => ['nama' => $nama, 'mulai' => $mulai, 'akhir' => $akhir, 'deskripsi' => ''];

    expect(AturanProjek::validasiSesi($isian('Sesi 2', '2026-11-15', '2026-11-30'), $lain, '2026-11-10', null, true))->toBe([])
        ->and(AturanProjek::validasiSesi($isian('Sesi 2', '2026-11-14', '2026-11-30'), $lain, '2026-11-10', null, true)['umum'])->toContain('Sesi 1')
        ->and(AturanProjek::validasiSesi($isian('sesi 1', '2026-12-01', '2026-12-02'), $lain, '2026-11-10', null, true)['nama'])->toContain('sudah dipakai')
        ->and(AturanProjek::validasiSesi($isian('Baru', '2026-11-01', '2026-11-05'), [], '2026-11-10', null, true)['akhir'])->toContain('hari ini');
});

it('URL dokumen: skema https ditambahkan, selain http/https ditolak', function () {
    expect(AturanProjek::rapikanUrl('docs.google.com/abc'))->toBe('https://docs.google.com/abc')
        ->and(AturanProjek::rapikanUrl('http://contoh.id'))->toBe('http://contoh.id/')
        ->and(AturanProjek::rapikanUrl('javascript:alert(1)'))->toBeNull()
        ->and(AturanProjek::rapikanUrl('bukan url'))->toBeNull();
});

it('progress sebelum selesai diambil dari riwayat selesai terakhir, maksimal 9', function () {
    $r = fn (int $sebelum, int $sesudah, string $tgl, int $menit) => ['sebelum' => $sebelum, 'sesudah' => $sesudah, 'tanggal_lokal' => $tgl, 'menit_lokal' => $menit];

    expect(AturanTask::progressSebelumSelesai([]))->toBe(9)
        ->and(AturanTask::progressSebelumSelesai([$r(3, 10, '2026-11-01', 600), $r(6, 10, '2026-11-05', 60)]))->toBe(6);
});
