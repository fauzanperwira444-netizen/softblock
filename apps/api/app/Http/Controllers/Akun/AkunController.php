<?php

declare(strict_types=1);

namespace App\Http\Controllers\Akun;

use App\Http\Controllers\Controller;
use App\Http\Requests\Akun\AturanPassword;
use App\Http\Requests\Akun\UbahAkunRequest;
use App\Models\Akun;
use App\Support\GalatDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/** Halaman Akun (S-16): profil, zona waktu, dan ganti password (U-09..U-14). */
final class AkunController extends Controller
{
    public function tampil(Request $request): JsonResponse
    {
        return response()->json($this->akun($request)->keApi());
    }

    public function ubah(UbahAkunRequest $request): JsonResponse
    {
        $akun = $this->akun($request);
        $akun->fill($request->validated())->save();

        return response()->json($akun->keApi());
    }

    public function gantiPassword(Request $request): Response
    {
        $akun = $this->akun($request);
        if ($akun->password !== null && ! Hash::check((string) $request->input('password_lama'), $akun->password)) {
            throw GalatDomain::kolom('password_lama', 'Password lama salah.');
        }
        $request->validate(['password_baru' => AturanPassword::rules()], AturanPassword::messages('password_baru'));

        $akun->password = (string) $request->input('password_baru');
        $akun->save();

        // N-64: sesi lain dicabut, sesi ini tetap.
        DB::table('sessions')
            ->where('user_id', $akun->id)
            ->when($request->hasSession(), fn ($q) => $q->where('id', '!=', $request->session()->getId()))
            ->delete();

        return response()->noContent();
    }

    private function akun(Request $request): Akun
    {
        /** @var Akun */
        return $request->user();
    }
}
