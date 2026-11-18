import { useMemo } from 'react'
import type { DataTask } from '../domain/task'
import type { DataJadwal } from '../domain/todo'
import type { BlokJam, Dokumen, EntriTodo } from '../domain/tipe'
import { useData } from './DataProvider'

export type DataLengkap = DataTask & { dokumen: Dokumen[]; entri: EntriTodo[]; blok: BlokJam[]; jadwalData: DataJadwal }

/** Larik baris dari snapshot untuk aturan domain; dihitung ulang hanya saat snapshot berubah. */
export function useDataProjek(): DataLengkap | null {
  const { snapshot } = useData()
  return useMemo(() => {
    if (!snapshot) return null
    const i = snapshot.isi
    return {
      projek: Object.values(i.projek),
      sesi: Object.values(i.sesi),
      task: Object.values(i.task),
      label: Object.values(i.label_mandiri),
      dokumen: Object.values(i.dokumen),
      riwayat: Object.values(i.riwayat_progress),
      entri: Object.values(i.entri_todo),
      blok: Object.values(i.blok_jam),
      jadwalData: { jadwal: Object.values(i.jadwal), versi: Object.values(i.jadwal_versi), pengecualian: Object.values(i.pengecualian) },
    }
  }, [snapshot])
}
