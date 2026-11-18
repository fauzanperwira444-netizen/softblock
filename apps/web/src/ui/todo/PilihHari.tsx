import { useState } from 'react'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { hariIso, tambahHari } from '../../domain/tanggal'
import { setelahDeadline } from '../../domain/todo'
import type { Task } from '../../domain/tipe'
import { cx } from '../cx'
import { Button } from '../kit/Button'
import { Alert, Badge } from '../kit/display'
import { Icon } from '../kit/Icon'
import { TextField } from '../kit/fields'
import { formatTanggal } from '../format'
import { galatForm } from '../formGalat'
import { Dialog } from '../overlay/Dialog'
import { NAMA_HARI } from './FormBlok'
import { useAksiTodo } from './useAksiTodo'

/** Pilihan hari untuk "Tambah ke to-do" dari baris task (E-02): hari ini, besok, atau tanggal lain. */
export function PilihHari({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const { tambahEntri } = useAksiTodo()
  const [lain, setLain] = useState('')
  const [galat, setGalat] = useState<string>()

  const [sebelumnya, setSebelumnya] = useState(task)
  if (task !== sebelumnya) {
    setSebelumnya(task)
    setLain('')
    setGalat(undefined)
  }

  if (!data || !waktu) return null
  const hariIni = waktu.hariIni
  const sudahAda = (t: string) => !!task && data.entri.some((e) => e.task_id === task.id && e.tanggal === t)

  async function pilih(tanggal: string) {
    if (!task) return
    setGalat(undefined)
    // Entri langsung muncul di perangkat; bila server menolak, entri dikembalikan dan pesannya tampil di sini.
    try {
      await tambahEntri(task, tanggal)
      onClose()
    } catch (e) {
      setGalat(galatForm(e).umum ?? 'Gagal menambahkan ke to-do. Coba lagi.')
    }
  }

  const opsi = [
    { tanggal: hariIni, label: 'Hari ini' },
    { tanggal: tambahHari(hariIni, 1), label: 'Besok' },
  ]

  return (
    <Dialog open={!!task} onClose={onClose} title="Tambah ke to-do" description={task?.nama ?? ''} glyph={{ icon: 'checklist' }} kind="confirm">
      {galat && <Alert tone="error">{galat}</Alert>}
      <ul className="flex flex-col gap-2">
        {opsi.map((o) => {
          const ada = sudahAda(o.tanggal)
          return (
            <li key={o.tanggal}>
              <button
                type="button"
                disabled={ada}
                onClick={() => void pilih(o.tanggal)}
                className={cx(
                  'flex min-h-14 w-full items-center justify-between gap-3 rounded-field bg-card px-4 text-left tactile-button transition-colors',
                  'hover:bg-raised disabled:opacity-55 disabled:shadow-none',
                )}
              >
                <span>
                  <b className="block">{o.label}</b>
                  <span className="text-body-sm text-ink-muted">
                    {NAMA_HARI[hariIso(o.tanggal)]}, {formatTanggal(o.tanggal)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {ada && <Badge>Sudah ada</Badge>}
                  {!ada && task && setelahDeadline(o.tanggal, task) && <Badge kind="konteks">Setelah deadline</Badge>}
                  <Icon name="chevron_right" size={18} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (lain) void pilih(lain)
        }}
      >
        <TextField
          label="Tanggal lain"
          icon="calendar_today"
          type="date"
          min={hariIni}
          value={lain}
          onChange={(e) => setLain(e.target.value)}
          {...(lain && sudahAda(lain) ? { error: 'Task ini sudah ada di to-do hari itu.' } : {})}
          {...(lain && task && setelahDeadline(lain, task) && !sudahAda(lain) ? { hint: 'Hari ini setelah deadline task. Tetap boleh ditambahkan.' } : {})}
        />
        <Button type="submit" variant="tactile" disabled={!lain || lain < hariIni || sudahAda(lain)}>
          Tambahkan ke tanggal ini
        </Button>
      </form>
    </Dialog>
  )
}
