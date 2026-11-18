import { useId, useState, type FormEvent } from 'react'
import { MODE_MOCK } from '../../api/mode'
import { useAuth } from '../../app/auth'
import { useData } from '../../data/DataProvider'
import { simpanDraf } from '../../data/penyimpanan'
import { kumpulkanDraf } from '../drafFormulir'
import { galatForm } from '../formGalat'
import { Button } from '../kit/Button'
import { Alert } from '../kit/display'
import { PasswordField, TextField } from '../kit/fields'
import { Dialog } from '../overlay/Dialog'

/**
 * U-13: satu-satunya dialog yang boleh menumpuk di atas formulir. Email terkunci ke akun yang sama
 * dan tidak ada Batal, agar isian formulir di bawahnya tetap ada.
 */
export function DialogLoginUlang() {
  const { akun, loginUlang, masukUlang, masukGoogle, keluar } = useAuth()
  const { segarkan } = useData()
  const formId = useId()
  const [password, setPassword] = useState('')
  const [galat, setGalat] = useState<string | null>(null)
  const [proses, setProses] = useState<'password' | 'google' | null>(null)

  async function kirim(e: FormEvent) {
    e.preventDefault()
    if (!password) {
      setGalat('Isi password.')
      return
    }
    setProses('password')
    setGalat(null)
    try {
      await masukUlang(password)
      setPassword('')
      segarkan()
    } catch (err) {
      setGalat(galatForm(err).umum ?? 'Gagal masuk.')
    } finally {
      setProses(null)
    }
  }

  async function google() {
    if (!akun) return
    setProses('google')
    setGalat(null)
    try {
      // Pengalihan halaman penuh menghapus isian; simpan dulu ke draf_formulir (DA-10).
      if (!MODE_MOCK) await simpanDraf(akun.id, kumpulkanDraf())
      await masukGoogle()
      segarkan()
    } catch (err) {
      setGalat(galatForm(err).umum ?? 'Gagal masuk dengan Google.')
    } finally {
      setProses(null)
    }
  }

  return (
    <Dialog
      open={loginUlang && !!akun}
      onClose={() => undefined}
      closable={false}
      kind="confirm"
      title="Sesi habis"
      description="Masuk lagi untuk melanjutkan. Isian formulirmu tetap ada."
      glyph={{ icon: 'lock_clock' }}
      footer={
        <>
          <Button variant="ghost" className="sm:mr-auto" onClick={() => void keluar()}>
            Keluar
          </Button>
          {akun?.punya_password && (
            <Button type="submit" form={formId} icon="login" busy={proses === 'password'}>
              Masuk lagi
            </Button>
          )}
        </>
      }
    >
      <form id={formId} onSubmit={kirim} noValidate className="flex flex-col gap-4">
        <TextField label="Email" type="email" value={akun?.email ?? ''} readOnly icon="lock" hint="Terkunci ke akun yang sedang dipakai." />
        {akun?.punya_password && (
          <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} data-autofocus />
        )}
        {akun?.tertaut_google && (
          <Button type="button" variant="outline" block={!akun.punya_password} busy={proses === 'google'} onClick={() => void google()}>
            Masuk dengan Google
          </Button>
        )}
        {galat && <Alert tone="error">{galat}</Alert>}
      </form>
    </Dialog>
  )
}
