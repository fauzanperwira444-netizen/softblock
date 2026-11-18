<?php

declare(strict_types=1);

namespace App\Http\Requests\Akun;

use Illuminate\Foundation\Http\FormRequest;

final class UbahAkunRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('nama_tampil'))) {
            $this->merge(['nama_tampil' => trim($this->input('nama_tampil'))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nama_tampil' => ['sometimes', 'required', 'string', 'max:45'],
            'zona_waktu' => ['sometimes', 'required', 'string', 'timezone:all'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'nama_tampil.required' => 'Nama tampil wajib diisi.',
            'nama_tampil.string' => 'Nama tampil wajib diisi.',
            'nama_tampil.max' => 'Nama tampil maksimal 45 karakter.',
            'zona_waktu.*' => 'Zona waktu tidak dikenal.',
        ];
    }
}
