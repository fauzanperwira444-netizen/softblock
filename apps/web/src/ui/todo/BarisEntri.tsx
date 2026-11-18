import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useBolehUbah } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { taskAktif, taskSelesai, taskTelat } from '../../domain/status'
import { infoLabel, taskTerkunci } from '../../domain/task'
import { blokRedup, jadwalPenyebabBentrok, setelahDeadline, statusEntri } from '../../domain/todo'
import type { EntriTodo } from '../../domain/tipe'
import { cx } from '../cx'
import { Button, IconButton } from '../kit/Button'
import { ProgressStepper } from '../kit/controls'
import { Badge } from '../kit/display'
import { Icon } from '../kit/Icon'
import { formatJam } from '../format'
import { galatForm } from '../formGalat'
import { dropIn, SPRING_SNAPPY } from '../motion'
import { useLayananTask } from '../task/LayananTask'
import { useAksiTodo } from './useAksiTodo'

/** Satu entri to-do: ceklis, task, blok jam, progress cepat, dan hapus dari hari itu (E-04..E-10). */
export function BarisEntri({ entri }: { entri: EntriTodo }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const layanan = useLayananTask()
  const aksi = useAksiTodo()
  const { boleh, alasan } = useBolehUbah()
  const [galat, setGalat] = useState<{ pesan: string; ulang: () => void } | null>(null)

  if (!data || !waktu) return null
  const task = data.task.find((t) => t.id === entri.task_id)
  if (!task) return null

  const info = infoLabel(data, task)
  const hariIni = entri.tanggal === waktu.hariIni
  const lewat = entri.tanggal < waktu.hariIni
  const aktif = taskAktif(task)
  const status = statusEntri(entri, task, data.riwayat)
  const blok = data.blok.filter((b) => b.entri_id === entri.id).sort((a, b) => a.mulai_menit - b.mulai_menit)
  const kunciTask = taskTerkunci(data, task, waktu.hariIni)
  const bolehUbahHari = boleh && !lewat

  async function jalankan(kerja: () => Promise<void>) {
    setGalat(null)
    try {
      await kerja()
    } catch (e) {
      setGalat({ pesan: galatForm(e).umum ?? 'Perubahan tidak tersimpan.', ulang: () => void jalankan(kerja) })
    }
  }

  const ceklisNonaktif = !bolehUbahHari || !hariIni
  const alasanCeklis = alasan ?? (lewat ? 'Hari lewat membeku.' : !hariIni ? 'Ceklis hanya untuk hari ini.' : null)

  return (
    <motion.div
      layout="position"
      className={cx(
        'flex flex-col gap-3 rounded-tile px-5 py-4',
        entri.ceklis || !aktif ? 'bg-well' : 'bg-card tactile-convex',
        blok.length === 0 && aktif && 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--sb-line)]',
      )}
    >
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={entri.ceklis}
          aria-label={`Tandai ${task.nama} dikerjakan`}
          disabled={ceklisNonaktif}
          title={alasanCeklis ?? undefined}
          onClick={() => void jalankan(() => aksi.ceklis(entri, !entri.ceklis))}
          className={cx(
            'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors',
            entri.ceklis ? 'bg-primary text-on-primary' : 'bg-well tactile-inset hover:bg-mist',
            'disabled:opacity-60',
          )}
        >
          <AnimatePresence initial={false}>
            {entri.ceklis && (
              <motion.span key="centang" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={SPRING_SNAPPY} className="inline-flex">
                <Icon name="check" size={14} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className="min-w-0 flex-[1_1_240px]">
          <button
            type="button"
            onClick={() => layanan.bukaDetail(task.id)}
            className={cx('max-w-full truncate text-left text-[1.0625rem] font-semibold hover:text-primary', entri.ceklis || !aktif ? 'text-ink-muted line-through' : 'text-ink')}
          >
            {task.nama}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {info?.jenis === 'projek' ? (
              <Link to={`/projek/${info.projek.id}`} className="inline-flex items-center gap-2 rounded-full bg-well px-3 py-0.5 text-body-sm font-medium tactile-inset hover:text-primary">
                <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ backgroundColor: info.projek.warna }} />
                {info.projek.nama}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-raised px-3 py-0.5 text-body-sm text-ink-muted">
                <Icon name="sell" size={14} />
                {info?.jenis === 'mandiri' ? info.label.nama : ''}
              </span>
            )}
            {taskTelat(task, waktu.hariIni, waktu.menit) && <Badge kind="telat">Telat</Badge>}
            {setelahDeadline(entri.tanggal, task) && <Badge kind="konteks">Setelah deadline</Badge>}
            {status === 'selesai' && <Badge>Selesai</Badge>}
            {status === 'dibatalkan' && <Badge kind="netral-garis">Batal</Badge>}
          </div>
          {blok.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {blok.map((b) => {
                const redup = blokRedup(b, entri, waktu.hariIni, waktu.menit)
                const bentrok = jadwalPenyebabBentrok(b, data.jadwalData)
                return (
                  <li key={b.id} className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!bolehUbahHari}
                      onClick={() => layanan.bukaFormBlok({ entri, blok: b })}
                      aria-label={`Ubah blok ${formatJam(b.mulai_menit)} sampai ${formatJam(b.selesai_menit)}`}
                      className={cx(
                        'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 font-mono text-body-sm font-bold transition-opacity',
                        redup ? 'bg-high text-ink-muted opacity-70' : 'bg-mist text-on-mist',
                        bentrok && 'shadow-[inset_0_0_0_1.5px_var(--sb-danger)]',
                      )}
                    >
                      <Icon name="schedule" size={14} />
                      {formatJam(b.mulai_menit)}–{formatJam(b.selesai_menit)}
                    </button>
                    {bentrok && (
                      <Link
                        to="/kalender"
                        className="inline-flex items-center gap-1 text-body-sm font-medium text-danger underline-offset-4 hover:underline"
                        title={`Jadwal “${bentrok.jadwal.nama}” ${formatJam(bentrok.mulai)}–${formatJam(bentrok.selesai)} menimpa blok ini`}
                      >
                        <Badge kind="telat">Bentrok</Badge>
                        {bentrok.jadwal.nama}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-1.5 text-body-sm text-ink-muted italic">Belum ada blok jam.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {aktif && (
            <ProgressStepper
              value={task.progress}
              taskName={task.nama}
              {...(!alasan && !kunciTask ? { onChange: (n: number) => void jalankan(() => layanan.ubahProgress(task, n)) } : { disabled: true, disabledReason: alasan ?? kunciTask ?? '' })}
            />
          )}
          {!aktif && (
            <span className="font-mono font-bold text-ink-muted" aria-label={`Progress ${task.progress} dari 10`}>
              {taskSelesai(task) ? '10/10' : `${task.progress}/10`}
            </span>
          )}
          {!lewat && aktif && (
            <Button variant={blok.length === 0 ? 'primary' : 'tactile'} size="sm" icon="schedule" disabled={!bolehUbahHari} onClick={() => layanan.bukaFormBlok({ entri })}>
              {blok.length === 0 ? 'Beri jam' : 'Tambah blok'}
            </Button>
          )}
          {!lewat && (
            <IconButton icon="delete" label={`Hapus ${task.nama} dari hari ini`} size="sm" disabled={!bolehUbahHari} onClick={() => void jalankan(() => aksi.hapusEntri(entri))} />
          )}
        </div>
      </div>
      <AnimatePresence>
        {galat && (
          <motion.p role="alert" variants={dropIn} initial="hidden" animate="show" exit="exit" className="flex flex-wrap items-center gap-2 rounded-field bg-danger-soft px-3 py-2 text-body-sm text-on-danger-soft">
            <Icon name="error" size={16} className="text-danger" />
            {galat.pesan}
            <button type="button" onClick={galat.ulang} className="ml-auto min-h-11 px-2 font-semibold underline underline-offset-4">
              Coba lagi
            </button>
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
