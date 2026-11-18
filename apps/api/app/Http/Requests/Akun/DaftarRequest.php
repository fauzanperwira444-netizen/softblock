<?php

declare(strict_types=1);

namespace App\Http\Requests\Akun;

use Illuminate\Foundation\Http\FormRequest;

final class DaftarRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower(trim((string) $this->input('email'))),
            'nama_tampil' => trim((string) $this->input('nama_tampil')),
        ]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'max:254', 'email:rfc'],
            'password' => AturanPassword::rules(),
            'nama_tampil' => ['nullable', 'string', 'max:45'],
            'zona_waktu' => ['nullable', 'string', 'timezone:all'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.*' => 'Format email tidak valid.',
            'nama_tampil.max' => 'Nama tampil maksimal 45 karakter.',
            'zona_waktu.*' => 'Zona waktu tidak dikenal.',
        ] + AturanPassword::messages('password');
    }
}
