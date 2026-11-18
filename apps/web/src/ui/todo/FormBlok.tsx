import { motion } from 'motion/react'
import { useId, useState, type FormEvent } from 'react'
import { todoApi } from '../../api/todo'
import { useMutasi } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { JAM_AKHIR, JAM_AWAL } from '../../domain/jadwal'
import { hariIso } from '../../domain/tanggal'
import { validasiBlok } from '../../domain/todo'
import type { BlokJam, EntriTodo } from '../../domain/tipe'
import { cx } from '../cx'
import { Button } from '../kit/Button'
import { Alert } from '../kit/display'
import { SelectField } from '../kit/fields'
import { formatJam, formatTanggal } from '../format'
import { TANPA_GALAT } from '../formGalat'
import { KakiForm, useKirimForm } from '../formUmum'
import { dropIn } from '../motion'
import { Dialog } from '../overlay/Dialog'

export const NAMA_HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

// Pilihan jam 06.00–24.00 setiap 5 menit (E-04). Pakai daftar pilihan karena input waktu tidak bisa memuat 24.00.
const PILIHAN_JAM = Array.from({ length: (JAM_AKHIR - JAM_AWAL) / 5 + 1 }, (_, i) => JAM_AWAL + i * 5)

export type AwalFormBlok = { entri: EntriTodo; blok?: BlokJam }

/** F-15: tambah atau ubah blok jam sebuah entri to-do. */
export function FormBlok({ awal, onClose }: { awal: AwalFormBlok | null; onClose: () => void }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const mutasi = useMutasi()
  const formId = useId()
  const { galat, setGalat, konflik, setKonflik, proses, kirim } = useKirimForm()
  const [mulai, setMulai] = useState(9 * 60)
  const [selesai, setSelesai] = useState(10 * 60)
  const [hapusProses, setHapusProses] = useState(false)

  const [sebelumnya, setSebelumnya] = useState(awal)
  if (awal !== sebelumnya) {
    setSebelumnya(awal)
    if (awal) {
      const usul = awal.blok ? awal.blok.mulai_menit : Math.max(JAM_AWAL, Math.min(JAM_AKHIR - 60, Math.ceil(((waktu?.menit ?? 540) + 1) / 15) * 15))
      setMulai(usul)
      setSelesai(awal.blok ? awal.blok.selesai_menit : Math.min(JAM_AKHIR, usul + 60))
      setGalat(TANPA_GALAT)
      setKonflik(false)
    }
  }

  const task = awal && data ? data.task.find((t) => t.id === awal.entri.task_id) : undefined
  const hasil =
    awal && data && waktu && task
      ? validasiBlok(
          { mulai, selesai },
          {
            tanggal: awal.entri.tanggal,
            hariIni: waktu.hariIni,
            task,
            blokLain: data.blok,
            jadwal: data.jadwalData,
            kecualiBlokId: awal.blok?.id ?? null,
            formatJam,
          },
        )
      : { galat: null, peringatan: null }

  function cepat(durasi: number) {
    setSelesai(Math.min(JAM_AKHIR, mulai + durasi))
  }

  async function simpan(e: FormEvent) {
    e.preventDefault()
    if (!awal) return
    if (hasil.galat) {
      setGalat({ umum: hasil.galat, kolom: {} })
      return
    }
    const isi = { mulai_menit: mulai, selesai_menit: selesai }
    const ok = await kirim(() => mutasi((v) => (awal.blok ? todoApi.ubahBlok(v, awal.blok.id, isi) : todoApi.tambahBlok(v, awal.entri.id, isi))))
    if (ok) onClose()
  }

  async function hapus() {
    if (!awal?.blok) return
    setHapusProses(true)
    const blok = awal.blok
    const ok = await kirim(() => mutasi((v) => todoApi.hapusBlok(v, blok.id)))
    setHapusProses(false)
    if (ok) onClose()
  }

  return (
    <Dialog
      open={!!awal}
      onClose={onClose}
      title={awal?.blok ? 'Ubah blok jam' : 'Tambah blok jam'}
      description="Kunci waktu kerja untuk task ini."
      glyph={{ icon: 'schedule' }}
      footer={
        <>
          {awal?.blok && (
            <Button variant="ghost" icon="delete" className="mr-auto text-danger hover:text-danger" busy={hapusProses} onClick={() => void hapus()}>
              Hapus blok
            </Button>
          )}
          <KakiForm formId={formId} label="Simpan blok" proses={proses && !hapusProses} konflik={konflik} onBatal={onClose} />
        </>
      }
    >
      <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
        <dl className="rounded-field bg-well px-4 py-1 tactile-inset">
          <div className="flex justify-between gap-4 border-b border-ink/6 py-2.5">
            <dt className="lbl self-center">Task</dt>
            <dd className="text-right font-semibold">{task?.nama}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="lbl self-center">Hari</dt>
            <dd className="text-right font-semibold">{awal && `${NAMA_HARI[hariIso(awal.entri.tanggal)]}, ${formatTanggal(awal.entri.tanggal)}`}</dd>
          </div>
        </dl>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Mulai" icon="schedule" value={mulai} onChange={(e) => setMulai(Number(e.target.value))} className="font-mono font-bold" data-autofocus>
            {PILIHAN_JAM.slice(0, -1).map((m) => (
              <option key={m} value={m}>
                {formatJam(m)}
              </option>
            ))}
          </SelectField>
          <SelectField label="Selesai" icon="schedule" value={selesai} onChange={(e) => setSelesai(Number(e.target.value))} className="font-mono font-bold">
            {PILIHAN_JAM.slice(1).map((m) => (
              <option key={m} value={m}>
                {formatJam(m)}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-sm text-ink-muted">Durasi cepat:</span>
          {[
            [30, '+30 mnt'],
            [60, '+1 jam'],
            [120, '+2 jam'],
          ].map(([d, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => cepat(d as number)}
              className={cx(
                'min-h-11 rounded-full px-4 text-body-sm font-semibold',
                selesai - mulai === d ? 'bg-primary text-on-primary' : 'bg-well text-ink-muted tactile-inset hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <motion.div key={hasil.galat ?? hasil.peringatan ?? 'ok'} variants={dropIn} initial="hidden" animate="show">
          {hasil.galat ? (
            <Alert tone="error" title="Belum bisa disimpan">
              {hasil.galat}
            </Alert>
          ) : hasil.peringatan ? (
            <Alert tone="info" icon="warning">
              {hasil.peringatan}
            </Alert>
          ) : (
            <Alert tone="success">
              {formatJam(mulai)}–{formatJam(selesai)} kosong dan siap dipakai.
            </Alert>
          )}
        </motion.div>
        {galat.umum && !hasil.galat && <Alert tone="error">{galat.umum}</Alert>}
      </form>
    </Dialog>
  )
}
