<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Akun;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Akun> */
final class AkunFactory extends Factory
{
    protected $model = Akun::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'password' => 'rahasia-123',
            'nama_tampil' => fake()->firstName(),
            'zona_waktu' => 'Asia/Jakarta',
        ];
    }
}
