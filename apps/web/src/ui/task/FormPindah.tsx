import { useId, useState, type FormEvent } from 'react'
import { taskApi, type TujuanKirim } from '../../api/task'
import { useMutasi } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { dampakTask, infoLabel, NAMA_LABEL_MAX, namaLabel, saranLabel, sesiTujuan, validasiTask, type TujuanTask } from '../../domain/task'
import type { Task } from '../../domain/tipe'
import { cx } from '../cx'
import { SegmentedControl } from '../kit/controls'
import { Alert } from '../kit/display'
import { SelectField, TextField } from '../kit/fields'
import { formatJam, formatRentang, formatTanggal } from '../format'
import { TANPA_GALAT } from '../formGalat'
import { KakiForm, useKirimForm } from '../formUmum'
import { HeavyConfirmDialog } from '../overlay/ConfirmDialog'
import { Dialog } from '../overlay/Dialog'
import { jamKeMenit, menitKeJam } from './FormTask'

/** F-14 (pindah): satu task per kali, mandiri↔sesi atau antar-sesi; deadline lama diminta diganti bila tidak valid (C-04). */
export function FormPindah({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const mutasi = useMutasi()
  const formId = useId()
  const { galat, setGalat, konflik, setKonflik, proses, kirim } = useKirimForm()
  const hariIni = waktu?.hariIni ?? ''

  const pilihanSesi = data && waktu && task ? sesiTujuan(data, hariIni).filter((x) => x.sesi.id !== task.sesi_id) : []
  const saran = data ? saranLabel(data) : []
  const bolehMandiri = !!task?.sesi_id

  const [jenis, setJenis] = useState<'sesi' | 'mandiri'>('sesi')
  const [sesiId, setSesiId] = useState('')
  const [labelId, setLabelId] = useState<string | null>(null)
  const [labelBaru, setLabelBaru] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [menit, setMenit] = useState<number | null>(null)
  const [konfirmasiTutup, setKonfirmasiTutup] = useState(false)

  const [sebelumnya, setSebelumnya] = useState(task)
  if (task !== sebelumnya) {
    setSebelumnya(task)
    if (task) {
      setJenis('sesi')
      setSesiId(pilihanSesi[0]?.sesi.id ?? '')
      setLabelId(saran[0]?.id ?? null)
      setLabelBaru('')
      setTanggal(task.deadline_tanggal ?? '')
      setMenit(task.deadline_menit)
      setGalat(TANPA_GALAT)
      setKonflik(false)
      setKonfirmasiTutup(false)
    }
  }

  if (!task) return <Dialog open={false} onClose={onClose} title="Pindahkan task" />

  const info = data ? infoLabel(data, task) : null
  const sesiDipilih = pilihanSesi.find((x) => x.sesi.id === sesiId)
  const tujuan: TujuanTask = jenis === 'sesi' ? { jenis: 'sesi', sesiId } : { jenis: 'mandiri', labelId, labelBaru }
  const deadlineLamaTidakCocok =
    jenis === 'sesi' && sesiDipilih && task.deadline_tanggal && (task.deadline_tanggal < sesiDipilih.sesi.mulai || task.deadline_tanggal > sesiDipilih.sesi.akhir)
  const dampak = data && waktu ? dampakTask(data, task.id, { sesi_id: jenis === 'sesi' ? sesiId : null }, hariIni) : null

  async function kirimPindah() {
    if (!task) return
    const kirimTujuan: TujuanKirim = jenis === 'sesi' ? { sesi_id: sesiId } : labelId ? { label_id: labelId } : { label_baru: labelBaru.trim() }
    const deadline = { deadline_tanggal: tanggal || null, deadline_menit: tanggal ? menit : null }
    const ok = await kirim(() => mutasi((v) => taskApi.pindah(v, task.id, kirimTujuan, deadline, dampak)))
    if (ok) {
      setKonfirmasiTutup(false)
      onClose()
    }
  }

  async function simpan(e: FormEvent) {
    e.preventDefault()
    if (!data || !waktu || !task) return
    const g = validasiTask(
      { nama: task.nama, deskripsi: task.deskripsi, deadline_tanggal: tanggal, deadline_menit: menit, kesulitan: task.kesulitan },
      tujuan,
      { data, hariIni, menit: waktu.menit, kecualiId: task.id, periksaDeadline: true, formatTanggal },
    )
    if (Object.keys(g).length > 0) {
      setGalat({ kolom: g as Record<string, string> })
      return
    }
    if (dampak) {
      setKonfirmasiTutup(true)
      return
    }
    await kirimPindah()
  }

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        title="Pindahkan task"
        description={task.nama}
        glyph={{ icon: 'sync' }}
        footer={<KakiForm formId={formId} label="Pindahkan task" icon="sync" proses={proses && !konfirmasiTutup} konflik={konflik} onBatal={onClose} />}
      >
        <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
          {konflik && <Alert tone="error">Data berubah di perangkat lain. Tutup formulir lalu buka lagi.</Alert>}
          {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
          <dl className="rounded-field bg-well px-4 py-1 tactile-inset">
            <div className="flex justify-between gap-4 border-b border-ink/6 py-2.5">
              <dt className="lbl self-center">Sekarang</dt>
              <dd className="text-right">{info?.jenis === 'projek' ? `${info.projek.nama} · ${info.sesi.nama}` : `Mandiri · ${namaLabel(info)}`}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="lbl self-center">Deadline</dt>
              <dd className="font-semibold text-primary">
                {task.deadline_tanggal ? `${formatTanggal(task.deadline_tanggal)}${task.deadline_menit !== null ? ` · ${formatJam(task.deadline_menit)}` : ''}` : 'Tanpa deadline'}
              </dd>
            </div>
          </dl>

          {bolehMandiri && (
            <SegmentedControl
              label="Tujuan task"
              value={jenis}
              onChange={setJenis}
              options={[
                { value: 'sesi', label: 'Sesi lain' },
                { value: 'mandiri', label: 'Mandiri' },
              ]}
            />
          )}

          {jenis === 'sesi' &&
            (pilihanSesi.length === 0 ? (
              <Alert tone="info">Tidak ada sesi lain yang berjalan atau akan mulai.</Alert>
            ) : (
              <SelectField label="Sesi tujuan" required value={sesiId} onChange={(e) => setSesiId(e.target.value)} error={galat.kolom.tujuan}>
                {pilihanSesi.map(({ sesi, projek }) => (
                  <option key={sesi.id} value={sesi.id}>
                    {projek.nama} · {sesi.nama} ({formatRentang(sesi.mulai, sesi.akhir)})
                  </option>
                ))}
              </SelectField>
            ))}

          {jenis === 'mandiri' && (
            <fieldset className="flex flex-col gap-2">
              <legend className="lbl">
                Label <span className="text-danger">*</span>
              </legend>
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
                      'inline-flex min-h-11 items-center rounded-full px-4 text-body-md font-semibold',
                      labelId === l.id ? 'bg-primary text-on-primary' : 'bg-well text-ink-muted tactile-inset hover:text-ink',
                    )}
                  >
                    {l.nama}
                  </button>
                ))}
              </div>
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
              />
            </fieldset>
          )}

          <div className="flex flex-col gap-3 rounded-field bg-well p-4 tactile-inset">
            <span className="lbl">Deadline di tujuan</span>
            {deadlineLamaTidakCocok && sesiDipilih && (
              <Alert tone="error">
                Deadline lama di luar periode sesi tujuan. Pilih tanggal {formatRentang(sesiDipilih.sesi.mulai, sesiDipilih.sesi.akhir)}.
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={jenis === 'sesi' ? 'Tanggal' : 'Tanggal (opsional)'}
                icon="event"
                type="date"
                min={hariIni}
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                error={galat.kolom.deadline_tanggal}
              />
              <TextField
                label="Jam (opsional)"
                icon="schedule"
                type="time"
                step={300}
                value={menitKeJam(menit)}
                onChange={(e) => setMenit(jamKeMenit(e.target.value))}
                error={galat.kolom.deadline_menit}
              />
            </div>
          </div>
          <p className="text-body-sm text-ink-muted">
            {jenis === 'sesi' ? 'Label task ikut berganti ke nama projek tujuan.' : 'Label berganti ke label yang dipilih.'} Pemindahan tidak dicatat di riwayat progress.
          </p>
          {galat.kolom.nama && <Alert tone="error">{galat.kolom.nama}</Alert>}
        </form>
      </Dialog>

      <HeavyConfirmDialog
        open={konfirmasiTutup}
        onClose={() => setKonfirmasiTutup(false)}
        onConfirm={() => void kirimPindah()}
        title={`Pindahkan “${task.nama}”?`}
        icon="sync"
        confirmLabel="Ya, pindahkan task"
        akanTerjadi={[
          'Task pindah ke tujuan baru dan labelnya ikut berganti.',
          `Projek “${info?.jenis === 'projek' ? info.projek.nama : ''}” akan menjadi selesai dan terkunci.`,
        ]}
        tetapAda={['Progress dan riwayat task', 'Task lain di projek asal']}
        busy={proses}
        error={galat.umum}
      />
    </>
  )
}
