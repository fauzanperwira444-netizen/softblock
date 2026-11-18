<?php

declare(strict_types=1);

use App\Contracts\PengirimEmail;
use App\Models\Akun;
use App\Models\Projek;
use App\Support\Transaksi;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// Kontrak apps/web/src/api/akun.ts dan mock handlers.ts (U-01..U-14, S-1, S-5, N-64, N-73).

final class PengirimPalsu implements PengirimEmail
{
    /** @var list<array{email: string, tautan: string}> */
    public array $terkirim = [];

    public function kirimResetPassword(string $email, string $nama, string $tautan): void
    {
        $this->terkirim[] = ['email' => $email, 'tautan' => $tautan];
    }
}

beforeEach(function () {
    $this->withHeader('Referer', 'http://localhost:5173/');
    $this->email = new PengirimPalsu;
    $this->app->instance(PengirimEmail::class, $this->email);
    $this->withoutDefer();
});

function sesiPalsu(Akun $akun, string $id): void
{
    DB::table('sessions')->insert(['id' => $id, 'user_id' => $akun->id, 'payload' => '', 'last_activity' => time()]);
}

describe('daftar', function () {
    it('membuat akun, langsung masuk, dan memakai bagian email sebagai nama default', function () {
        $this->postJson('/api/auth/daftar', ['email' => '  Dina@Contoh.TEST ', 'password' => 'rahasia-123', 'nama_tampil' => ''])
            ->assertCreated()
            ->assertJson([
                'email' => 'dina@contoh.test',
                'nama_tampil' => 'dina',
                'zona_waktu' => 'Asia/Jakarta',
                'punya_password' => true,
                'tertaut_google' => false,
            ]);

        $this->getJson('/api/akun')->assertOk()->assertJsonPath('email', 'dina@contoh.test');
        expect(Akun::first()->password)->toStartWith('$argon2id$');
    });

    it('menerima zona waktu dari browser', function () {
        $this->postJson('/api/auth/daftar', ['email' => 'a@contoh.test', 'password' => 'rahasia-123', 'nama_tampil' => 'A', 'zona_waktu' => 'Asia/Makassar'])
            ->assertCreated()->assertJsonPath('zona_waktu', 'Asia/Makassar');
    });

    it('menolak email terdaftar tanpa beda huruf besar', function () {
        Akun::factory()->create(['email' => 'dina@contoh.test']);

        $this->postJson('/api/auth/daftar', ['email' => 'DINA@contoh.test', 'password' => 'rahasia-123', 'nama_tampil' => 'D'])
            ->assertStatus(422)
            ->assertJsonPath('kode', 'validasi_gagal')
            ->assertJsonPath('kolom', 'email')
            ->assertJsonPath('rincian.email', 'Email sudah terdaftar. Masuk atau reset password.');
    });

    it('memberi pesan per kolom', function () {
        $this->postJson('/api/auth/daftar', ['email' => 'bukan-email', 'password' => 'pendek', 'nama_tampil' => str_repeat('x', 46)])
            ->assertStatus(422)
            ->assertJsonPath('rincian', [
                'email' => 'Format email tidak valid.',
                'password' => 'Password minimal 8 karakter.',
                'nama_tampil' => 'Nama tampil maksimal 45 karakter.',
            ]);
    });

    it('dibatasi 10 per jam per IP (N-77)', function () {
        foreach (range(1, 10) as $i) {
            $this->postJson('/api/auth/daftar', ['email' => "u{$i}@contoh.test", 'password' => 'rahasia-123'])->assertCreated();
            $this->postJson('/api/auth/keluar');
        }
        $this->postJson('/api/auth/daftar', ['email' => 'u11@contoh.test', 'password' => 'rahasia-123'])
            ->assertStatus(429)
            ->assertJsonPath('kode', 'terlalu_banyak_percobaan');
    });
});

describe('masuk dan keluar', function () {
    beforeEach(fn () => $this->akun = Akun::factory()->create(['email' => 'dina@contoh.test', 'password' => 'rahasia-123']));

    it('masuk dengan email tanpa beda huruf besar', function () {
        $this->postJson('/api/auth/masuk', ['email' => ' DINA@contoh.test', 'password' => 'rahasia-123'])
            ->assertOk()
            ->assertJsonPath('id', $this->akun->id);
    });

    it('password salah dan email tak dikenal mendapat pesan yang sama', function () {
        foreach ([['dina@contoh.test', 'salah-sekali'], ['siapa@contoh.test', 'rahasia-123']] as [$email, $password]) {
            $this->postJson('/api/auth/masuk', ['email' => $email, 'password' => $password])
                ->assertStatus(422)
                ->assertExactJson(['kode' => 'validasi_gagal', 'pesan' => 'Email atau password salah.', 'rincian' => []]);
        }
    });

    it('akun tanpa password (Google) tidak bisa masuk dengan password', function () {
        DB::table('akun')->where('id', $this->akun->id)->update(['password' => null]);
        $this->postJson('/api/auth/masuk', ['email' => 'dina@contoh.test', 'password' => ''])->assertStatus(422);
    });

    it('5 kali gagal beruntun menunda 15 menit (S-5)', function () {
        foreach (range(1, 5) as $_) {
            $this->postJson('/api/auth/masuk', ['email' => 'dina@contoh.test', 'password' => 'salah-sekali'])->assertStatus(422);
        }
        $respons = $this->postJson('/api/auth/masuk', ['email' => 'dina@contoh.test', 'password' => 'rahasia-123'])->assertStatus(429);
        expect($respons->json('tunggu_detik'))->toBeGreaterThan(800)->toBeLessThanOrEqual(900);

        $this->travel(16)->minutes();
        $this->postJson('/api/auth/masuk', ['email' => 'dina@contoh.test', 'password' => 'rahasia-123'])->assertOk();
    });

    it('hash dengan parameter lama dihitung ulang saat masuk', function () {
        $lama = password_hash('rahasia-123', PASSWORD_ARGON2ID, ['memory_cost' => 2048, 'time_cost' => 1, 'threads' => 1]);
        DB::table('akun')->where('id', $this->akun->id)->update(['password' => $lama]);
        $this->postJson('/api/auth/masuk', ['email' => 'dina@contoh.test', 'password' => 'rahasia-123'])->assertOk();
        expect($this->akun->fresh()->password)->not->toBe($lama)->toStartWith('$argon2id$');
    });

    it('keluar menutup sesi', function () {
        $this->postJson('/api/auth/masuk', ['email' => 'dina@contoh.test', 'password' => 'rahasia-123'])->assertOk();
        $this->postJson('/api/auth/keluar')->assertNoContent();
        $this->getJson('/api/akun')->assertStatus(401)->assertJsonPath('kode', 'sesi_habis');
    });
});

describe('reset password', function () {
    beforeEach(fn () => $this->akun = Akun::factory()->create(['email' => 'dina@contoh.test', 'password' => 'rahasia-123']));

    function tokenDari(string $tautan): string
    {
        parse_str((string) parse_url($tautan, PHP_URL_QUERY), $q);

        return (string) $q['token'];
    }

    it('email tak dikenal tetap 204 tanpa mengirim apa pun', function () {
        $this->postJson('/api/auth/lupa-password', ['email' => 'siapa@contoh.test'])->assertNoContent();
        expect($this->email->terkirim)->toBe([]);
    });

    it('format email salah ditolak', function () {
        $this->postJson('/api/auth/lupa-password', ['email' => 'x'])->assertStatus(422)->assertJsonPath('rincian.email', 'Format email tidak valid.');
    });

    it('token sekali pakai mengganti password dan mencabut semua sesi', function () {
        sesiPalsu($this->akun, 'sesi-hp');
        $this->postJson('/api/auth/lupa-password', ['email' => 'Dina@contoh.test'])->assertNoContent();

        expect($this->email->terkirim)->toHaveCount(1);
        $tautan = $this->email->terkirim[0]['tautan'];
        expect($tautan)->toContain('/reset-password?token=')
            ->and(DB::table('password_reset_tokens')->value('token'))->not->toBe(tokenDari($tautan));

        $this->postJson('/api/auth/reset-password', ['token' => tokenDari($tautan), 'password' => 'baru-sekali-1'])->assertNoContent();
        expect(DB::table('sessions')->where('user_id', $this->akun->id)->count())->toBe(0);

        $this->postJson('/api/auth/masuk', ['email' => 'dina@contoh.test', 'password' => 'baru-sekali-1'])->assertOk();
        $this->postJson('/api/auth/reset-password', ['token' => tokenDari($tautan), 'password' => 'lagi-lagi-12'])
            ->assertStatus(422)
            ->assertJsonPath('kolom', 'token')
            ->assertJsonPath('rincian.token', 'Tautan tidak valid.');
    });

    it('token kedaluwarsa setelah 30 menit dan token lama batal saat diminta ulang', function () {
        $this->postJson('/api/auth/lupa-password', ['email' => 'dina@contoh.test']);
        $lama = tokenDari($this->email->terkirim[0]['tautan']);
        $this->postJson('/api/auth/lupa-password', ['email' => 'dina@contoh.test']);
        $baru = tokenDari($this->email->terkirim[1]['tautan']);

        $this->postJson('/api/auth/reset-password', ['token' => $lama, 'password' => 'baru-sekali-1'])->assertStatus(422);

        $this->travel(31)->minutes();
        $this->postJson('/api/auth/reset-password', ['token' => $baru, 'password' => 'baru-sekali-1'])->assertStatus(422);
    });

    it('password baru mengikuti aturan panjang', function () {
        $this->postJson('/api/auth/lupa-password', ['email' => 'dina@contoh.test']);
        $this->postJson('/api/auth/reset-password', ['token' => tokenDari($this->email->terkirim[0]['tautan']), 'password' => 'pendek'])
            ->assertStatus(422)->assertJsonPath('rincian.password', 'Password minimal 8 karakter.');
    });

    it('permintaan reset dibatasi 3 per jam', function () {
        foreach (range(1, 3) as $_) {
            $this->postJson('/api/auth/lupa-password', ['email' => 'dina@contoh.test'])->assertNoContent();
        }
        $this->postJson('/api/auth/lupa-password', ['email' => 'dina@contoh.test'])->assertStatus(429);
    });
});

describe('akun', function () {
    beforeEach(function () {
        $this->akun = Akun::factory()->create(['nama_tampil' => 'Dina', 'password' => 'rahasia-123']);
        $this->actingAs($this->akun);
    });

    it('mengubah nama tampil dan zona waktu', function () {
        $this->patchJson('/api/akun', ['nama_tampil' => '  Dina P  ', 'zona_waktu' => 'Asia/Jayapura'])
            ->assertOk()
            ->assertJson(['nama_tampil' => 'Dina P', 'zona_waktu' => 'Asia/Jayapura']);
    });

    it('menolak nama kosong dan zona tak dikenal', function () {
        $this->patchJson('/api/akun', ['nama_tampil' => '   '])->assertStatus(422)->assertJsonPath('rincian.nama_tampil', 'Nama tampil wajib diisi.');
        $this->patchJson('/api/akun', ['zona_waktu' => 'Mars/Olympus'])->assertStatus(422)->assertJsonPath('kolom', 'zona_waktu');
    });

    it('ganti password memeriksa password lama dan mencabut sesi lain', function () {
        sesiPalsu($this->akun, 'sesi-lain');

        $this->putJson('/api/akun/password', ['password_lama' => 'salah', 'password_baru' => 'baru-sekali-1'])
            ->assertStatus(422)->assertJsonPath('rincian.password_lama', 'Password lama salah.');
        $this->putJson('/api/akun/password', ['password_lama' => 'rahasia-123', 'password_baru' => 'pendek'])
            ->assertStatus(422)->assertJsonPath('rincian.password_baru', 'Password minimal 8 karakter.');

        $this->putJson('/api/akun/password', ['password_lama' => 'rahasia-123', 'password_baru' => 'baru-sekali-1'])->assertNoContent();
        expect(Hash::check('baru-sekali-1', $this->akun->fresh()->password))->toBeTrue()
            ->and(DB::table('sessions')->where('id', 'sesi-lain')->exists())->toBeFalse();
    });

    it('akun tanpa password bisa membuat password tanpa password lama', function () {
        DB::table('akun')->where('id', $this->akun->id)->update(['password' => null]);
        $this->actingAs($this->akun->fresh());

        $this->putJson('/api/akun/password', ['password_baru' => 'baru-sekali-1'])->assertNoContent();
        $this->getJson('/api/akun')->assertJsonPath('punya_password', true);
    });
});

it('sinkron hanya berisi data akun sendiri (N-61)', function () {
    $a = Akun::factory()->create();
    $this->actingAs($a);
    Transaksi::jalankan($a, '1', fn () => Projek::create(['nama' => 'Rahasia A', 'warna' => '#2e8b7a']));

    $this->actingAs(Akun::factory()->create());
    $this->getJson('/api/sinkron?sejak=0')->assertOk()->assertJsonPath('ubah', []);
});

it('login Google sementara diarahkan kembali ke halaman masuk', function () {
    $this->get('/auth/google/redirect')->assertRedirect('/masuk?galat=google_belum_tersedia');
});
