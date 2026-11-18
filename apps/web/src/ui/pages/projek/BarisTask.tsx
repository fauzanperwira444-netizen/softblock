import { taskDiLuarPeriode, taskSelesai, taskTelat } from '../../../domain/status'
import type { Menit, Sesi, Tanggal, Task } from '../../../domain/tipe'
import { cx } from '../../cx'
import { Badge } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import { formatJam, formatTanggal } from '../../format'

type Props = { task: Task; sesi: Sesi; hariIni: Tanggal; menit: Menit }

/**
 * Baris task ringkas di Detail Projek. Aksi task (progress, to-do, detail) menyusul bersama
 * Daftar Task di Tahap 4, jadi baris ini hanya menampilkan status.
 */
export function BarisTask({ task, sesi, hariIni, menit }: Props) {
  const selesai = taskSelesai(task)
  const telat = taskTelat(task, hariIni, menit)
  const luar = taskDiLuarPeriode(task, sesi)
  const redup = selesai || task.batal
  return (
    <li
      className={cx(
        'flex flex-wrap items-center justify-between gap-3 rounded-field px-4 py-3',
        redup ? 'bg-well' : 'bg-card tactile-convex',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={cx(
            'inline-flex size-6 shrink-0 items-center justify-center rounded-full',
            selesai ? 'bg-primary text-on-primary' : 'bg-well tactile-inset',
          )}
        >
          {selesai && <Icon name="check" size={14} />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cx('font-semibold', redup ? 'text-ink-muted line-through' : 'text-ink')}>{task.nama}</span>
            {telat && (
              <Badge kind="telat" icon="event_busy">
                Telat
              </Badge>
            )}
            {luar && <Badge kind="konteks">Di luar periode</Badge>}
            {selesai && <Badge>Selesai</Badge>}
            {task.batal && <Badge kind="netral-garis">Batal</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-ink-muted">
            {task.deadline_tanggal && (
              <span className={cx('inline-flex items-center gap-1', telat && 'font-medium text-danger')}>
                <Icon name="event" size={14} />
                {formatTanggal(task.deadline_tanggal)}
                {task.deadline_menit !== null && ` · ${formatJam(task.deadline_menit)}`}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Icon name="speed" size={14} />
              Kesulitan {task.kesulitan}/5
            </span>
          </div>
        </div>
      </div>
      <span className="font-mono text-numeric-md font-bold text-primary tabular-nums" aria-label={`Progress ${task.progress} dari 10`}>
        {task.progress}/10
      </span>
    </li>
  )
}
