import { useId, useState, type FormEvent } from 'react'
import { jadwalApi } from '../../api/jadwal'
import { useMutasi } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { jadwalBerakhir } from '../../domain/jadwal'
import { cx } from '../cx'
import { SegmentedControl } from '../kit/controls'
import { Alert } from '../kit/display'
import { Icon } from '../kit/Icon'
import { TextField } from '../kit/fields'
import { TANPA_GALAT } from '../formGalat'
import { KakiForm, useKirimForm } from '../formUmum'
import { Dialog } from '../overlay/Dialog'

/** F-17: pengecualian rentang tanggal untuk semua Jadwal (dinamis) atau Jadwal tertentu (F-04). */
export function FormPengecualian({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const mutasi = useMutasi()
  const formId = useId()
  const { galat, setGalat, konflik, setKonflik, proses, kirim } = useKirimForm()
  const hariIni = waktu?.hariIni ?? ''
  const [mulai, setMulai] = useState('')
  const [akhir, setAkhir] = useState('')
  const [semua, setSemua] = useState(true)
  const [pilihan, setPilihan] = useState<string[]>([])
  const [keterangan, setKeterangan] = useState('')

  const [sebelumnya, setSebelumnya] = useState(open)
  if (open !== sebelumnya) {
    setSebelumnya(open)
    if (open) {
      setMulai(hariIni)
      setAkhir(hariIni)
      setSemua(true)
      setPilihan([])
      setKeterangan('')
      setGalat(TANPA_GALAT)
      setKonflik(false)
    }
  }

  const jadwalAktif = data ? data.jadwalData.jadwal.filter((j) => !jadwalBerakhir(data.jadwalData.versi, j.id, hariIni)) : []

  async function simpan(e: FormEvent) {
    e.preventDefault()
    const kolom: Record<string, string> = {}
    if (!mulai) kolom.mulai = 'Tanggal awal wajib diisi.'
    else if (mulai < hariIni) kolom.mulai = 'Tanggal awal harus hari ini atau setelahnya.'
    if (!akhir) kolom.akhir = 'Tanggal akhir wajib diisi.'
    else if (mulai && akhir < mulai) kolom.akhir = 'Tanggal akhir harus pada atau setelah tanggal awal.'
    if (!semua && pilihan.length === 0) kolom.cakupan = 'Pilih minimal satu Jadwal.'
    if (Object.keys(kolom).length > 0) {
      setGalat({ kolom })
      return
    }
    const target = semua ? [null] : pilihan
    // Satu baris per Jadwal yang dipilih; tiap baris aksi tersendiri dengan revisi terbaru.
    const ok = await kirim(async () => {
      for (const jadwal_id of target) await mutasi((v) => jadwalApi.tambahPengecualian(v, { jadwal_id, mulai, akhir, keterangan: keterangan.trim() }))
    })
    if (ok) onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tambah pengecualian"
      description="Tiadakan Jadwal pada rentang tanggal, misalnya saat libur."
      glyph={{ icon: 'event_busy' }}
      footer={<KakiForm formId={formId} label="Simpan pengecualian" proses={proses} konflik={konflik} onBatal={onClose} />}
    >
      <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Dari tanggal" icon="calendar_today" type="date" min={hariIni} value={mulai} onChange={(e) => setMulai(e.target.value)} error={galat.kolom.mulai} data-autofocus />
          <TextField label="Sampai tanggal" icon="calendar_today" type="date" min={mulai || hariIni} value={akhir} onChange={(e) => setAkhir(e.target.value)} error={galat.kolom.akhir} />
        </div>
        <SegmentedControl
          label="Cakupan"
          value={semua ? 'semua' : 'pilih'}
          onChange={(v) => setSemua(v === 'semua')}
          options={[
            { value: 'semua', label: 'Semua Jadwal' },
            { value: 'pilih', label: 'Jadwal tertentu' },
          ]}
        />
        {semua ? (
          <p className="text-body-sm text-ink-muted">“Semua” juga mencakup Jadwal yang dibuat belakangan.</p>
        ) : jadwalAktif.length === 0 ? (
          <Alert tone="info">Belum ada Jadwal aktif.</Alert>
        ) : (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Pilih Jadwal</legend>
            {jadwalAktif.map((j) => {
              const aktif = pilihan.includes(j.id)
              return (
                <button
                  key={j.id}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => setPilihan(aktif ? pilihan.filter((x) => x !== j.id) : [...pilihan, j.id])}
                  className={cx(
                    'flex min-h-12 items-center gap-3 rounded-field px-4 text-left',
                    aktif ? 'bg-mist text-on-mist shadow-[inset_0_0_0_2px_var(--sb-sage-light)]' : 'bg-card tactile-button',
                  )}
                >
                  <span className={cx('inline-flex size-5 items-center justify-center rounded-md', aktif ? 'bg-primary text-on-primary' : 'bg-well tactile-inset')}>
                    {aktif && <Icon name="check" size={14} />}
                  </span>
                  <span className="font-semibold">{j.nama}</span>
                </button>
              )
            })}
            {galat.kolom.cakupan && <p className="text-[0.8125rem] font-medium text-danger">{galat.kolom.cakupan}</p>}
          </fieldset>
        )}
        <TextField label="Keterangan (opsional)" maxLength={100} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
      </form>
    </Dialog>
  )
}
