import { useMemo } from 'react'
import type { DataTask } from '../domain/task'
import type { Dokumen, EntriTodo } from '../domain/tipe'
import { useData } from './DataProvider'

export type DataLengkap = DataTask & { dokumen: Dokumen[]; entri: EntriTodo[] }

/** Larik baris dari snapshot untuk aturan domain; dihitung ulang hanya saat snapshot berubah. */
export function useDataProjek(): DataLengkap | null {
  const { snapshot } = useData()
  return useMemo(() => {
    if (!snapshot) return null
    const { projek, sesi, task, label_mandiri, dokumen, riwayat_progress, entri_todo } = snapshot.isi
    return {
      projek: Object.values(projek),
      sesi: Object.values(sesi),
      task: Object.values(task),
      label: Object.values(label_mandiri),
      dokumen: Object.values(dokumen),
      riwayat: Object.values(riwayat_progress),
      entri: Object.values(entri_todo),
    }
  }, [snapshot])
}
