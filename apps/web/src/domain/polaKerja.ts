import { taskSelesai } from './status'
import { awalMinggu, selisihHari, tambahHari } from './tanggal'
import { waktuSelesai } from './task'
import { statusEntri } from './todo'
import type { EntriTodo, RiwayatProgress, Tanggal, Task } from './tipe'

// Pola kerja (D-11, D-12). Di server ini kueri SQL; versi TS dipakai mock dan diuji dengan aturan yang sama.

export type Granularitas = 'hari' | 'minggu' | 'bulan'

export type TitikPola = { label: string; mulai: Tanggal; akhir: Tanggal; selesai: number }

export type HasilPolaKerja = {
  dari: Tanggal
  sampai: Tanggal
  granularitas: Granularitas
  seri: TitikPola[]
  dibuat: number
  selesai: number
  batal: number
  dikerjakan: number
  tidak_dikerjakan: number
}

export type PilihanRentang = 'minggu_ini' | 'empat_minggu' | 'bulan_ini' | 'tiga_bulan' | 'tahun_ini' | 'semua' | 'kustom'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** Rentang tanggal untuk pilihan D-11; "Semua" dimulai dari data paling awal. */
export function rentangPilihan(p: Exclude<PilihanRentang, 'kustom'>, hariIni: Tanggal, awalData: Tanggal): { dari: Tanggal; sampai: Tanggal } {
  switch (p) {
    case 'minggu_ini':
      return { dari: awalMinggu(hariIni), sampai: hariIni }
    case 'empat_minggu':
      return { dari: tambahHari(awalMinggu(hariIni), -21), sampai: hariIni }
    case 'bulan_ini':
      return { dari: `${hariIni.slice(0, 7)}-01`, sampai: hariIni }
    case 'tiga_bulan':
      return { dari: tambahHari(hariIni, -90), sampai: hariIni }
    case 'tahun_ini':
      return { dari: `${hariIni.slice(0, 4)}-01-01`, sampai: hariIni }
    case 'semua':
      return { dari: awalData < hariIni ? awalData : hariIni, sampai: hariIni }
  }
}

/** Granularitas otomatis: harian sampai 14 hari, mingguan sampai ~4 bulan, selebihnya bulanan. */
export function granularitas(dari: Tanggal, sampai: Tanggal): Granularitas {
  const n = selisihHari(dari, sampai) + 1
  if (n <= 14) return 'hari'
  if (n <= 120) return 'minggu'
  return 'bulan'
}

function ember(dari: Tanggal, sampai: Tanggal, g: Granularitas): Array<{ label: string; mulai: Tanggal; akhir: Tanggal }> {
  const hasil: Array<{ label: string; mulai: Tanggal; akhir: Tanggal }> = []
  const fmt = (t: Tanggal) => `${Number(t.slice(8))} ${BULAN[Number(t.slice(5, 7)) - 1]}`
  if (g === 'hari') {
    for (let t = dari; t <= sampai; t = tambahHari(t, 1)) hasil.push({ label: fmt(t), mulai: t, akhir: t })
  } else if (g === 'minggu') {
    for (let t = awalMinggu(dari); t <= sampai; t = tambahHari(t, 7)) {
      hasil.push({ label: fmt(t), mulai: t < dari ? dari : t, akhir: tambahHari(t, 6) > sampai ? sampai : tambahHari(t, 6) })
    }
  } else {
    let y = Number(dari.slice(0, 4))
    let m = Number(dari.slice(5, 7))
    for (;;) {
      const awal = `${y}-${String(m).padStart(2, '0')}-01`
      if (awal > sampai) break
      const ny = m === 12 ? y + 1 : y
      const nm = m === 12 ? 1 : m + 1
      const akhir = tambahHari(`${ny}-${String(nm).padStart(2, '0')}-01`, -1)
      hasil.push({ label: `${BULAN[m - 1]} ${String(y).slice(2)}`, mulai: awal < dari ? dari : awal, akhir: akhir > sampai ? sampai : akhir })
      y = ny
      m = nm
    }
  }
  return hasil
}

/**
 * D-12: selesai dihitung dari kondisi sekarang (task yang kini selesai, waktu selesai terakhir di periode);
 * rasio dikerjakan hanya hari lewat dan tanpa entri dibatalkan.
 */
export function hitungPolaKerja(
  data: { task: Task[]; riwayat: RiwayatProgress[]; entri: EntriTodo[] },
  dari: Tanggal,
  sampai: Tanggal,
  hariIni: Tanggal,
): HasilPolaKerja {
  const g = granularitas(dari, sampai)
  const dalam = (t: string | null | undefined) => !!t && t >= dari && t <= sampai
  const tanggalSelesai = new Map<string, Tanggal>()
  for (const t of data.task) {
    if (!taskSelesai(t)) continue
    const w = waktuSelesai(data.riwayat, t.id)
    if (w) tanggalSelesai.set(t.id, w.slice(0, 10))
  }

  const seri = ember(dari, sampai, g).map((e) => ({
    ...e,
    selesai: [...tanggalSelesai.values()].filter((t) => t >= e.mulai && t <= e.akhir).length,
  }))

  let dikerjakan = 0
  let tidak = 0
  for (const e of data.entri) {
    if (!dalam(e.tanggal) || e.tanggal >= hariIni) continue
    const task = data.task.find((t) => t.id === e.task_id)
    if (!task) continue
    const s = statusEntri(e, task, data.riwayat)
    if (s === 'dibatalkan') continue
    if (s === 'tidak_dikerjakan') tidak++
    else dikerjakan++
  }

  return {
    dari,
    sampai,
    granularitas: g,
    seri,
    dibuat: data.task.filter((t) => dalam(t.dibuat_tanggal_lokal)).length,
    selesai: [...tanggalSelesai.values()].filter(dalam).length,
    batal: data.task.filter((t) => t.batal && dalam(t.dibatalkan_tanggal_lokal)).length,
    dikerjakan,
    tidak_dikerjakan: tidak,
  }
}
