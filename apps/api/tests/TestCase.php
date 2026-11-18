<?php

declare(strict_types=1);

namespace Tests;

use App\Models\Akun;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Response;

abstract class TestCase extends BaseTestCase
{
    /**
     * Aksi pengubah dengan If-Match = revisi akun yang masuk saat ini.
     *
     * @param  array<string, mixed>  $data
     * @return TestResponse<Response>
     */
    public function mutasi(string $metode, string $url, array $data = []): TestResponse
    {
        /** @var Akun $akun */
        $akun = Auth::user();
        $revisi = (int) Akun::query()->whereKey($akun->id)->value('revisi');

        return $this->json($metode, $url, $data, ['If-Match' => (string) $revisi]);
    }

    /**
     * Seperti mutasi(), dan mengembalikan id baris baru dari respons.
     *
     * @param  array<string, mixed>  $data
     */
    public function buat(string $url, array $data): string
    {
        $respons = $this->mutasi('POST', $url, $data);
        $respons->assertOk();

        return (string) $respons->json('id');
    }
}
