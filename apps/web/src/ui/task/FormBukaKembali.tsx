import { useId, useState, type FormEvent } from 'react'
import { taskApi } from '../../api/task'
import { useMutasi } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { namaBentrokBukaKembali, NAMA_TASK_MAX, progressSebelumSelesai } from '../../domain/task'
import type { Task } from '../../domain/tipe'
import { Alert } from '../kit/display'
import { TextField } from '../kit/fields'
import { TANPA_GALAT } from '../formGalat'
import { KakiForm, useKirimForm } from '../formUmum'
import { Dialog } from '../overlay/Dialog'

/** Buka kembali saat nama bentrok dengan task aktif berlabel sama: formulir meminta nama baru (C-07). */
export function FormBukaKembali({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const data = useDataProjek()
  const mutasi = useMutasi()
  const formId = useId()
  const { galat, setGalat, proses, kirim } = useKirimForm()
  const [nama, setNama] = useState('')

  const [sebelumnya, setSebelumnya] = useState(task)
  if (task !== sebelumnya) {
    setSebelumnya(task)
    if (task) {
      setNama(`${task.nama} (lagi)`.slice(0, NAMA_TASK_MAX))
      setGalat(TANPA_GALAT)
    }
  }

  const kembali = task && data ? progressSebelumSelesai(data.riwayat, task.id) : 9

  async function simpan(e: FormEvent) {
    e.preventDefault()
    if (!task || !data) return
    const bersih = nama.trim()
    if (!bersih) return setGalat({ kolom: { nama: 'Nama task wajib diisi.' } })
    if (bersih.length > NAMA_TASK_MAX) return setGalat({ kolom: { nama: `Nama task maksimal ${NAMA_TASK_MAX} karakter.` } })
    if (namaBentrokBukaKembali(data, task, bersih)) return setGalat({ kolom: { nama: 'Nama masih bentrok dengan task aktif berlabel sama.' } })
    const ok = await kirim(() => mutasi((v) => taskApi.bukaKembali(v, task.id, bersih)))
    if (ok) onClose()
  }

  return (
    <Dialog
      open={!!task}
      onClose={onClose}
      title="Buka kembali task"
      description={task?.nama ?? ''}
      glyph={{ icon: 'restart_alt' }}
      footer={<KakiForm formId={formId} label="Buka kembali" icon="restart_alt" proses={proses} konflik={false} onBatal={onClose} />}
    >
      <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
        <Alert tone="info">
          Task kembali aktif dengan progress {kembali}/10. Namanya dipakai task aktif lain berlabel sama, jadi perlu nama baru.
        </Alert>
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        <TextField
          label="Nama baru"
          required
          maxLength={NAMA_TASK_MAX}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          error={galat.kolom.nama}
          data-autofocus
        />
      </form>
    </Dialog>
  )
}
