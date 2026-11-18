<?php

declare(strict_types=1);

namespace App\Contracts;

/** IF-5: pengiriman email di balik antarmuka; implementasi Resend dipasang saat deploy. */
interface PengirimEmail
{
    public function kirimResetPassword(string $email, string $nama, string $tautan): void;
}
