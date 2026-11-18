<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $akun_id
 * @property int $versi
 * @property string $task_id
 * @property Carbon $tanggal
 * @property bool $ceklis
 */
final class EntriTodo extends ModelAkun
{
    public const TABEL = 'entri_todo';

    protected $table = 'entri_todo';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'versi' => 'integer',
            'tanggal' => 'date:Y-m-d',
            'ceklis' => 'boolean',
        ];
    }
}
