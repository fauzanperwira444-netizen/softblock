import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { akunApi } from '../../../api/akun'
import { MODE_MOCK } from '../../../api/mode'
import { Button } from '../../kit/Button'
import { Alert, Badge } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import { TextField } from '../../kit/fields'
import { galatForm, TANPA_GALAT, type FormGalat } from '../../formGalat'
import { usePageTitle } from '../../usePageTitle'
import { AuthLayout, KepalaKartu } from './AuthLayout'

export const tautanKembali =
  'inline-flex min-h-11 items-center gap-1 self-center rounded-full px-3 text-body-md font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline'

export function LupaPasswordPage() {
  usePageTitle('Lupa password')
  const [email, setEmail] = useState('')
  const [galat, setGalat] = useState<FormGalat>(TANPA_GALAT)
  const [proses, setProses] = useState(false)
  const [terkirim, setTerkirim] = useState(false)

  async function kirim(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setGalat({ kolom: { email: 'Email wajib diisi.' } })
      return
    }
    setProses(true)
    setGalat(TANPA_GALAT)
    try {
      await akunApi.lupaPassword(email)
      setTerkirim(true)
    } catch (err) {
      setGalat(galatForm(err))
    } finally {
      setProses(false)
    }
  }

  return (
    <AuthLayout subjudul="Pemulihan akses" langkah={terkirim ? 'terkirim' : 'isi'}>
      {terkirim ? (
        <>
          <KepalaKartu
            icon="mark_email_unread"
            judul="Cek email kamu"
            tengah
            sub={
              <>
                Bila <b className="text-ink">{email.trim()}</b> terdaftar, tautan reset sudah dikirim. Tautan berlaku 30
                menit dan hanya bisa dipakai sekali.
              </>
            }
          />
          {MODE_MOCK && <Alert tone="info">Mode mock: tautan reset dicetak di konsol peramban.</Alert>}
          <Button variant="tactile" size="lg" block icon="edit" onClick={() => setTerkirim(false)}>
            Ganti email
          </Button>
          <Link to="/masuk" className={tautanKembali}>
            <Icon name="arrow_back" size={18} />
            Kembali ke Masuk
          </Link>
        </>
      ) : (
        <>
          <span className="self-start">
            <Badge kind="info" icon="key">
              Langkah 1 dari 2
            </Badge>
          </span>
          <KepalaKartu judul="Lupa password" sub="Masukkan email akunmu. Kami kirim tautan untuk membuat password baru." />
          <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
            {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
            <TextField
              label="Email akun"
              icon="alternate_email"
              type="email"
              autoComplete="email"
              placeholder="nama@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={galat.kolom.email}
            />
            <Button type="submit" size="lg" block iconEnd="arrow_forward" busy={proses}>
              Kirim tautan reset
            </Button>
          </form>
          <Link to="/masuk" className={tautanKembali}>
            <Icon name="arrow_back" size={18} />
            Kembali ke Masuk
          </Link>
          <Alert tone="info" title="Masuk lewat Google dan belum punya password?">
            Alur ini juga membuat password pertamamu.
          </Alert>
        </>
      )}
    </AuthLayout>
  )
}
