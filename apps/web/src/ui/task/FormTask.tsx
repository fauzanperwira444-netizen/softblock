import { motion } from 'motion/react'
import { useId, useState, type FormEvent } from 'react'
import { taskApi, type TujuanKirim } from '../../api/task'
import { useMutasi } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import {
  DESKRIPSI_TASK_MAX,
  NAMA_LABEL_MAX,
  NAMA_TASK_MAX,
  saranLabel,
  sesiTujuan,
  validasiTask,
  type IsianTask,
  type TujuanTask,
} from '../../domain/task'
import type { Task } from '../../domain/tipe'
import { cx } from '../cx'
import { SegmentedControl } from '../kit/controls'
import { Alert, Badge } from '../kit/display'
import { SelectField, TextareaField, TextField } from '../kit/fields'
import { formatRentang, formatTanggal } from '../format'
import { useDaftarDraf } from '../drafFormulir'
import { TANPA_GALAT } from '../formGalat'
import { BannerKonflik, KakiForm, useKirimForm } from '../formUmum'
import { SPRING_SOFT } from '../motion'
import { Dialog } from '../overlay/Dialog'

/** Isian yang disimpan sebelum login ulang lewat Google lalu dipulihkan (DA-10). */
export type DrafFormTask = { isian: IsianTask; jenis: 'sesi' | 'mandiri'; sesiId: string; labelId: string | null; labelBaru: string }

export type AwalFormTask = ({ mode: 'buat'; sesiId?: string; labelId?: string } | { mode: 'ubah'; task: Task }) & { draf?: DrafFormTask }

export function menitKeJam(m: number | null): string {
  return m === null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function jamKeMenit(s: string): number | null {
  if (!s) return null
  const [j, m] = s.split(':').map(Number)
  return (j ?? 0) * 60 + (m ?? 0)
}

/** Pilihan kesulitan 1–5 berupa angka tanpa keterangan (C-01). */
export function PilihKesulitan({ nilai, onPilih, error }: { nilai: number; onPilih: (n: number) => void; error?: string | undefined }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <legend className="lbl">
          Kesulitan <span className="text-danger">*</span>
        </legend>
        <Badge kind="info">Level {nilai}</Badge>
      </div>
      <div role="radiogroup" aria-label="Kesulitan" className="grid grid-cols-5 gap-2 rounded-full bg-well p-1 tactile-inset">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={nilai === n}
            onClick={() => onPilih(n)}
            className={cx('relative min-h-10 rounded-full font-mono font-bold', nilai === n ? 'text-on-cta' : 'text-ink-muted hover:text-ink')}
          >
            {nilai === n && <motion.span layoutId="kesulitan-aktif" transition={SPRING_SOFT} className="absolute inset-0 rounded-full bg-cta shadow-cta" />}
            <span className="relative">{n}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-[0.8125rem] font-medium text-danger">{error}</p>}
    </fieldset>
  )
}

/** F-13: tambah task di sesi atau mandiri, dan ubah task aktif. */
export function FormTask({ awal, onClose }: { awal: AwalFormTask | null; onClose: () => void }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const mutasi = useMutasi()
  const formId = useId()
  const { galat, setGalat, konflik, setKonflik, proses, kirim } = useKirimForm()
  const hariIni = waktu?.hariIni ?? ''
  const pilihanSesi = data && waktu ? sesiTujuan(data, hariIni) : []
  const saran = data ? saranLabel(data) : []
  const ubah = awal?.mode === 'ubah' ? awal.task : null

  const isianAwal = (): IsianTask =>
    ubah
      ? { nama: ubah.nama, deskripsi: ubah.deskripsi, deadline_tanggal: ubah.deadline_tanggal ?? '', deadline_menit: ubah.deadline_menit, kesulitan: ubah.kesulitan }
      : { nama: '', deskripsi: '', deadline_tanggal: '', deadline_menit: null, kesulitan: 3 }

  const jenisAwal = (): 'sesi' | 'mandiri' => {
    if (ubah) return ubah.sesi_id ? 'sesi' : 'mandiri'
    if (awal?.mode === 'buat' && awal.labelId) return 'mandiri'
    return pilihanSesi.length > 0 ? 'sesi' : 'mandiri'
  }

  const [isian, setIsian] = useState<IsianTask>(isianAwal)
  const [jenis, setJenis] = useState<'sesi' | 'mandiri'>(jenisAwal)
  const [sesiId, setSesiId] = useState('')
  const [labelId, setLabelId] = useState<string | null>(null)
  const [labelBaru, setLabelBaru] = useState('')

  const [bukaSebelumnya, setBukaSebelumnya] = useState(awal)
  if (awal !== bukaSebelumnya) {
    setBukaSebelumnya(awal)
    if (awal) {
      setIsian(isianAwal())
      setJenis(jenisAwal())
      setSesiId(awal.mode === 'buat' ? (awal.sesiId ?? pilihanSesi[0]?.sesi.id ?? '') : (awal.task.sesi_id ?? ''))
      setLabelId(awal.mode === 'buat' ? (awal.labelId ?? saran[0]?.id ?? null) : awal.task.label_id)
      setLabelBaru('')
      setGalat(TANPA_GALAT)
      setKonflik(false)
      if (awal.draf) {
        setIsian(awal.draf.isian)
        setJenis(awal.draf.jenis)
        setSesiId(awal.draf.sesiId)
        setLabelId(awal.draf.labelId)
        setLabelBaru(awal.draf.labelBaru)
      }
    }
  }

  useDaftarDraf('form-task', !!awal, () => ({ awal: awal && { ...awal, draf: undefined }, draf: { isian, jenis, sesiId, labelId, labelBaru } satisfies DrafFormTask }))

  const sesiDipilih = pilihanSesi.find((x) => x.sesi.id === sesiId)?.sesi
  const ganti = <K extends keyof IsianTask>(k: K, v: IsianTask[K]) => setIsian((s) => ({ ...s, [k]: v }))
  const tujuan: TujuanTask = jenis === 'sesi' ? { jenis: 'sesi', sesiId } : { jenis: 'mandiri', labelId, labelBaru }

  async function simpan(e: FormEvent) {
    e.preventDefault()
    if (!data || !waktu || !awal) return
    const periksaDeadline = !ubah || (isian.deadline_tanggal || null) !== ubah.deadline_tanggal || isian.deadline_menit !== ubah.deadline_menit
    const g = validasiTask(isian, tujuan, {
      data,
      hariIni,
      menit: waktu.menit,
      kecualiId: ubah?.id ?? null,
      periksaDeadline,
      formatTanggal,
    })
    if (Object.keys(g).length > 0) {
      setGalat({ kolom: g as Record<string, string> })
      return
    }
    const isi = { ...isian, nama: isian.nama.trim(), deadline_tanggal: isian.deadline_tanggal || null, deadline_menit: isian.deadline_tanggal ? isian.deadline_menit : null }
    const kirimTujuan: TujuanKirim = jenis === 'sesi' ? { sesi_id: sesiId } : labelId ? { label_id: labelId } : { label_baru: labelBaru.trim() }
    const ok = await kirim(() => mutasi((v) => (ubah ? taskApi.ubah(v, ubah.id, isi) : taskApi.buat(v, kirimTujuan, isi))))
    if (ok) onClose()
  }

  return (
    <Dialog
      open={!!awal}
      onClose={onClose}
      title={ubah ? 'Ubah task' : 'Tambah task'}
      description={ubah ? 'Label task mandiri tidak bisa diubah di sini; pakai Pindahkan.' : 'Task di sesi berlabel nama projek; task mandiri berlabel sendiri.'}
      glyph={{ icon: ubah ? 'edit' : 'add_circle' }}
      footer={<KakiForm formId={formId} label="Simpan task" proses={proses} konflik={konflik} onBatal={onClose} />}
    >
      <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
        {konflik && (
          <BannerKonflik
            onMuatUlang={() => {
              setIsian(isianAwal())
              setKonflik(false)
            }}
          />
        )}
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}

        {!ubah && (
          <SegmentedControl
            label="Tujuan task"
            value={jenis}
            onChange={setJenis}
            options={[
              { value: 'sesi', label: 'Di sesi projek' },
              { value: 'mandiri', label: 'Mandiri' },
            ]}
          />
        )}

        {jenis === 'sesi' && !ubah && (
          pilihanSesi.length === 0 ? (
            <Alert tone="info">Belum ada sesi yang berjalan atau akan mulai. Tambah sesi di halaman Projek, atau buat task mandiri.</Alert>
          ) : (
            <SelectField label="Sesi projek" required value={sesiId} onChange={(e) => setSesiId(e.target.value)} error={galat.kolom.tujuan}>
              {pilihanSesi.map(({ sesi, projek }) => (
                <option key={sesi.id} value={sesi.id}>
                  {projek.nama} · {sesi.nama} ({formatRentang(sesi.mulai, sesi.akhir)})
                </option>
              ))}
            </SelectField>
          )
        )}

        {jenis === 'mandiri' && !ubah && (
          <fieldset className="flex flex-col gap-2">
            <legend className="lbl">
              Label <span className="text-danger">*</span>
            </legend>
            {saran.length > 0 && (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Saran label">
                {saran.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={labelId === l.id}
                    onClick={() => {
                      setLabelId(l.id)
                      setLabelBaru('')
                    }}
                    className={cx(
                      'inline-flex min-h-11 items-center rounded-full px-4 text-body-md font-semibold transition-colors',
                      labelId === l.id ? 'bg-primary text-on-primary' : 'bg-well text-ink-muted tactile-inset hover:text-ink',
                    )}
                  >
                    {l.nama}
                  </button>
                ))}
              </div>
            )}
            <TextField
              label="Atau label baru"
              icon="sell"
              maxLength={NAMA_LABEL_MAX}
              value={labelBaru}
              onChange={(e) => {
                setLabelBaru(e.target.value)
                setLabelId(e.target.value ? null : (saran[0]?.id ?? null))
              }}
              error={galat.kolom.label}
              hint="Saran diurutkan dari label yang terakhir dipakai."
            />
          </fieldset>
        )}

        <TextField
          label="Nama task"
          required
          maxLength={NAMA_TASK_MAX}
          value={isian.nama}
          onChange={(e) => ganti('nama', e.target.value)}
          error={galat.kolom.nama}
          hint="Unik di antara task aktif berlabel sama."
          data-autofocus
        />
        <TextareaField
          label="Deskripsi (opsional)"
          rows={2}
          maxLength={DESKRIPSI_TASK_MAX}
          value={isian.deskripsi}
          onChange={(e) => ganti('deskripsi', e.target.value)}
          error={galat.kolom.deskripsi}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={jenis === 'sesi' ? 'Deadline' : 'Deadline (opsional)'}
            icon="event"
            type="date"
            required={jenis === 'sesi'}
            min={sesiDipilih && sesiDipilih.mulai > hariIni ? sesiDipilih.mulai : hariIni}
            {...(sesiDipilih ? { max: sesiDipilih.akhir } : {})}
            value={isian.deadline_tanggal}
            onChange={(e) => ganti('deadline_tanggal', e.target.value)}
            error={galat.kolom.deadline_tanggal}
          />
          <TextField
            label="Jam (opsional)"
            icon="schedule"
            type="time"
            step={300}
            value={menitKeJam(isian.deadline_menit)}
            onChange={(e) => ganti('deadline_menit', jamKeMenit(e.target.value))}
            error={galat.kolom.deadline_menit}
            hint="Kelipatan 5 menit. Tanpa jam dianggap 23.59."
          />
        </div>
        <PilihKesulitan nilai={isian.kesulitan} onPilih={(n) => ganti('kesulitan', n)} error={galat.kolom.kesulitan} />
      </form>
    </Dialog>
  )
}
