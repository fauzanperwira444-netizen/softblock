import { statusProjek, statusSesi, taskAktif, taskSelesai, type StatusProjek } from './status'
import { rentangBertumpuk, tambahHari } from './tanggal'
import type { LabelMandiri, Projek, Sesi, Tanggal, Task } from './tipe'

// Aturan Projek dan Sesi (Spesifikasi 2.3, 2.4, A-01..A-08, B-01..B-06). Fungsi murni.

export const NAMA_PROJEK_MAX = 45
export const NAMA_SESI_MAX = 45
export const DESKRIPSI_MAX = 500
export const DOKUMEN_MAX = 10
const NAMA_DICADANGKAN = 'mandiri'

/** 12 warna otomatis; semuanya berkontras ≥3:1 di kartu terang dan gelap (A-02). */
export const PALET_PROJEK = [
  '#2e8b7a',
  '#4a8a3c',
  '#8a7d1f',
  '#b26a00',
  '#c2571a',
  '#c0392b',
  '#c2416b',
  '#8e5bb5',
  '#5b6ad0',
  '#2f7fc1',
  '#1f8aa0',
  '#9a6b4f',
] as const

export const kunciNama = (s: string) => s.trim().toLocaleLowerCase('id')

export type DataProjek = {
  projek: Projek[]
  sesi: Sesi[]
  task: Task[]
  label: LabelMandiri[]
}

export function sesiProjek(data: Pick<DataProjek, 'sesi'>, projekId: string): Sesi[] {
  return data.sesi.filter((s) => s.projek_id === projekId)
}

export function taskProjek(data: Pick<DataProjek, 'sesi' | 'task'>, projekId: string): Task[] {
  const ids = new Set(sesiProjek(data, projekId).map((s) => s.id))
  return data.task.filter((t) => t.sesi_id !== null && ids.has(t.sesi_id))
}

export function hitungStatusProjek(data: Pick<DataProjek, 'sesi' | 'task'>, projek: Projek, hariIni: Tanggal): StatusProjek {
  return statusProjek(projek, sesiProjek(data, projek.id), taskProjek(data, projek.id), hariIni)
}

export function validasiNamaProjek(
  nama: string,
  data: Pick<DataProjek, 'projek' | 'label'>,
  kecualiId: string | null,
): string | null {
  const k = kunciNama(nama)
  if (!k) return 'Nama projek wajib diisi.'
  if (nama.trim().length > NAMA_PROJEK_MAX) return `Nama projek maksimal ${NAMA_PROJEK_MAX} karakter.`
  if (k === NAMA_DICADANGKAN) return '"Mandiri" dipakai untuk task tanpa projek. Pilih nama lain.'
  const sama = data.projek.find((p) => p.id !== kecualiId && kunciNama(p.nama) === k)
  if (sama) return `Nama sudah dipakai projek “${sama.nama}”.`
  const label = data.label.find((l) => kunciNama(l.nama) === k)
  if (label) return `Nama sama dengan label mandiri “${label.nama}”. Ganti nama projek atau label itu.`
  return null
}

/** Warna yang sedang dipakai projek belum tertutup (selain projek ini). */
export function warnaTerpakai(data: Pick<DataProjek, 'projek' | 'sesi' | 'task'>, hariIni: Tanggal, kecualiId: string | null): Set<string> {
  const terpakai = new Set<string>()
  for (const p of data.projek) {
    if (p.id === kecualiId) continue
    const st = hitungStatusProjek(data, p, hariIni)
    if (st !== 'selesai' && st !== 'batal') terpakai.add(p.warna.toLowerCase())
  }
  return terpakai
}

export function warnaPertamaBebas(terpakai: Set<string>): string | null {
  return PALET_PROJEK.find((w) => !terpakai.has(w)) ?? null
}

export type IsianSesi = { nama: string; mulai: Tanggal; akhir: Tanggal; deskripsi: string }
export type GalatSesi = Partial<Record<'nama' | 'mulai' | 'akhir' | 'deskripsi' | 'umum', string>>

export function validasiSesi(
  isian: IsianSesi,
  sesiLain: Sesi[],
  hariIni: Tanggal,
  opsi: { kecualiId: string | null; periodeBerubah: boolean },
  formatRentang: (mulai: Tanggal, akhir: Tanggal) => string,
): GalatSesi {
  const g: GalatSesi = {}
  const k = kunciNama(isian.nama)
  const aktif = sesiLain.filter((s) => !s.batal && s.id !== opsi.kecualiId)
  if (!k) g.nama = 'Nama sesi wajib diisi.'
  else if (isian.nama.trim().length > NAMA_SESI_MAX) g.nama = `Nama sesi maksimal ${NAMA_SESI_MAX} karakter.`
  else {
    const sama = aktif.find((s) => kunciNama(s.nama) === k)
    if (sama) g.nama = 'Nama sesi sudah dipakai di projek ini.'
  }
  if (isian.deskripsi.length > DESKRIPSI_MAX) g.deskripsi = `Deskripsi maksimal ${DESKRIPSI_MAX} karakter.`
  if (!opsi.periodeBerubah) return g

  if (!isian.mulai) g.mulai = 'Tanggal mulai wajib diisi.'
  if (!isian.akhir) g.akhir = 'Tanggal akhir wajib diisi.'
  if (g.mulai || g.akhir) return g
  if (isian.akhir < isian.mulai) g.akhir = 'Tanggal akhir harus pada atau setelah tanggal mulai.'
  else if (isian.akhir < hariIni) g.akhir = 'Tanggal akhir harus hari ini atau setelahnya.'
  else {
    const tabrak = aktif.find((s) => rentangBertumpuk(s, isian))
    if (tabrak) {
      const saran = tambahHari(tabrak.akhir, 1)
      g.umum = `Periode bertabrakan dengan “${tabrak.nama}” (${formatRentang(tabrak.mulai, tabrak.akhir)}). Mulai paling cepat ${formatRentang(saran, saran)} atau akhiri sebelum ${formatRentang(tabrak.mulai, tabrak.mulai)}.`
    }
  }
  return g
}

// Kontrak dampak (Arsitektur Sistem 7.4). Daftar id diurutkan agar perbandingan stabil.
export type Dampak = {
  projek_menjadi: StatusProjek | 'dihapus'
  task_batal: string[]
  task_di_luar_periode: string[]
  sesi_dihapus: string[]
  sesi_batal: string[]
  sesi_dipotong: Array<{ id: string; akhir_baru: Tanggal }>
}

function rapikan(d: Dampak): Dampak {
  return {
    ...d,
    task_batal: [...d.task_batal].sort(),
    task_di_luar_periode: [...d.task_di_luar_periode].sort(),
    sesi_dihapus: [...d.sesi_dihapus].sort(),
    sesi_batal: [...d.sesi_batal].sort(),
    sesi_dipotong: [...d.sesi_dipotong].sort((a, b) => (a.id < b.id ? -1 : 1)),
  }
}

export function dampakSama(a: Dampak, b: Dampak): boolean {
  return JSON.stringify(rapikan(a)) === JSON.stringify(rapikan(b))
}

/** Terapkan dampak ke salinan data untuk menghitung status projek sesudahnya. */
function statusSetelah(data: DataProjek, projek: Projek, d: Omit<Dampak, 'projek_menjadi'>, hariIni: Tanggal, batal = false): StatusProjek {
  const dihapus = new Set(d.sesi_dihapus)
  const batalSesi = new Set(d.sesi_batal)
  const potong = new Map(d.sesi_dipotong.map((x) => [x.id, x.akhir_baru]))
  const taskBatal = new Set(d.task_batal)
  const sesi = sesiProjek(data, projek.id)
    .filter((s) => !dihapus.has(s.id))
    .map((s) => ({ ...s, batal: s.batal || batalSesi.has(s.id), akhir: potong.get(s.id) ?? s.akhir }))
  const task = taskProjek(data, projek.id).map((t) => ({ ...t, batal: t.batal || taskBatal.has(t.id) }))
  return statusProjek({ batal: projek.batal || batal }, sesi, task, hariIni)
}

const kosong = (): Omit<Dampak, 'projek_menjadi'> => ({
  task_batal: [],
  task_di_luar_periode: [],
  sesi_dihapus: [],
  sesi_batal: [],
  sesi_dipotong: [],
})

/** Alasan aksi tidak tersedia, atau null bila boleh. */
export type Syarat = string | null

export function syaratSelesaiDini(data: DataProjek, projek: Projek, hariIni: Tanggal): Syarat {
  const st = hitungStatusProjek(data, projek, hariIni)
  if (st !== 'berjalan' && st !== 'jeda') return 'Selesai dini hanya untuk projek berjalan atau jeda.'
  if (taskProjek(data, projek.id).some(taskAktif)) return 'Selesaikan atau batalkan semua task aktif lebih dulu.'
  return null
}

/** A-04: sesi berjalan dipotong sampai kemarin; sesi mulai hari ini atau nanti dihapus (kosong) atau batal (bertask). */
export function dampakSelesaiDini(data: DataProjek, projek: Projek, hariIni: Tanggal): Dampak {
  const d = kosong()
  const kemarin = tambahHari(hariIni, -1)
  const tasks = taskProjek(data, projek.id)
  for (const s of sesiProjek(data, projek.id)) {
    if (s.batal || s.akhir < hariIni) continue
    const isi = tasks.filter((t) => t.sesi_id === s.id)
    if (s.mulai >= hariIni) {
      if (isi.length === 0) d.sesi_dihapus.push(s.id)
      else d.sesi_batal.push(s.id)
    } else {
      d.sesi_dipotong.push({ id: s.id, akhir_baru: kemarin })
      for (const t of isi) {
        if (taskSelesai(t) && t.deadline_tanggal && t.deadline_tanggal > kemarin) d.task_di_luar_periode.push(t.id)
      }
    }
  }
  return rapikan({ ...d, projek_menjadi: statusSetelah(data, projek, d, hariIni) })
}

export function syaratBatalProjek(data: DataProjek, projek: Projek, hariIni: Tanggal): Syarat {
  const st = hitungStatusProjek(data, projek, hariIni)
  if (st === 'selesai' || st === 'batal') return 'Projek tertutup tidak bisa dibatalkan.'
  return null
}

/** A-05: task aktif batal; sesi berjalan dan belum mulai batal; projek tanpa sesi bertask dihapus. */
export function dampakBatalProjek(data: DataProjek, projek: Projek, hariIni: Tanggal): Dampak {
  const d = kosong()
  const tasks = taskProjek(data, projek.id)
  d.task_batal = tasks.filter(taskAktif).map((t) => t.id)
  for (const s of sesiProjek(data, projek.id)) {
    if (!s.batal && s.akhir >= hariIni) d.sesi_batal.push(s.id)
  }
  const adaSesiBertask = sesiProjek(data, projek.id).some((s) => tasks.some((t) => t.sesi_id === s.id))
  return rapikan({ ...d, projek_menjadi: adaSesiBertask ? 'batal' : 'dihapus' })
}

export function syaratHapusProjek(data: DataProjek, projek: Projek): Syarat {
  return sesiProjek(data, projek.id).length > 0 ? 'Hanya projek tanpa sesi yang bisa dihapus. Pakai Batal projek.' : null
}

export function syaratBatalSesi(sesi: Sesi, hariIni: Tanggal): Syarat {
  if (sesi.batal) return 'Sesi sudah batal.'
  if (statusSesi(sesi, hariIni) === 'selesai') return 'Sesi yang sudah selesai tidak bisa dibatalkan.'
  return null
}

/** B-06: task aktif di sesi batal; periode tidak dipotong. */
export function dampakBatalSesi(data: DataProjek, projek: Projek, sesi: Sesi, hariIni: Tanggal): Dampak {
  const d = kosong()
  d.task_batal = data.task.filter((t) => t.sesi_id === sesi.id && taskAktif(t)).map((t) => t.id)
  d.sesi_batal = [sesi.id]
  return rapikan({ ...d, projek_menjadi: statusSetelah(data, projek, d, hariIni) })
}

export function syaratHapusSesi(data: Pick<DataProjek, 'task'>, sesi: Sesi, hariIni: Tanggal): Syarat {
  const bertask = data.task.some((t) => t.sesi_id === sesi.id)
  if (bertask) return 'Sesi berisi task tidak bisa dihapus. Pakai Batal sesi.'
  const st = statusSesi(sesi, hariIni)
  if (st !== 'belum_mulai' && st !== 'batal') return 'Hanya sesi belum mulai atau batal yang bisa dihapus.'
  return null
}

export function dampakHapusSesi(data: DataProjek, projek: Projek, sesi: Sesi, hariIni: Tanggal): Dampak {
  const d = { ...kosong(), sesi_dihapus: [sesi.id] }
  return rapikan({ ...d, projek_menjadi: statusSetelah(data, projek, d, hariIni) })
}

export function syaratUbahPeriode(sesi: Sesi, hariIni: Tanggal): Syarat {
  const st = statusSesi(sesi, hariIni)
  if (st !== 'belum_mulai' && st !== 'berjalan') return 'Periode sesi selesai atau batal terkunci.'
  return null
}

/** B-05: task yang baru keluar periode karena rentang baru. */
export function dampakUbahPeriode(data: DataProjek, projek: Projek, sesi: Sesi, mulai: Tanggal, akhir: Tanggal, hariIni: Tanggal): Dampak {
  const d = kosong()
  for (const t of data.task) {
    if (t.sesi_id !== sesi.id || t.batal || !t.deadline_tanggal) continue
    const dulu = t.deadline_tanggal >= sesi.mulai && t.deadline_tanggal <= sesi.akhir
    const kini = t.deadline_tanggal >= mulai && t.deadline_tanggal <= akhir
    if (dulu && !kini) d.task_di_luar_periode.push(t.id)
  }
  const salinan: DataProjek = { ...data, sesi: data.sesi.map((s) => (s.id === sesi.id ? { ...s, mulai, akhir } : s)) }
  return rapikan({ ...d, projek_menjadi: statusSetelah(salinan, projek, d, hariIni) })
}

/** Dialog berat diperlukan bila ada rincian dampak atau projek menjadi selesai (2.4, I-03). */
export function perluDialogBerat(sebelum: StatusProjek, d: Dampak): boolean {
  const menutup = d.projek_menjadi === 'selesai' && sebelum !== 'selesai'
  return (
    menutup ||
    d.task_batal.length > 0 ||
    d.task_di_luar_periode.length > 0 ||
    d.sesi_batal.length > 0 ||
    d.sesi_dipotong.length > 0
  )
}

export function syaratBukaKembali(data: DataProjek, projek: Projek, hariIni: Tanggal): Syarat {
  const st = hitungStatusProjek(data, projek, hariIni)
  return st === 'selesai' || st === 'batal' ? null : 'Hanya projek selesai atau batal yang bisa dibuka kembali.'
}

/** "https://" ditambahkan bila tanpa skema; hanya http/https yang diterima (A-08, N-27). */
export function rapikanUrl(masukan: string): string | null {
  const s = masukan.trim()
  if (!s) return null
  const dengan = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`
  try {
    const u = new URL(dengan)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (!u.hostname.includes('.')) return null
    return u.toString()
  } catch {
    return null
  }
}
