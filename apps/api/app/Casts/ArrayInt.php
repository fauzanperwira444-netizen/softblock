<?php

declare(strict_types=1);

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Array smallint PostgreSQL ("{1,3}") <-> list<int>.
 *
 * @implements CastsAttributes<list<int>, list<int>>
 */
final class ArrayInt implements CastsAttributes
{
    /** @return list<int> */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (! is_string($value)) {
            return [];
        }
        $isi = trim($value, '{}');

        return $isi === '' ? [] : array_map('intval', explode(',', $isi));
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        $daftar = is_array($value) ? $value : [];

        return '{'.implode(',', array_map('intval', $daftar)).'}';
    }
}
