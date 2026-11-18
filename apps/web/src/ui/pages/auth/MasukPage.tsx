import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../../../app/auth'
import { Button } from '../../kit/Button'
import { Alert } from '../../kit/display'
import { PasswordField, TextField } from '../../kit/fields'
import { galatForm, TANPA_GALAT, type FormGalat } from '../../formGalat'
import { usePageTitle } from '../../usePageTitle'
import { AuthLayout, Garis, KepalaKartu, Pemisah, tautan, TombolGoogle } from './AuthLayout'

export function MasukPage() {
  usePageTitle('Masuk')
  const { masuk, masukGoogle } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [galat, setGalat] = useState<FormGalat>(TANPA_GALAT)
  const [proses, setProses] = useState<'email' | 'google' | null>(null)

  const ke = params.get('ke')
  const sesiHabis = params.get('sesi') === 'habis'
  const lanjutan = ke ? `?ke=${encodeURIComponent(ke)}` : ''

  async function kirim(e: FormEvent) {
    e.preventDefault()
    const kolom: Record<string, string> = {}
    if (!email.trim()) kolom.email = 'Email wajib diisi.'
    if (!password) kolom.password = 'Password wajib diisi.'
    if (Object.keys(kolom).length > 0) {
      setGalat({ kolom })
      return
    }
    setProses('email')
    setGalat(TANPA_GALAT)
    try {
      await masuk(email, password)
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
    <AuthLayout>
      <KepalaKartu icon="login" judul="Masuk" sub="Masuk untuk membuka rencana kerjamu." tengah />
      <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
        {sesiHabis && !galat.umum && <Alert tone="info">Sesi habis. Masuk lagi untuk melanjutkan.</Alert>}
        {galat.umum && (
          <Alert tone="error" icon={galat.terkunci ? 'lock_clock' : 'error'}>
            {galat.umum}
          </Alert>
        )}
        <TextField
          label="Email"
          icon="mail"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={galat.kolom.email}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={galat.kolom.password}
          headRight={
            <Link to="/lupa-password" className="text-[0.8125rem] font-semibold text-primary underline-offset-4 hover:underline">
              Lupa password?
            </Link>
          }
        />
        <Button type="submit" size="lg" block iconEnd="arrow_forward" busy={proses === 'email'} disabled={proses === 'google'}>
          Masuk
        </Button>
      </form>
      <Pemisah />
      <TombolGoogle label="Masuk dengan Google" onClick={google} busy={proses === 'google'} />
      <Garis />
      <p className="text-center text-[0.9375rem] text-ink-muted">
        Belum punya akun?{' '}
        <Link to={`/daftar${lanjutan}`} className={tautan}>
          Daftar
        </Link>
      </p>
    </AuthLayout>
  )
}
