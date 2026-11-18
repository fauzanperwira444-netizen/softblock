import { waktuLokal } from '../domain/tanggal'
import type { Menit, Tanggal } from '../domain/tipe'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** "18 Nov 2026" */
export function formatTanggal(t: Tanggal): string {
  const [y, m, d] = t.split('-')
  return `${Number(d)} ${BULAN[Number(m) - 1] ?? ''} ${y}`
}

/** "13.20" (titik sebagai pemisah jam). */
export function formatJam(menit: Menit): string {
  const j = Math.floor(menit / 60)
  const m = menit % 60
  return `${String(j).padStart(2, '0')}.${String(m).padStart(2, '0')}`
}

/** "Data per": hanya jam bila hari ini, tanggal + jam bila hari lain (AU-2). */
export function formatDataPer(instanIso: string, zona: string, hariIni: Tanggal): string {
  const { tanggal, menit } = waktuLokal(new Date(instanIso), zona)
  return tanggal === hariIni ? formatJam(menit) : `${formatTanggal(tanggal)}, ${formatJam(menit)}`
}
