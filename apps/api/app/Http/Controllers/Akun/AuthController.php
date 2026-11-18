<?php

declare(strict_types=1);

namespace App\Http\Controllers\Akun;

use App\Contracts\PengirimEmail;
use App\Http\Controllers\Controller;
use App\Http\Requests\Akun\AturanPassword;
use App\Http\Requests\Akun\DaftarRequest;
use App\Models\Akun;
use App\Support\GalatDomain;
use App\Support\PembatasMasuk;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

use function Illuminate\Support\defer;

/** Masuk, daftar, keluar, dan reset password (Spesifikasi U-01..U-08, S-1, S-2, S-5). */
final class AuthController extends Controller
{
    private const RESET_MENIT = 30;

    private static ?string $hashDummy = null;

    public function daftar(DaftarRequest $request): JsonResponse
    {
        PembatasMasuk::batasi('daftar:'.$request->ip(), 10, 3600);

        /** @var array{email: string, password: string, nama_tampil: string|null, zona_waktu?: string|null} $data */
        $data = $request->validated();
        if ($this->cariEmail($data['email']) !== null) {
            throw GalatDomain::kolom('email', 'Email sudah terdaftar. Masuk atau reset password.');
        }

        try {
            $akun = Akun::create([
                'email' => $data['email'],
                'password' => $data['password'],
                'nama_tampil' => ($data['nama_tampil'] ?? '') !== '' ? $data['nama_tampil'] : Str::before($data['email'], '@'),
                'zona_waktu' => $data['zona_waktu'] ?? 'Asia/Jakarta',
            ]);
        } catch (UniqueConstraintViolationException) {
            throw GalatDomain::kolom('email', 'Email sudah terdaftar. Masuk atau reset password.');
        }

        $this->mulaiSesi($request, $akun);

        return response()->json($akun->fresh()?->keApi(), 201);
    }

    public function masuk(Request $request): JsonResponse
    {
        $email = mb_strtolower(trim((string) $request->input('email')));
        $password = (string) $request->input('password');
        $ip = (string) $request->ip();

        PembatasMasuk::cekMasuk($email, $ip);

        $akun = $email === '' ? null : $this->cariEmail($email);
        // S-1: email tak dikenal tetap memeriksa hash dummy agar waktu jawab setara.
        $cocok = Hash::check($password, $akun->password ?? self::hashDummy());

        if ($akun === null || $akun->password === null || ! $cocok) {
            PembatasMasuk::gagalMasuk($email, $ip);
            throw GalatDomain::aturan('Email atau password salah.');
        }

        PembatasMasuk::berhasilMasuk($email, $ip);
        if (Hash::needsRehash((string) $akun->password)) {
            $akun->password = $password;
            $akun->save();
        }
        $this->mulaiSesi($request, $akun);

        return response()->json($akun->keApi());
    }

    public function keluar(Request $request): Response
    {
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->noContent();
    }

    /** Selalu 204 agar tidak membocorkan email terdaftar; email dikirim setelah respons (N-73). */
    public function lupaPassword(Request $request, PengirimEmail $pengirim): Response
    {
        $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        $request->validate(['email' => ['required', 'string', 'max:254', 'email:rfc']], ['email.*' => 'Format email tidak valid.']);
        $email = (string) $request->input('email');

        PembatasMasuk::batasi('reset:ip:'.$request->ip(), 3, 3600);
        PembatasMasuk::batasi('reset:akun:'.PembatasMasuk::kunciEmail($email), 3, 3600);

        $akun = $this->cariEmail($email);
        if ($akun !== null) {
            $token = Str::random(64);
            // Satu baris per akun: permintaan baru membatalkan token lama.
            DB::table('password_reset_tokens')->upsert(
                ['akun_id' => $akun->id, 'token' => hash('sha256', $token), 'created_at' => Date::now()],
                ['akun_id'],
                ['token', 'created_at'],
            );
            $tautan = rtrim((string) config('app.url'), '/').'/reset-password?token='.$token;
            defer(fn () => $pengirim->kirimResetPassword($akun->email, $akun->nama_tampil, $tautan));
        }

        return response()->noContent();
    }

    public function resetPassword(Request $request): Response
    {
        $baris = DB::table('password_reset_tokens')
            ->where('token', hash('sha256', (string) $request->input('token')))
            ->where('created_at', '>', Date::now()->subMinutes(self::RESET_MENIT))
            ->first();
        if ($baris === null) {
            throw new GalatDomain(422, 'validasi_gagal', 'Tautan reset tidak valid atau sudah kedaluwarsa.', ['token' => 'Tautan tidak valid.']);
        }

        $request->validate(['password' => AturanPassword::rules()], AturanPassword::messages('password'));

        DB::transaction(function () use ($baris, $request): void {
            $akun = Akun::findOrFail($baris->akun_id);
            $akun->password = (string) $request->input('password');
            $akun->save();
            DB::table('password_reset_tokens')->where('akun_id', $akun->id)->delete();
            // N-64: reset mencabut semua sesi akun.
            DB::table('sessions')->where('user_id', $akun->id)->delete();
        });

        return response()->noContent();
    }

    private function cariEmail(string $email): ?Akun
    {
        return Akun::query()->whereRaw('lower(email) = ?', [$email])->first();
    }

    private function mulaiSesi(Request $request, Akun $akun): void
    {
        Auth::guard('web')->login($akun);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }
    }

    private static function hashDummy(): string
    {
        return self::$hashDummy ??= Hash::make(Str::random(32));
    }
}
