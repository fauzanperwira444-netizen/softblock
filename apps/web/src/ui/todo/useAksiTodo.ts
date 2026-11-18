import { useCallback } from 'react'
import { todoApi } from '../../api/todo'
import { useMutasiInstan } from '../../data/DataProvider'
import type { EntriTodo, Task } from '../../domain/tipe'

/** Aksi to-do yang instan (N-50): tambah ke to-do, hapus entri, dan ceklis. */
export function useAksiTodo() {
  const instan = useMutasiInstan()

  const tambahEntri = useCallback(
    async (task: Task, tanggal: string) => {
      // Id dibuat di perangkat (DA-1) agar permintaan ulang tidak menggandakan entri.
      const entri: EntriTodo = { id: crypto.randomUUID(), versi: 0, task_id: task.id, tanggal, ceklis: false }
      await instan({ tabel: 'entri_todo', id: entri.id, baris: entri }, (v) => todoApi.tambahEntri(v, { id: entri.id, task_id: task.id, tanggal }))
    },
    [instan],
  )

  const hapusEntri = useCallback(
    async (entri: EntriTodo) => {
      await instan({ tabel: 'entri_todo', id: entri.id, baris: null }, (v) => todoApi.hapusEntri(v, entri.id))
    },
    [instan],
  )

  const ceklis = useCallback(
    async (entri: EntriTodo, nilai: boolean) => {
      await instan({ tabel: 'entri_todo', id: entri.id, baris: { ...entri, ceklis: nilai } }, (v) => todoApi.ceklis(v, entri.id, nilai))
    },
    [instan],
  )

  return { tambahEntri, hapusEntri, ceklis }
}
