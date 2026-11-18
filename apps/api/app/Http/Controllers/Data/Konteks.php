<?php

declare(strict_types=1);

namespace App\Http\Controllers\Data;

use App\Models\Akun;
use App\Support\Transaksi;
use Illuminate\Http\Request;

/** Bekal satu aksi pengubah: transaksi berjalan, hari ini di zona akun, dan badan permintaan. */
final class Konteks
{
    public function __construct(
        public readonly Transaksi $tx,
        public readonly Akun $akun,
        public readonly string $hariIni,
        public readonly int $menit,
        private readonly Request $request,
    ) {}

    public function teks(string $kunci): string
    {
        $v = $this->request->input($kunci);

        return is_string($v) ? $v : '';
    }

    public function teksAtauNull(string $kunci): ?string
    {
        $v = $this->teks($kunci);

        return $v === '' ? null : $v;
    }

    /** Bilangan bulat dari JSON; selain itu null. */
    public function bulat(string $kunci): ?int
    {
        $v = $this->request->input($kunci);
        if (is_int($v)) {
            return $v;
        }

        return is_float($v) && floor($v) === $v ? (int) $v : null;
    }

    public function benar(string $kunci): bool
    {
        return $this->request->input($kunci) === true;
    }

    public function mentah(string $kunci): mixed
    {
        return $this->request->input($kunci);
    }

    public function ada(string $kunci): bool
    {
        return $this->request->exists($kunci);
    }
}
