import { useEffect, useState } from 'react'
import { hariIniTerjaga, waktuLokal } from '../domain/tanggal'
import type { Menit, Tanggal } from '../domain/tipe'
import { useData } from './DataProvider'

/**
 * "Hari ini" dan menit sekarang menurut zona akun. Server menetapkan hari ini (AD-6);
 * saat offline jam perangkat dipakai, tetapi tidak pernah mundur dari nilai server (N-44, N-45).
 */
export function useWaktu(): { hariIni: Tanggal; menit: Menit; zona: string } | null {
  const { snapshot } = useData()
  const [sekarang, setSekarang] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setSekarang(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!snapshot) return null
  const lokal = waktuLokal(sekarang, snapshot.zona_waktu)
  return { hariIni: hariIniTerjaga(lokal.tanggal, snapshot.hari_ini), menit: lokal.menit, zona: snapshot.zona_waktu }
}
