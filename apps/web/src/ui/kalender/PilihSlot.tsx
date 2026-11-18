import { Link } from 'react-router'
import { useDataProjek } from '../../data/pilih'
import type { EntriTodo, Menit, Tanggal } from '../../domain/tipe'
import { Icon } from '../kit/Icon'
import { formatJam, formatTanggal } from '../format'
import { Dialog } from '../overlay/Dialog'

type Props = {
  slot: { tanggal: Tanggal; mulai: Menit } | null
  onClose: () => void
  onJadwal: (tanggal: Tanggal, mulai: Menit) => void
  onBlok: (entri: EntriTodo, mulai: Menit) => void
}

/** G-04: slot kosong membuka pilihan Jadwal sekali jalan atau Blok untuk task di to-do hari itu. */
export function PilihSlot({ slot, onClose, onJadwal, onBlok }: Props) {
  const data = useDataProjek()
  const entri = slot && data ? data.entri.filter((e) => e.tanggal === slot.tanggal) : []

  return (
    <Dialog
      open={!!slot}
      onClose={onClose}
      title={slot ? `Slot ${formatJam(slot.mulai)}` : 'Slot kosong'}
      description={slot ? formatTanggal(slot.tanggal) : ''}
      glyph={{ icon: 'schedule' }}
      kind="confirm"
    >
      {slot && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => onJadwal(slot.tanggal, slot.mulai)}
            className="flex min-h-14 items-center justify-between gap-3 rounded-field bg-card px-4 text-left tactile-button hover:bg-raised"
            data-autofocus
          >
            <span>
              <b className="block">Jadwal sekali jalan</b>
              <span className="text-body-sm text-ink-muted">Kegiatan tetap hanya di hari ini</span>
            </span>
            <Icon name="chevron_right" size={18} />
          </button>
          <div className="flex flex-col gap-2">
            <p className="lbl">Blok untuk task di to-do hari ini</p>
            {entri.length === 0 ? (
              <p className="text-body-sm text-ink-muted">
                Belum ada task di to-do hari ini.{' '}
                <Link to="/task" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Tambahkan dari halaman Task
                </Link>
                .
              </p>
            ) : (
              entri.map((e) => {
                const task = data?.task.find((t) => t.id === e.task_id)
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onBlok(e, slot.mulai)}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-field bg-well px-4 text-left tactile-inset hover:text-primary"
                  >
                    <span className="truncate font-semibold">{task?.nama}</span>
                    <Icon name="schedule" size={18} />
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </Dialog>
  )
}
