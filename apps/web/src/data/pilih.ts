import { useMemo } from 'react'
import type { DataProjek } from '../domain/projek'
import { useData } from './DataProvider'

/** Larik baris dari snapshot untuk aturan domain Projek; dihitung ulang hanya saat snapshot berubah. */
export function useDataProjek(): (DataProjek & { dokumen: import('../domain/tipe').Dokumen[] }) | null {
  const { snapshot } = useData()
  return useMemo(() => {
    if (!snapshot) return null
    const { projek, sesi, task, label_mandiri, dokumen } = snapshot.isi
    return {
      projek: Object.values(projek),
      sesi: Object.values(sesi),
      task: Object.values(task),
      label: Object.values(label_mandiri),
      dokumen: Object.values(dokumen),
    }
  }, [snapshot])
}
