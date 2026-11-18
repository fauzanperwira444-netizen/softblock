import { jadwalPadaTanggal, JAM_AKHIR, JAM_AWAL, jamBertumpuk, type KejadianJadwal } from './jadwal'
import { taskAktif } from './status'
import { tambahHari } from './tanggal'
import type { BlokJam, EntriTodo, Jadwal, JadwalVersi, Menit, Pengecualian, RiwayatProgress, Tanggal, Task } from './tipe'

// Aturan To-do harian dan blok jam (Spesifikasi E-01..E-12, F-07, F-08).

export type StatusEntri = 'dibatalkan' | 'selesai' | 'dikerjakan' | 'tidak_dikerjakan'

/**
 * E-07, DA-8: prioritas dibatalkan > selesai > dikerjakan > tidak dikerjakan.
 * Selesai lalu dibuka kembali di hari yang sama dihitung dikerjakan.
 */
export function statusEntri(entri: EntriTodo, task: Task, riwayat: RiwayatProgress[]): StatusEntri {
  if (task.batal && task.dibatalkan_tanggal_lokal === entri.tanggal) return 'dibatalkan'
  const hariItu = riwayat
    .filter((r) => r.task_id === task.id && r.tanggal_lokal === entri.tanggal)
    .sort((a, b) => a.menit_lokal - b.menit_lokal)
  const penandaTerakhir = hariItu.filter((r) => r.penanda !== null).at(-1)?.penanda
  if (penandaTerakhir === 'selesai') return 'selesai'
  if (entri.ceklis || hariItu.length > 0) return 'dikerjakan'
  return 'tidak_dikerjakan'
}

export function dikerjakan(s: StatusEntri): boolean {
  return s === 'selesai' || s === 'dikerjakan'
}

/** E-01: hari setelah deadline diberi penanda, tidak ditolak. */
export function setelahDeadline(tanggal: Tanggal, task: Pick<Task, 'deadline_tanggal'>): boolean {
  return !!task.deadline_tanggal && tanggal > task.deadline_tanggal
}

/**
 * E-09: entri tidak dikerjakan dalam 7 hari terakhir dari task aktif, satu baris per task (entri terbaru),
 * tanpa task yang sudah punya entri hari ini.
 */
export function belumSelesai(
  data: { entri: EntriTodo[]; task: Task[]; riwayat: RiwayatProgress[] },
  hariIni: Tanggal,
): Array<{ entri: EntriTodo; task: Task }> {
  const awal = tambahHari(hariIni, -7)
  const adaHariIni = new Set(data.entri.filter((e) => e.tanggal === hariIni).map((e) => e.task_id))
  const terbaru = new Map<string, { entri: EntriTodo; task: Task }>()
  for (const e of data.entri) {
    if (e.tanggal < awal || e.tanggal >= hariIni || adaHariIni.has(e.task_id)) continue
    const task = data.task.find((t) => t.id === e.task_id)
    if (!task || !taskAktif(task)) continue
    if (statusEntri(e, task, data.riwayat) !== 'tidak_dikerjakan') continue
    const lama = terbaru.get(task.id)
    if (!lama || lama.entri.tanggal < e.tanggal) terbaru.set(task.id, { entri: e, task })
  }
  return [...terbaru.values()].sort((a, b) => (a.entri.tanggal < b.entri.tanggal ? 1 : -1))
}

export type DataJadwal = { jadwal: Jadwal[]; versi: JadwalVersi[]; pengecualian: Pengecualian[] }

/** F-08: Jadwal yang menimpa blok yang sudah ada; blok ditandai "bentrok" dengan Jadwal penyebabnya. */
export function jadwalPenyebabBentrok(blok: Pick<BlokJam, 'tanggal' | 'mulai_menit' | 'selesai_menit'>, jadwal: DataJadwal): KejadianJadwal | undefined {
  return jadwalPadaTanggal(jadwal, blok.tanggal).find((k) => jamBertumpuk(k, { mulai: blok.mulai_menit, selesai: blok.selesai_menit }))
}

export type IsianBlok = { mulai: Menit; selesai: Menit }

export type HasilValidasiBlok = {
  galat: string | null
  /** Peringatan "setelah deadline": tidak menolak penyimpanan. */
  peringatan: string | null
}

/**
 * E-04: 06.00–24.00, mulai sebelum selesai, kelipatan 5 menit; tidak bentrok dengan blok lain
 * (semua blok di tanggal itu) maupun Jadwal. Hari lewat membeku (E-05).
 */
export function validasiBlok(
  isian: IsianBlok,
  konteks: {
    tanggal: Tanggal
    hariIni: Tanggal
    task: Pick<Task, 'deadline_tanggal' | 'deadline_menit'>
    blokLain: BlokJam[]
    jadwal: DataJadwal
    kecualiBlokId: string | null
    formatJam: (m: Menit) => string
  },
): HasilValidasiBlok {
  const { mulai, selesai } = isian
  const f = konteks.formatJam
  let galat: string | null = null
  if (konteks.tanggal < konteks.hariIni) galat = 'Hari yang sudah lewat tidak bisa diubah.'
  else if (mulai < JAM_AWAL || selesai > JAM_AKHIR) galat = `Blok hanya di antara ${f(JAM_AWAL)} dan ${f(JAM_AKHIR)}.`
  else if (mulai % 5 !== 0 || selesai % 5 !== 0) galat = 'Jam harus kelipatan 5 menit.'
  else if (mulai >= selesai) galat = 'Jam mulai harus lebih awal dari jam selesai.'
  else {
    const tabrakBlok = konteks.blokLain.find(
      (b) => b.id !== konteks.kecualiBlokId && b.tanggal === konteks.tanggal && jamBertumpuk({ mulai: b.mulai_menit, selesai: b.selesai_menit }, isian),
    )
    if (tabrakBlok) galat = `Bentrok dengan blok lain (${f(tabrakBlok.mulai_menit)}–${f(tabrakBlok.selesai_menit)}).`
    else {
      const tabrakJadwal = jadwalPadaTanggal(konteks.jadwal, konteks.tanggal).find((k) => jamBertumpuk(k, isian))
      if (tabrakJadwal) galat = `Bentrok dengan Jadwal “${tabrakJadwal.jadwal.nama}” (${f(tabrakJadwal.mulai)}–${f(tabrakJadwal.selesai)}).`
    }
  }

  let peringatan: string | null = null
  const { deadline_tanggal: dl, deadline_menit: dm } = konteks.task
  if (dl && (konteks.tanggal > dl || (konteks.tanggal === dl && dm !== null && selesai > dm))) {
    peringatan = 'Blok ini setelah deadline task. Tetap boleh disimpan.'
  }
  return { galat, peringatan }
}

/** E-10: blok diredupkan bila jamnya sudah lewat dan entrinya belum dicentang. */
export function blokRedup(blok: Pick<BlokJam, 'tanggal' | 'selesai_menit'>, entri: Pick<EntriTodo, 'ceklis'>, hariIni: Tanggal, menit: Menit): boolean {
  if (entri.ceklis) return false
  return blok.tanggal < hariIni || (blok.tanggal === hariIni && blok.selesai_menit <= menit)
}
