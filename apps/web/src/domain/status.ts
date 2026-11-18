import { dalamRentang } from './tanggal'
import type { Menit, Projek, Sesi, Tanggal, Task } from './tipe'

// Aturan status turunan (Spesifikasi 2.1, 2.2, B-04, H-03). Diikat golden fixture bersama PHP (AD-8).

export const PROGRESS_SELESAI = 10
/** Deadline tanpa jam dianggap 23.59. */
export const MENIT_TANPA_JAM = 23 * 60 + 59

export function taskSelesai(task: Pick<Task, 'progress' | 'batal'>): boolean {
  return !task.batal && task.progress >= PROGRESS_SELESAI
}

export function taskAktif(task: Pick<Task, 'progress' | 'batal'>): boolean {
  return !task.batal && task.progress < PROGRESS_SELESAI
}

/** Task aktif yang deadline-nya sudah lewat (tanggal dan jam). */
export function taskTelat(
  task: Pick<Task, 'progress' | 'batal' | 'deadline_tanggal' | 'deadline_menit'>,
  hariIni: Tanggal,
  menitSekarang: Menit,
): boolean {
  if (!taskAktif(task) || !task.deadline_tanggal) return false
  if (task.deadline_tanggal < hariIni) return true
  if (task.deadline_tanggal > hariIni) return false
  return menitSekarang > (task.deadline_menit ?? MENIT_TANPA_JAM)
}

/** Task sesi yang deadline-nya berada di luar periode sesinya (setelah ubah periode atau selesai dini). */
export function taskDiLuarPeriode(task: Pick<Task, 'deadline_tanggal'>, sesi: Pick<Sesi, 'mulai' | 'akhir'> | undefined): boolean {
  if (!sesi || !task.deadline_tanggal) return false
  return !dalamRentang(task.deadline_tanggal, sesi.mulai, sesi.akhir)
}

export type StatusSesi = 'belum_mulai' | 'berjalan' | 'selesai' | 'batal'

export function statusSesi(sesi: Pick<Sesi, 'mulai' | 'akhir' | 'batal'>, hariIni: Tanggal): StatusSesi {
  if (sesi.batal) return 'batal'
  if (hariIni < sesi.mulai) return 'belum_mulai'
  if (hariIni > sesi.akhir) return 'selesai'
  return 'berjalan'
}

export type StatusProjek =
  | 'belum_dijadwalkan'
  | 'belum_mulai'
  | 'berjalan'
  | 'jeda'
  | 'melewati_jadwal'
  | 'selesai'
  | 'batal'

/**
 * Status projek menurut tabel 2.2. `tasks` = semua task di sesi projek ini; hanya task aktif
 * yang menentukan beda "melewati jadwal" dan "selesai".
 */
export function statusProjek(
  projek: Pick<Projek, 'batal'>,
  sesi: Array<Pick<Sesi, 'mulai' | 'akhir' | 'batal'>>,
  tasks: Array<Pick<Task, 'progress' | 'batal'>>,
  hariIni: Tanggal,
): StatusProjek {
  if (projek.batal) return 'batal'
  const aktif = sesi.filter((s) => !s.batal)
  if (aktif.length === 0) return 'belum_dijadwalkan'
  if (aktif.some((s) => dalamRentang(hariIni, s.mulai, s.akhir))) return 'berjalan'
  const sudahLewat = aktif.filter((s) => s.akhir < hariIni)
  if (sudahLewat.length === 0) return 'belum_mulai'
  if (sudahLewat.length < aktif.length) return 'jeda'
  return tasks.some(taskAktif) ? 'melewati_jadwal' : 'selesai'
}

export function projekTertutup(status: StatusProjek): boolean {
  return status === 'selesai' || status === 'batal'
}

export const LABEL_STATUS_PROJEK: Record<StatusProjek, string> = {
  belum_dijadwalkan: 'Belum dijadwalkan',
  belum_mulai: 'Belum mulai',
  berjalan: 'Berjalan',
  jeda: 'Jeda',
  melewati_jadwal: 'Melewati jadwal',
  selesai: 'Selesai',
  batal: 'Batal',
}

export const LABEL_STATUS_SESI: Record<StatusSesi, string> = {
  belum_mulai: 'Belum mulai',
  berjalan: 'Berjalan',
  selesai: 'Selesai',
  batal: 'Batal',
}

/** "N dari M task selesai"; M tidak menghitung task batal (A-08). */
export function nDariM(tasks: Array<Pick<Task, 'progress' | 'batal'>>): { n: number; m: number } {
  const tidakBatal = tasks.filter((t) => !t.batal)
  return { n: tidakBatal.filter(taskSelesai).length, m: tidakBatal.length }
}

type TaskUrut = Pick<Task, 'nama' | 'kesulitan' | 'deadline_tanggal' | 'deadline_menit'>

const pembanding = new Intl.Collator('id', { sensitivity: 'base', numeric: true })

/**
 * Urutan task aktif (D-04): tanggal, jam (tanpa jam = 23.59), kesulitan 1→5, lalu abjad.
 * Task tanpa deadline paling bawah, diurut kesulitan lalu abjad.
 */
export function bandingkanTaskAktif(a: TaskUrut, b: TaskUrut): number {
  if (a.deadline_tanggal !== b.deadline_tanggal) {
    if (!a.deadline_tanggal) return 1
    if (!b.deadline_tanggal) return -1
    return a.deadline_tanggal < b.deadline_tanggal ? -1 : 1
  }
  if (a.deadline_tanggal) {
    const ma = a.deadline_menit ?? MENIT_TANPA_JAM
    const mb = b.deadline_menit ?? MENIT_TANPA_JAM
    if (ma !== mb) return ma - mb
  }
  if (a.kesulitan !== b.kesulitan) return a.kesulitan - b.kesulitan
  return pembanding.compare(a.nama, b.nama)
}
