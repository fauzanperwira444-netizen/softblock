import { useState, type ReactNode } from 'react'
import { KUNCI_SIMULASI, type SimulasiJaringan } from '../../../api/mock/handlers'
import { Button, IconButton, LinkButton } from '../../kit/Button'
import { ProgressStepper, SegmentedControl } from '../../kit/controls'
import { Alert, Badge, Card, Chip, EmptyState, FilterChip, Spinner } from '../../kit/display'
import { PasswordField, SelectField, TextareaField, TextField } from '../../kit/fields'
import { HeavyConfirmDialog, LightConfirmDialog } from '../../overlay/ConfirmDialog'
import { Dialog } from '../../overlay/Dialog'
import { usePageTitle } from '../../usePageTitle'

function Contoh({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <Card aria-label={judul}>
      <h2 className="mb-4 text-headline-md">{judul}</h2>
      {children}
    </Card>
  )
}

const PILIHAN_SIMULASI: Array<{ value: SimulasiJaringan; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'lambat', label: 'Lambat (10 dtk)' },
  { value: 'mati', label: 'Server mati' },
  { value: 'usang', label: 'Klien usang' },
]

/** Mengatur perilaku /api/kesehatan dan /api/sinkron di mock untuk mencoba bilah status. */
function SimulasiJaringanPanel() {
  const [nilai, setNilai] = useState<SimulasiJaringan>(() => {
    try {
      return (localStorage.getItem(KUNCI_SIMULASI) as SimulasiJaringan | null) ?? 'normal'
    } catch {
      return 'normal'
    }
  })
  function pilih(v: SimulasiJaringan) {
    setNilai(v)
    try {
      localStorage.setItem(KUNCI_SIMULASI, v)
    } catch {
      // Penyimpanan diblokir; simulasi tetap Normal.
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl label="Perilaku server" value={nilai} onChange={pilih} options={PILIHAN_SIMULASI} />
      <p className="text-body-sm text-ink-muted">
        Buka atau muat ulang Dashboard setelah memilih. Untuk Offline, matikan jaringan di DevTools peramban.
      </p>
      <div>
        <LinkButton to="/" variant="tactile" icon="dashboard">
          Buka Dashboard
        </LinkButton>
      </div>
    </div>
  )
}

/** Katalog komponen untuk peninjauan di dev; tidak ikut ke build produksi. */
export function KitPage() {
  usePageTitle('Katalog komponen')
  const [progress, setProgress] = useState(4)
  const [tujuan, setTujuan] = useState<'sesi' | 'mandiri'>('sesi')
  const [aktif, setAktif] = useState(true)
  const [nama, setNama] = useState('Revisi bab 2')
  const [deskripsi, setDeskripsi] = useState('')
  const [form, setForm] = useState(false)
  const [panel, setPanel] = useState(false)
  const [berat, setBerat] = useState(false)
  const [ringan, setRingan] = useState(false)

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 lg:p-10">
      <h1 className="text-headline-xl">Katalog komponen</h1>

      <Contoh judul="Simulasi jaringan (mock)">
        <SimulasiJaringanPanel />
      </Contoh>

      <Contoh judul="Tombol">
        <div className="flex flex-wrap items-center gap-3">
          <Button icon="add">Tambah task</Button>
          <Button variant="sage">Simpan nama</Button>
          <Button variant="tactile" icon="logout">
            Keluar
          </Button>
          <Button variant="outline">Kembali</Button>
          <Button variant="danger">Ya, batalkan projek</Button>
          <Button busy>Menyimpan</Button>
          <Button disabled>Nonaktif</Button>
          <IconButton icon="edit" label="Ubah projek" />
          <IconButton icon="close" label="Tutup" tone="plain" />
        </div>
      </Contoh>

      <Contoh judul="Isian">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nama task" required maxLength={30} value={nama} onChange={(e) => setNama(e.target.value)} />
          <TextField label="Nama projek" value="Skripsi" readOnly error="Nama projek sudah dipakai." />
          <PasswordField label="Password" value="rahasia" readOnly />
          <SelectField label="Sesi" defaultValue="2">
            <option value="1">Sesi 1</option>
            <option value="2">Sesi 2</option>
          </SelectField>
          <div className="md:col-span-2">
            <TextareaField label="Deskripsi" maxLength={1000} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
          </div>
          <SegmentedControl
            label="Tujuan task"
            value={tujuan}
            onChange={setTujuan}
            options={[
              { value: 'sesi', label: 'Di sesi projek' },
              { value: 'mandiri', label: 'Mandiri' },
            ]}
          />
        </div>
      </Contoh>

      <Contoh judul="Chip, badge, filter">
        <div className="flex flex-wrap items-center gap-2">
          <Chip kind="projek" color="#406653">
            Skripsi
          </Chip>
          <Chip kind="label">Rumah</Chip>
          <Badge kind="telat" icon="event_busy">
            Telat
          </Badge>
          <Badge kind="konteks">
            Di luar periode
          </Badge>
          <Badge>Selesai</Badge>
          <Badge kind="netral-garis">Batal</Badge>
          <FilterChip pressed={aktif} onToggle={() => setAktif((a) => !a)}>
            Aktif
          </FilterChip>
        </div>
      </Contoh>

      <Contoh judul="Progress">
        <div className="flex max-w-lg flex-col gap-4">
          <ProgressStepper value={progress} onChange={setProgress} taskName="Revisi bab 2" />
          <ProgressStepper value={10} taskName="Kirim proposal" disabled disabledReason="Task sudah selesai." />
        </div>
      </Contoh>

      <Contoh judul="Status">
        <div className="grid gap-4 md:grid-cols-2">
          <Alert tone="error" title="Gagal menyimpan">
            Server tidak menjawab.
          </Alert>
          <Alert tone="success">Password baru sudah tersimpan.</Alert>
          <Alert tone="info">Sesi habis. Masuk lagi untuk melanjutkan.</Alert>
          <Spinner label="Memuat data…" />
          <div className="md:col-span-2">
            <EmptyState title="Belum ada task" action={<Button icon="add">Tambah task</Button>}>
              Task yang kamu buat akan muncul di sini.
            </EmptyState>
          </div>
        </div>
      </Contoh>

      <Contoh judul="Overlay">
        <div className="flex flex-wrap gap-3">
          <Button variant="tactile" onClick={() => setForm(true)}>
            Buka formulir
          </Button>
          <Button variant="tactile" onClick={() => setPanel(true)}>
            Buka panel
          </Button>
          <Button variant="tactile" onClick={() => setBerat(true)}>
            Konfirmasi berat
          </Button>
          <Button variant="tactile" onClick={() => setRingan(true)}>
            Konfirmasi ringan
          </Button>
        </div>
      </Contoh>

      <Dialog
        open={form}
        onClose={() => setForm(false)}
        title="Tambah sesi"
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(false)}>
              Batal
            </Button>
            <Button onClick={() => setForm(false)}>Simpan sesi</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <TextField label="Nama sesi" required maxLength={45} value={nama} onChange={(e) => setNama(e.target.value)} />
          <Button variant="sage" onClick={() => setBerat(true)} className="self-start">
            Uji dialog di atas formulir
          </Button>
        </div>
      </Dialog>

      <Dialog open={panel} onClose={() => setPanel(false)} title="Revisi bab 2" description="Skripsi · Sesi 2" kind="panel">
        <ProgressStepper value={progress} onChange={setProgress} taskName="Revisi bab 2" />
      </Dialog>

      <HeavyConfirmDialog
        open={berat}
        onClose={() => setBerat(false)}
        onConfirm={() => setBerat(false)}
        title="Batalkan projek Skripsi?"
        confirmLabel="Ya, batalkan projek"
        akanTerjadi={['3 task aktif dibatalkan', 'Sesi 2 dan Sesi 3 dibatalkan']}
        tetapAda={['Task yang sudah selesai', 'Riwayat progress']}
        takBisaDiurungkan
      />

      <LightConfirmDialog
        open={ringan}
        onClose={() => setRingan(false)}
        onConfirm={() => setRingan(false)}
        title="Hapus label Rumah?"
        confirmLabel="Hapus label"
      >
        Label ini belum dipakai task mana pun.
      </LightConfirmDialog>
    </main>
  )
}
