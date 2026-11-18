import { motion } from 'motion/react'
import { useId, useState, type FormEvent } from 'react'
import { CATATAN_PROGRESS_MAX } from '../../domain/task'
import type { Task } from '../../domain/tipe'
import { cx } from '../cx'
import { Alert, Badge } from '../kit/display'
import { TextareaField } from '../kit/fields'
import { TANPA_GALAT } from '../formGalat'
import { KakiForm, useKirimForm } from '../formUmum'
import { SPRING_SOFT } from '../motion'
import { Dialog } from '../overlay/Dialog'
import { useLayananTask } from './LayananTask'

/** F-14 (progress): pilih 0–10 selain nilai sekarang, dengan catatan opsional (C-06). */
export function FormProgress({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const layanan = useLayananTask()
  const formId = useId()
  const { galat, setGalat, proses, kirim } = useKirimForm()
  const [nilai, setNilai] = useState<number | null>(null)
  const [catatan, setCatatan] = useState('')

  const [sebelumnya, setSebelumnya] = useState(task)
  if (task !== sebelumnya) {
    setSebelumnya(task)
    if (task) {
      setNilai(null)
      setCatatan('')
      setGalat(TANPA_GALAT)
    }
  }

  async function simpan(e: FormEvent) {
    e.preventDefault()
    if (!task) return
    if (nilai === null) {
      setGalat({ kolom: { nilai: 'Pilih angka progress baru.' } })
      return
    }
    const ok = await kirim(() => layanan.ubahProgress(task, nilai, catatan.trim()))
    // Bila nilai 10 menutup projek, layanan membuka dialog berat dan formulir ditutup setelah konfirmasi.
    if (ok) onClose()
  }

  return (
    <Dialog
      open={!!task}
      onClose={onClose}
      title="Perbarui progress"
      description={task?.nama ?? ''}
      glyph={{ icon: 'speed' }}
      footer={<KakiForm formId={formId} label={nilai === 10 ? 'Simpan dan selesaikan' : 'Simpan progress'} proses={proses} konflik={false} onBatal={onClose} />}
    >
      <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        <div className="flex items-center justify-between">
          <span className="lbl" id={`${formId}-label`}>
            Pilih angka progress
          </span>
          <Badge kind="info">Nilai: {nilai ?? '-'}</Badge>
        </div>
        <div role="radiogroup" aria-labelledby={`${formId}-label`} className="grid grid-cols-6 gap-1.5 rounded-field bg-well p-2 tactile-inset sm:grid-cols-11">
          {Array.from({ length: 11 }, (_, n) => {
            const sekarang = task?.progress === n
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={nilai === n}
                disabled={sekarang}
                aria-label={sekarang ? `${n} (nilai sekarang)` : String(n)}
                onClick={() => setNilai(n)}
                className={cx(
                  'relative min-h-11 rounded-full font-mono font-bold disabled:line-through disabled:opacity-40',
                  nilai === n ? 'text-on-cta' : 'text-ink-muted hover:text-ink',
                )}
              >
                {nilai === n && <motion.span layoutId="progress-pilih" transition={SPRING_SOFT} className="absolute inset-0 rounded-full bg-cta shadow-cta" />}
                <span className="relative">{n}</span>
              </button>
            )
          })}
        </div>
        {galat.kolom.nilai && <p className="text-[0.8125rem] font-medium text-danger">{galat.kolom.nilai}</p>}
        <p className="text-body-sm text-ink-muted">Nilai sekarang ({task?.progress}) tidak bisa dipilih lagi. 0 = belum mulai, 10 = selesai.</p>
        <TextareaField
          label="Catatan progress (opsional)"
          rows={2}
          maxLength={CATATAN_PROGRESS_MAX}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
        {nilai === 10 && <Alert tone="success">Progress 10 menyelesaikan task. Entri to-do hari mendatang untuk task ini dihapus.</Alert>}
      </form>
    </Dialog>
  )
}
