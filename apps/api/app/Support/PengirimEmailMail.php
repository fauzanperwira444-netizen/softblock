<?php

declare(strict_types=1);

namespace App\Support;

use App\Contracts\PengirimEmail;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;

/** Pengirim lewat Laravel Mail; mailer dipilih dari MAIL_MAILER (log di lokal, resend di produksi). */
final class PengirimEmailMail implements PengirimEmail
{
    public function kirimResetPassword(string $email, string $nama, string $tautan): void
    {
        $teks = "Halo {$nama},\n\n"
            ."Kami menerima permintaan reset password untuk akun Softblock ini.\n"
            ."Buka tautan berikut dalam 30 menit untuk membuat password baru:\n\n{$tautan}\n\n"
            .'Abaikan email ini bila kamu tidak memintanya. Password lama tetap berlaku.';

        Mail::raw($teks, fn (Message $m) => $m->to($email)->subject('Reset password Softblock'));
    }
}
