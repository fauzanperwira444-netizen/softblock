import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { akunApi, PASSWORD_MAX, PASSWORD_MIN } from '../../../api/akun'
import { ApiError } from '../../../api/errors'
import { Button, LinkButton } from '../../kit/Button'
import { Alert, Badge } from '../../kit/display'
import { PasswordField } from '../../kit/fields'
import { galatForm, TANPA_GALAT, type FormGalat } from '../../formGalat'
import { usePageTitle } from '../../usePageTitle'
import { AuthLayout, KepalaKartu } from './AuthLayout'
import { tautanKembali } from './LupaPasswordPage'

function ambilToken(): string | null {
  return new URL(window.location.href).searchParams.get('token')
}

// Token dihapus dari alamat agar tidak tersimpan di riwayat peramban.
function hapusTokenDariAlamat() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('token')) return
  url.searchParams.delete('token')
  window.history.replaceState(window.history.state, '', url.pathname + url.search)
}

export function ResetPasswordPage() {
  usePageTitle('Reset password')
  const [token] = useState(ambilToken)
  const [password, setPassword] = useState('')
  const [galat, setGalat] = useState<FormGalat>(TANPA_GALAT)
  const [proses, setProses] = useState(false)
  const [hasil, setHasil] = useState<'isi' | 'berhasil' | 'tidak_valid'>(token ? 'isi' : 'tidak_valid')

  useEffect(hapusTokenDariAlamat, [])

  async function kirim(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    if (password.length < PASSWORD_MIN) {
      setGalat({ kolom: { password: `Password minimal ${PASSWORD_MIN} karakter.` } })
      return
    }
    setProses(true)
    setGalat(TANPA_GALAT)
    try {
      await akunApi.resetPassword(token, password)
      setHasil('berhasil')
    } catch (err) {
      if (err instanceof ApiError && err.rincian.token) setHasil('tidak_valid')
      else setGalat(galatForm(err))
    } finally {
      setProses(false)
    }
  }

  return (
    <AuthLayout subjudul="Pemulihan akses" langkah={hasil}>
      {hasil === 'tidak_valid' && (
        <>
          <KepalaKartu
            icon="link_off"
            tone="danger"
            tengah
            judul="Tautan tidak valid"
            sub="Tautan ini sudah dipakai, kedaluwarsa, atau tidak lengkap. Setiap tautan reset hanya bisa dibuka sekali dalam 30 menit."
          />
          <LinkButton to="/lupa-password" size="lg" block>
            Minta tautan baru
          </LinkButton>
        </>
      )}

      {hasil === 'berhasil' && (
        <>
          <KepalaKartu icon="check_circle" tone="sage" tengah judul="Password diperbarui" sub="Silakan masuk dengan password baru." />
          <LinkButton to="/masuk" size="lg" block iconEnd="arrow_forward">
            Masuk sekarang
          </LinkButton>
        </>
      )}

      {hasil === 'isi' && (
        <>
          <span className="self-start">
            <Badge kind="info" icon="key">
              Langkah 2 dari 2
            </Badge>
          </span>
          <KepalaKartu judul="Buat password baru" sub="Pakai password ini saat masuk berikutnya." />
          <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
            {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
            <PasswordField
              label="Password baru"
              autoComplete="new-password"
              meter
              maxLength={PASSWORD_MAX}
              hint={`${PASSWORD_MIN}–${PASSWORD_MAX} karakter.`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={galat.kolom.password}
            />
            <Button type="submit" size="lg" block icon="lock_reset" busy={proses}>
              Simpan password
            </Button>
          </form>
          <Link to="/masuk" className={tautanKembali}>
            Batal dan kembali ke Masuk
          </Link>
        </>
      )}
    </AuthLayout>
  )
}
