import { jadwalPadaTanggal, JAM_AKHIR, JAM_AWAL } from './jadwal'
import { statusEntri, type DataJadwal } from './todo'
import type { BlokJam, EntriTodo, Menit, RiwayatProgress, Tanggal, Task } from './tipe'

// Jam kosong (F-07, D-09): 06.00–24.00 dikurangi gabungan Jadwal aktif dan blok. Slot < 30 menit dibuang.

export const SLOT_MINIMUM = 30

export type Rentang = { mulai: Menit; selesai: Menit }

export type HasilJamKosong = { slot: Rentang[]; total: Menit; terpanjang: Rentang | null }

type DataHari = {
  jadwalData: DataJadwal
  blok: BlokJam[]
  entri: EntriTodo[]
  task: Task[]
  riwayat: RiwayatProgress[]
}

/** Rentang terpakai pada sebuah tanggal: Jadwal aktif dan blok dari entri yang belum selesai/batal. */
export function rentangTerpakai(data: DataHari, tanggal: Tanggal): Rentang[] {
  const jadwal = jadwalPadaTanggal(data.jadwalData, tanggal).map((k) => ({ mulai: k.mulai, selesai: k.selesai }))
  const blok = data.blok
    .filter((b) => b.tanggal === tanggal)
    .filter((b) => {
      const entri = data.entri.find((e) => e.id === b.entri_id)
      const task = entri && data.task.find((t) => t.id === entri.task_id)
      if (!entri || !task) return true
      const s = statusEntri(entri, task, data.riwayat)
      return s !== 'selesai' && s !== 'dibatalkan'
    })
    .map((b) => ({ mulai: b.mulai_menit, selesai: b.selesai_menit }))
  return [...jadwal, ...blok]
}

/** Gabungkan rentang yang bertumpuk atau bersentuhan. */
export function gabung(rentang: Rentang[]): Rentang[] {
  const urut = [...rentang].sort((a, b) => a.mulai - b.mulai)
  const hasil: Rentang[] = []
  for (const r of urut) {
    const akhir = hasil.at(-1)
    if (akhir && r.mulai <= akhir.selesai) akhir.selesai = Math.max(akhir.selesai, r.selesai)
    else hasil.push({ ...r })
  }
  return hasil
}

/**
 * Slot kosong dari daftar rentang terpakai. `sejak` memotong hari di menit itu lebih dulu
 * (dipakai Dashboard untuk "hari ini", D-09), baru kemudian slot pendek dibuang.
 */
export function slotKosong(terpakai: Rentang[], sejak: Menit = JAM_AWAL): HasilJamKosong {
  const awal = Math.max(JAM_AWAL, Math.min(JAM_AKHIR, sejak))
  const slot: Rentang[] = []
  let kursor = awal
  for (const r of gabung(terpakai)) {
    if (r.selesai <= kursor) continue
    if (r.mulai > kursor) slot.push({ mulai: kursor, selesai: Math.min(r.mulai, JAM_AKHIR) })
    kursor = Math.max(kursor, r.selesai)
    if (kursor >= JAM_AKHIR) break
  }
  if (kursor < JAM_AKHIR) slot.push({ mulai: kursor, selesai: JAM_AKHIR })
  const layak = slot.filter((s) => s.selesai - s.mulai >= SLOT_MINIMUM)
  const terpanjang = layak.reduce<Rentang | null>((p, s) => (!p || s.selesai - s.mulai > p.selesai - p.mulai ? s : p), null)
  return { slot: layak, total: layak.reduce((n, s) => n + s.selesai - s.mulai, 0), terpanjang }
}

export function jamKosong(data: DataHari, tanggal: Tanggal, sejak?: Menit): HasilJamKosong {
  return slotKosong(rentangTerpakai(data, tanggal), sejak)
}

/** "7 j 40 m" / "3 j" / "45 m". */
export function formatDurasi(menit: Menit): string {
  const j = Math.floor(menit / 60)
  const m = menit % 60
  if (j === 0) return `${m} m`
  return m === 0 ? `${j} j` : `${j} j ${m} m`
}

/** Pola garis projek agar warna bukan satu-satunya pembeda (G-03, N-16). */
export type PolaGaris = 'penuh' | 'putus' | 'titik' | 'arsir'
const POLA: PolaGaris[] = ['penuh', 'putus', 'titik', 'arsir']

export function polaProjek(projekIdUrut: string[], projekId: string): PolaGaris {
  const i = projekIdUrut.indexOf(projekId)
  return POLA[(i < 0 ? 0 : i) % POLA.length] ?? 'penuh'
}
