import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useBolehUbah } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { PROGRESS_SELESAI, taskAktif, taskDiLuarPeriode, taskSelesai, taskTelat } from '../../domain/status'
import { infoLabel, syaratBukaKembaliTask, taskTerkunci } from '../../domain/task'
import type { Task } from '../../domain/tipe'
import { cx } from '../cx'
import { Button, IconButton } from '../kit/Button'
import { ProgressStepper } from '../kit/controls'
import { Badge } from '../kit/display'
import { Icon } from '../kit/Icon'
import { formatJam, formatTanggal } from '../format'
import { galatForm } from '../formGalat'
import { dropIn, SPRING_SNAPPY } from '../motion'
import { useLayananTask } from './LayananTask'

type Props = {
  task: Task
  /** Chip label menerapkan filter label (H-08); hanya di Daftar Task. */
  onPilihLabel?: (labelId: string) => void
}

/** Baris task bersama (N-21): centang, info, kontrol progress cepat, Selesai/Buka kembali, detail (H-05). */
export function BarisTask({ task, onPilihLabel }: Props) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const layanan = useLayananTask()
  const { boleh, alasan } = useBolehUbah()
  const [galat, setGalat] = useState<{ pesan: string; ulang: () => void } | null>(null)
  // Cincin centang hanya diputar saat task baru saja selesai, bukan setiap baris selesai tampil.
  const [selesaiSebelumnya, setSelesaiSebelumnya] = useState(taskSelesai(task))
  const [cincin, setCincin] = useState(false)
  if (taskSelesai(task) !== selesaiSebelumnya) {
    setSelesaiSebelumnya(taskSelesai(task))
    setCincin(taskSelesai(task))
  }

  if (!data || !waktu) return null
  const info = infoLabel(data, task)
  const aktif = taskAktif(task)
  const selesai = taskSelesai(task)
  const telat = taskTelat(task, waktu.hariIni, waktu.menit)
  const luar = info?.jenis === 'projek' && taskDiLuarPeriode(task, info.sesi)
  const kunci = taskTerkunci(data, task, waktu.hariIni)
  const alasanUbah = alasan ?? (aktif ? kunci : null)
  const bisaBuka = selesai && !syaratBukaKembaliTask(data, task, waktu.hariIni)

  async function jalankan(aksi: () => Promise<void>) {
    setGalat(null)
    try {
      await aksi()
    } catch (e) {
      // Baris sudah dikembalikan ke keadaan semula; pesan dan Coba lagi tampil di bawahnya (N-50).
      setGalat({ pesan: galatForm(e).umum ?? 'Perubahan tidak tersimpan.', ulang: () => void jalankan(aksi) })
    }
  }

  return (
    <motion.div
      layout="position"
      className={cx(
        'flex flex-col gap-3 rounded-tile px-5 py-4',
        aktif ? 'bg-card tactile-convex' : 'bg-well',
        telat && 'shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--sb-danger)_28%,transparent),var(--sb-shadow-convex)]',
      )}
    >
      <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 md:grid-cols-[24px_minmax(0,1fr)_auto]">
        {aktif ? (
          <button
            type="button"
            aria-label={`Selesaikan ${task.nama}`}
            disabled={!boleh || !!kunci}
            onClick={() => void jalankan(() => layanan.ubahProgress(task, PROGRESS_SELESAI))}
            className="group relative inline-flex size-6 items-center justify-center self-start rounded-full bg-well tactile-inset hover:bg-mist disabled:opacity-50 md:mt-1"
          >
            <Icon name="check" size={14} className="text-primary opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className={cx('relative inline-flex size-6 items-center justify-center self-start rounded-full md:mt-1', selesai ? 'bg-primary text-on-primary' : 'bg-high')}
          >
            {selesai && (
              <>
                <motion.span initial={cincin ? { scale: 0.4 } : false} animate={{ scale: 1 }} transition={SPRING_SNAPPY} className="inline-flex">
                  <Icon name="check" size={14} />
                </motion.span>
                {cincin && (
                <motion.span
                  className="absolute -inset-[3px] rounded-full shadow-[0_0_0_2px_var(--sb-sage)]"
                  initial={{ scale: 0.6, opacity: 0.9 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.52, ease: 'easeOut' }}
                  onAnimationComplete={() => setCincin(false)}
                />
                )}
              </>
            )}
            {task.batal && <Icon name="close" size={14} className="text-ink-muted" />}
          </span>
        )}

        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <button
            type="button"
            onClick={() => layanan.bukaDetail(task.id)}
            className={cx('max-w-full truncate text-left text-[1.0625rem] leading-6 font-semibold hover:text-primary', aktif ? 'text-ink' : 'text-ink-muted line-through')}
          >
            {task.nama}
          </button>
          <div className="flex flex-wrap items-center gap-1.5">
            {info?.jenis === 'projek' && (
              <Link to={`/projek/${info.projek.id}`} className="inline-flex items-center gap-2 rounded-full bg-well px-3 py-1 text-body-sm font-medium text-ink tactile-inset hover:text-primary">
                <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ backgroundColor: info.projek.warna }} />
                {info.projek.nama}
              </Link>
            )}
            {info?.jenis === 'mandiri' &&
              (onPilihLabel ? (
                <button
                  type="button"
                  onClick={() => onPilihLabel(info.label.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-raised px-3 py-1 text-body-sm text-ink-muted underline decoration-line-strong decoration-dotted underline-offset-4 hover:text-ink"
                >
                  <Icon name="sell" size={14} />
                  {info.label.nama}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-raised px-3 py-1 text-body-sm text-ink-muted">
                  <Icon name="sell" size={14} />
                  {info.label.nama}
                </span>
              ))}
            {telat && (
              <Badge kind="telat" icon="event_busy">
                Telat
              </Badge>
            )}
            {luar && <Badge kind="konteks">Di luar periode</Badge>}
            {selesai && <Badge>Selesai</Badge>}
            {task.batal && <Badge kind="netral-garis">Batal</Badge>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-ink-muted">
            <span className={cx('inline-flex items-center gap-1', telat && 'font-medium text-danger')}>
              <Icon name={task.deadline_tanggal ? 'event' : 'event_busy'} size={14} />
              {task.deadline_tanggal
                ? `${formatTanggal(task.deadline_tanggal)}${task.deadline_menit !== null ? ` · ${formatJam(task.deadline_menit)}` : ''}`
                : 'Tanpa deadline'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="speed" size={14} />
              Kesulitan {task.kesulitan}/5
            </span>
          </div>
        </div>

        <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 md:col-span-1 md:flex-col md:items-end">
          <ProgressStepper
            value={task.progress}
            taskName={task.nama}
            {...(aktif && !alasanUbah ? { onChange: (n: number) => void jalankan(() => layanan.ubahProgress(task, n)) } : {})}
            {...(alasanUbah && aktif ? { disabled: true, disabledReason: alasanUbah } : {})}
          />
          <div className="flex items-center gap-2">
            {aktif && (
              <Button
                variant="sage"
                size="sm"
                icon="check"
                disabled={!!alasanUbah}
                title={alasanUbah ?? undefined}
                onClick={() => void jalankan(() => layanan.ubahProgress(task, PROGRESS_SELESAI))}
              >
                Selesai
              </Button>
            )}
            {bisaBuka && (
              <Button variant="tactile" size="sm" icon="restart_alt" disabled={!boleh} onClick={() => void jalankan(() => layanan.bukaKembali(task))}>
                Buka kembali
              </Button>
            )}
            <IconButton icon="chevron_right" label={`Lihat detail ${task.nama}`} size="sm" onClick={() => layanan.bukaDetail(task.id)} />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {galat && (
          <motion.p
            role="alert"
            variants={dropIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-wrap items-center gap-2 rounded-field bg-danger-soft px-3 py-2 text-body-sm text-on-danger-soft"
          >
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
