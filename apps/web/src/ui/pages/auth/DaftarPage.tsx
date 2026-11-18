import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { NAMA_TAMPIL_MAX, PASSWORD_MAX, PASSWORD_MIN } from '../../../api/akun'
import { useAuth } from '../../../app/auth'
import { Button } from '../../kit/Button'
import { Alert } from '../../kit/display'
import { PasswordField, TextField } from '../../kit/fields'
import { galatForm, TANPA_GALAT, type FormGalat } from '../../formGalat'
import { usePageTitle } from '../../usePageTitle'
import { AuthLayout, Garis, KepalaKartu, Pemisah, tautan, TombolGoogle } from './AuthLayout'

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function DaftarPage() {
  usePageTitle('Daftar')
  const { daftar, masukGoogle } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [ulangi, setUlangi] = useState('')
  const [password, setPassword] = useState('')
  const [nama, setNama] = useState('')
  const [galat, setGalat] = useState<FormGalat>(TANPA_GALAT)
  const [proses, setProses] = useState<'email' | 'google' | null>(null)

  const ke = params.get('ke')
  const keMasuk = ke ? `/masuk?ke=${encodeURIComponent(ke)}` : '/masuk'

  function periksa(): Record<string, string> {
    const kolom: Record<string, string> = {}
    if (!POLA_EMAIL.test(email.trim())) kolom.email = 'Masukkan email yang valid.'
    if (ulangi.trim().toLowerCase() !== email.trim().toLowerCase()) kolom.ulangi = 'Email tidak sama dengan yang di atas.'
    if (password.length < PASSWORD_MIN) kolom.password = `Password minimal ${PASSWORD_MIN} karakter.`
    return kolom
  }

  async function kirim(e: FormEvent) {
    e.preventDefault()
    const kolom = periksa()
    if (Object.keys(kolom).length > 0) {
      setGalat({ kolom })
      return
    }
    setProses('email')
    setGalat(TANPA_GALAT)
    try {
      await daftar({ email, password, nama_tampil: nama })
    } catch (err) {
      setGalat(galatForm(err))
      setProses(null)
    }
  }

  async function google() {
    setProses('google')
    try {
      await masukGoogle()
    } catch (err) {
      setGalat(galatForm(err))
      setProses(null)
    }
  }

  return (
    <AuthLayout
      kanan={
        <p className="text-body-md text-ink-muted">
          Sudah punya akun?{' '}
          <Link to={keMasuk} className={tautan}>
            Masuk
          </Link>
        </p>
      }
    >
      <KepalaKartu judul="Daftar" sub="Buat akun. Data tiap akun terpisah penuh." />
      <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        <TextField
          label="Email"
          icon="alternate_email"
          type="email"
          autoComplete="email"
          placeholder="nama@domain.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={galat.kolom.email}
        />
        <TextField
          label="Ulangi email"
          icon="mark_email_read"
          type="email"
          autoComplete="email"
          placeholder="Ketik ulang email kamu"
          required
          value={ulangi}
          onChange={(e) => setUlangi(e.target.value)}
          error={galat.kolom.ulangi}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          required
          meter
          maxLength={PASSWORD_MAX}
          hint={`Rentang ${PASSWORD_MIN}–${PASSWORD_MAX} karakter.`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={galat.kolom.password}
        />
        <TextField
          label="Nama tampil (opsional)"
          icon="badge"
          autoComplete="nickname"
          placeholder="Contoh: Cah Anggara"
          maxLength={NAMA_TAMPIL_MAX}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          error={galat.kolom.nama_tampil}
        />
        <Button type="submit" size="lg" block iconEnd="arrow_forward" busy={proses === 'email'} disabled={proses === 'google'}>
          Daftar
        </Button>
      </form>
      <Pemisah />
      <TombolGoogle label="Daftar dengan Google" onClick={google} busy={proses === 'google'} />
      <Garis />
      <p className="text-center text-[0.9375rem] text-ink-muted">
        Sudah punya akun?{' '}
        <Link to={keMasuk} className={tautan}>
          Masuk
        </Link>
      </p>
    </AuthLayout>
  )
}
