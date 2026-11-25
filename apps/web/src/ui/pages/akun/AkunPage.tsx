import { AnimatePresence, motion } from 'motion/react'
import { useId, useState, type FormEvent } from 'react'
import { akunApi, NAMA_TAMPIL_MAX, PASSWORD_MAX, PASSWORD_MIN, type Akun } from '../../../api/akun'
import { useAuth } from '../../../app/auth'
import { useBolehUbah, useData } from '../../../data/DataProvider'
import { Button } from '../../kit/Button'
import { Alert, Badge, Card, CardTitle } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import { PasswordField, SelectField, TextField } from '../../kit/fields'
import { SPRING_SNAPPY } from '../../motion'
import { LightConfirmDialog } from '../../overlay/ConfirmDialog'
import { galatForm, TANPA_GALAT, type FormGalat } from '../../formGalat'
import { Page } from '../../shell/Page'
import { usePasangAplikasi } from '../../../app/pwa'
import { usePageTitle } from '../../usePageTitle'
import { useTampilkanPengenalanLagi } from '../../pengenalan/Pengenalan'
import { GoogleMark } from '../auth/AuthLayout'

const ZONA_INDONESIA = [
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB, UTC+7)' },
  { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA, UTC+8)' },
  { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT, UTC+9)' },
]

const ID_PASSWORD_BARU = 'password-baru'

function zonaLain(): string[] {
  const indonesia = new Set(ZONA_INDONESIA.map((z) => z.value))
  return Intl.supportedValuesOf('timeZone').filter((z) => !indonesia.has(z))
}

function Tersimpan({ tampil }: { tampil: boolean }) {
  return (
    <span role="status" className="inline-flex min-h-11 items-center">
      <AnimatePresence>
        {tampil && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING_SNAPPY}
            className="inline-flex items-center gap-1 text-body-md font-semibold text-primary"
          >
            <Icon name="check_circle" size={18} />
            Tersimpan
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

function Aksi({ children }: { children: React.ReactNode }) {
  const { alasan } = useBolehUbah()
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {alasan && (
        <p className="mr-auto flex items-center gap-1.5 text-body-sm text-ink-muted">
          <Icon name="lock" size={16} />
          {alasan}
        </p>
      )}
      {children}
    </div>
  )
}

function FormNama({ akun }: { akun: Akun }) {
  const { boleh } = useBolehUbah()
  const { perbarui } = useAuth()
  const judulId = useId()
  const [nama, setNama] = useState(akun.nama_tampil)
  const [galat, setGalat] = useState<FormGalat>(TANPA_GALAT)
  const [proses, setProses] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)

  async function kirim(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) {
      setGalat({ kolom: { nama_tampil: 'Nama tampil wajib diisi.' } })
      return
    }
    setProses(true)
    setGalat(TANPA_GALAT)
    try {
      perbarui(await akunApi.ubah({ nama_tampil: nama }))
      setTersimpan(true)
    } catch (err) {
      setGalat(galatForm(err))
    } finally {
      setProses(false)
    }
  }

  return (
    <Card aria-labelledby={judulId} className="flex flex-col gap-4">
      <CardTitle icon="badge" id={judulId}>
        Informasi profil
      </CardTitle>
      <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        <TextField
          label="Alamat email"
          icon="mail"
          value={akun.email}
          readOnly
          hint={akun.tertaut_google ? 'Email terikat dengan akun Google dan tidak bisa diubah.' : 'Email tidak bisa diubah.'}
          headRight={
            <Badge icon="lock">{akun.tertaut_google ? 'Terkunci (Google)' : 'Terkunci'}</Badge>
          }
        />
        <TextField
          label="Nama tampil"
          maxLength={NAMA_TAMPIL_MAX}
          value={nama}
          onChange={(e) => {
            setNama(e.target.value)
            setTersimpan(false)
          }}
          error={galat.kolom.nama_tampil}
        />
        <Aksi>
          <Tersimpan tampil={tersimpan} />
          <Button type="submit" icon="check" busy={proses} disabled={!boleh || nama.trim() === akun.nama_tampil}>
            Simpan nama
          </Button>
        </Aksi>
      </form>
    </Card>
  )
}

function FormZona({ akun }: { akun: Akun }) {
  const { boleh } = useBolehUbah()
  const { perbarui } = useAuth()
  const judulId = useId()
  const [zona, setZona] = useState(akun.zona_waktu)
  const [galat, setGalat] = useState<FormGalat>(TANPA_GALAT)
  const [proses, setProses] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)
  const [lain] = useState(zonaLain)

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setProses(true)
    setGalat(TANPA_GALAT)
    try {
      perbarui(await akunApi.ubah({ zona_waktu: zona }))
      setTersimpan(true)
    } catch (err) {
      setGalat(galatForm(err))
    } finally {
      setProses(false)
    }
  }

  return (
    <Card aria-labelledby={judulId} className="flex flex-col gap-4">
      <CardTitle icon="schedule" id={judulId}>
        Preferensi waktu
      </CardTitle>
      <form onSubmit={kirim} className="flex flex-col gap-4">
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        <SelectField
          label="Zona waktu aktif"
          value={zona}
          onChange={(e) => {
            setZona(e.target.value)
            setTersimpan(false)
          }}
          error={galat.kolom.zona_waktu}
          hint="Menentukan kapan hari berganti. Berlaku ke depan; hari yang sudah lewat tidak dihitung ulang."
        >
          <optgroup label="Indonesia">
            {ZONA_INDONESIA.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Lainnya">
            {lain.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </optgroup>
        </SelectField>
        <Aksi>
          <Tersimpan tampil={tersimpan} />
          <Button type="submit" variant="sage" icon="update" busy={proses} disabled={!boleh || zona === akun.zona_waktu}>
            Simpan zona waktu
          </Button>
        </Aksi>
      </form>
    </Card>
  )
}

function FormPassword({ akun }: { akun: Akun }) {
  const { boleh } = useBolehUbah()
  const { perbarui } = useAuth()
  const judulId = useId()
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [galat, setGalat] = useState<FormGalat>(TANPA_GALAT)
  const [proses, setProses] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)

  async function kirim(e: FormEvent) {
    e.preventDefault()
    const kolom: Record<string, string> = {}
    if (akun.punya_password && !lama) kolom.password_lama = 'Password lama wajib diisi.'
    if (baru.length < PASSWORD_MIN) kolom.password_baru = `Password minimal ${PASSWORD_MIN} karakter.`
    if (Object.keys(kolom).length > 0) {
      setGalat({ kolom })
      return
    }
    setProses(true)
    setGalat(TANPA_GALAT)
    try {
      await akunApi.gantiPassword(akun.punya_password ? { password_lama: lama, password_baru: baru } : { password_baru: baru })
      if (!akun.punya_password) perbarui({ ...akun, punya_password: true })
      setLama('')
      setBaru('')
      setTersimpan(true)
    } catch (err) {
      setGalat(galatForm(err))
    } finally {
      setProses(false)
    }
  }

  return (
    <Card aria-labelledby={judulId} className="flex flex-col gap-4">
      <CardTitle icon="lock_reset" id={judulId} end={<Badge kind="netral">Keamanan</Badge>}>
        {akun.punya_password ? 'Ganti password' : 'Buat password'}
      </CardTitle>
      <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        {akun.punya_password && (
          <PasswordField
            label="Password lama"
            autoComplete="current-password"
            value={lama}
            onChange={(e) => setLama(e.target.value)}
            error={galat.kolom.password_lama}
          />
        )}
        <PasswordField
          id={ID_PASSWORD_BARU}
          label="Password baru"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          meter
          maxLength={PASSWORD_MAX}
          hint={`Rentang ${PASSWORD_MIN}–${PASSWORD_MAX} karakter.`}
          value={baru}
          onChange={(e) => {
            setBaru(e.target.value)
            setTersimpan(false)
          }}
          error={galat.kolom.password_baru}
        />
        <Aksi>
          <Tersimpan tampil={tersimpan} />
          <Button type="submit" icon="password" busy={proses} disabled={!boleh}>
            {akun.punya_password ? 'Ganti password' : 'Buat password'}
          </Button>
        </Aksi>
      </form>
    </Card>
  )
}

function KartuKeluar() {
  const { keluar } = useAuth()
  const judulId = useId()
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [proses, setProses] = useState(false)
  const [galat, setGalat] = useState<string>()

  async function prosesKeluar() {
    setProses(true)
    setGalat(undefined)
    try {
      await keluar()
    } catch (err) {
      setGalat(galatForm(err).umum)
      setProses(false)
    }
  }

  return (
    <Card aria-labelledby={judulId} className="flex flex-col gap-4 shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--sb-danger)_35%,transparent),var(--sb-shadow-convex)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={judulId} className="flex items-center gap-2.5 text-headline-md text-danger">
          <Icon name="logout" />
          Keluar sesi
        </h2>
        <span className="rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.04em] text-danger shadow-[inset_0_0_0_1px_var(--sb-danger)]">
          Zona bahaya
        </span>
      </div>
      <p className="text-body-md text-ink-muted">Keluar dari perangkat ini saja. Salinan data di peramban ini ikut dihapus.</p>
      <div>
        <Button
          variant="tactile"
          icon="power_settings_new"
          onClick={() => setKonfirmasi(true)}
          className="text-danger shadow-[inset_0_0_0_1.5px_var(--sb-danger),var(--sb-shadow-button)] hover:text-danger"
        >
          Keluar dari perangkat ini
        </Button>
      </div>
      <LightConfirmDialog
        open={konfirmasi}
        onClose={() => setKonfirmasi(false)}
        onConfirm={prosesKeluar}
        title="Keluar dari perangkat ini?"
        description="Salinan data di peramban ini dihapus. Perangkat lain tetap masuk."
        icon="logout"
        confirmLabel="Keluar"
        busy={proses}
        error={galat}
      />
    </Card>
  )
}

function BannerGoogle() {
  function keFormPassword() {
    const el = document.getElementById(ID_PASSWORD_BARU)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus({ preventScroll: true })
  }
  return (
    <Card className="flex flex-wrap items-center gap-6">
      <span className="inline-flex size-13 items-center justify-center rounded-full bg-card tactile-button" aria-hidden="true">
        <GoogleMark />
      </span>
      <div className="min-w-0 flex-[1_1_320px]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-headline-md">Masuk lewat akun Google</h2>
          <Badge kind="info" icon="verified">
            Otentikasi utama
          </Badge>
        </div>
        <p className="mt-1.5 text-body-md text-ink-muted">
          Akun ini masuk lewat Google dan belum punya password. Buat password agar bisa masuk dengan email juga.
        </p>
      </div>
      <Button variant="tactile" icon="key" onClick={keFormPassword}>
        Buat password
      </Button>
    </Card>
  )
}

/** Pemasangan PWA hanya ditawarkan bila browser mendukung dan aplikasi belum terpasang. */
function KartuPasang() {
  const { bisa, pasang } = usePasangAplikasi()
  const judulId = useId()
  if (!bisa) return null
  return (
    <Card aria-labelledby={judulId} className="flex flex-col gap-4">
      <CardTitle icon="install_desktop" id={judulId}>
        Pasang aplikasi
      </CardTitle>
      <p className="text-ink-muted">Buka Softblock dari layar utama atau menu aplikasi, termasuk saat offline dengan data terakhir.</p>
      <div>
        <Button variant="tactile" icon="install_desktop" onClick={() => void pasang()}>
          Pasang Softblock
        </Button>
      </div>
    </Card>
  )
}

/** O-06: menghapus status pengenalan di perangkat ini lalu membuka pengenalan awal. */
function KartuPengenalan() {
  const tampilkanLagi = useTampilkanPengenalanLagi()
  const { koneksi } = useData()
  const judulId = useId()
  if (!tampilkanLagi) return null
  const offline = koneksi === 'offline'
  return (
    <Card aria-labelledby={judulId} className="flex flex-col gap-4">
      <CardTitle icon="tour" id={judulId}>
        Pengenalan fitur
      </CardTitle>
      <p className="text-ink-muted">
        Lihat lagi ringkasan tiap menu dan penjelasan tiap halaman. Statusnya hanya disimpan di perangkat ini.
      </p>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {offline && (
          <p className="mr-auto flex items-center gap-1.5 text-body-sm text-ink-muted">
            <Icon name="lock" size={16} />
            Tidak tersedia saat offline. Sambungkan internet dulu.
          </p>
        )}
        <Button variant="tactile" icon="replay" disabled={offline} onClick={tampilkanLagi}>
          Tampilkan pengenalan lagi
        </Button>
      </div>
    </Card>
  )
}

export function AkunPage() {
  usePageTitle('Akun')
  const { akun } = useAuth()
  if (!akun) return null

  return (
    <Page title="Akun pengguna" subtitle="Kelola identitas, password, dan zona waktu kerja kamu.">
      {akun.tertaut_google && !akun.punya_password && <BannerGoogle />}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <FormNama akun={akun} />
          <FormZona akun={akun} />
        </div>
        <div className="flex flex-col gap-6">
          <FormPassword akun={akun} />
          <KartuPasang />
          <KartuPengenalan />
          <KartuKeluar />
        </div>
      </div>
    </Page>
  )
}
