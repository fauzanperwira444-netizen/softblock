<?php

declare(strict_types=1);

namespace App\Http\Requests\Akun;

/** N-34: password 8..128 karakter, tanpa aturan komposisi. */
final class AturanPassword
{
    public const MIN = 8;

    public const MAX = 128;

    /** @return list<string> */
    public static function rules(): array
    {
        return ['required', 'string', 'min:'.self::MIN, 'max:'.self::MAX];
    }

    /** @return array<string, string> */
    public static function messages(string $kolom): array
    {
        $min = 'Password minimal '.self::MIN.' karakter.';

        return [
            "{$kolom}.required" => $min,
            "{$kolom}.string" => $min,
            "{$kolom}.min" => $min,
            "{$kolom}.max" => 'Password maksimal '.self::MAX.' karakter.',
        ];
    }
}
