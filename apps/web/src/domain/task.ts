import { hitungStatusProjek, kunciNama, sesiProjek, type Dampak, type DataProjek } from './projek'
import { bandingkanTaskAktif, PROGRESS_SELESAI, projekTertutup, statusProjek, statusSesi, taskAktif, taskDiLuarPeriode, taskSelesai, taskTelat, type StatusProjek } from './status'
import type { LabelMandiri, Menit, Projek, RiwayatProgress, Sesi, Tanggal, Task } from './tipe'

// Aturan Task, Label, dan Progress (Spesifikasi C-01..C-09, H-02..H-04). Fungsi murni.

export const NAMA_TASK_MAX = 30
export const NAMA_LABEL_MAX = 30
export const DESKRIPSI_TASK_MAX = 1000
export const CATATAN_PROGRESS_MAX = 500

export type DataTask = DataProjek & { riwayat: RiwayatProgress[] }

/** Label task: nama projek untuk task sesi (C-03), nama label untuk task mandiri. */
export type InfoLabel = { jenis: 'projek'; projek: Projek; sesi: Sesi } | { jenis: 'mandiri'; label: LabelMandiri }

export function infoLabel(data: Pick<DataProjek, 'projek' | 'sesi' | 'label'>, task: Task): InfoLabel | null {
  if (task.sesi_id) {
    const sesi = data.sesi.find((s) => s.id === task.sesi_id)
    const projek = sesi && data.projek.find((p) => p.id === sesi.projek_id)
    return sesi && projek ? { jenis: 'projek', projek, sesi } : null
  }
  const label = data.label.find((l) => l.id === task.label_id)
  return label ? { jenis: 'mandiri', label } : null
}

export function namaLabel(info: InfoLabel | null): string {
  if (!info) return ''
  return info.jenis === 'projek' ? info.projek.nama : info.label.nama
}

/** Kunci label untuk keunikan nama task: id projek untuk task sesi, id label untuk mandiri. */
function kunciLabel(data: Pick<DataProjek, 'sesi'>, task: Pick<Task, 'sesi_id' | 'label_id'>): string {
  if (task.sesi_id) return `p:${data.sesi.find((s) => s.id === task.sesi_id)?.projek_id ?? ''}`
  return `l:${task.label_id ?? ''}`
}

/** Status projek tempat task berada; null untuk task mandiri. */
export function statusProjekTask(data: DataProjek, task: Task, hariIni: Tanggal): StatusProjek | null {
  const info = infoLabel(data, task)
  return info?.jenis === 'projek' ? hitungStatusProjek(data, info.projek, hariIni) : null
}

/** Task hanya-baca bila selesai/batal di projek tertutup atau sesi batal (H-06). */
export function taskTerkunci(data: DataProjek, task: Task, hariIni: Tanggal): string | null {
  const st = statusProjekTask(data, task, hariIni)
  if (st && projekTertutup(st)) return 'Projek tertutup terkunci. Buka kembali projeknya dulu.'
  const info = infoLabel(data, task)
  if (info?.jenis === 'projek' && info.sesi.batal) return 'Sesi task ini batal.'
  return null
}

/** Sesi yang boleh menerima task baru atau pindahan: belum mulai/berjalan di projek belum tertutup (C-01, C-04). */
export function sesiTujuan(data: DataProjek, hariIni: Tanggal): Array<{ sesi: Sesi; projek: Projek }> {
  const hasil: Array<{ sesi: Sesi; projek: Projek }> = []
  for (const projek of data.projek) {
    if (projekTertutup(hitungStatusProjek(data, projek, hariIni))) continue
    for (const sesi of sesiProjek(data, projek.id)) {
      const st = statusSesi(sesi, hariIni)
      if (st === 'belum_mulai' || st === 'berjalan') hasil.push({ sesi, projek })
    }
  }
  return hasil.sort((a, b) => (a.projek.nama === b.projek.nama ? (a.sesi.mulai < b.sesi.mulai ? -1 : 1) : a.projek.nama < b.projek.nama ? -1 : 1))
}

/** Saran label: label mandiri yang pernah punya task, terakhir dipakai dulu (C-03). */
export function saranLabel(data: Pick<DataProjek, 'label' | 'task'>): LabelMandiri[] {
  const dipakai = new Set(data.task.map((t) => t.label_id).filter(Boolean))
  return data.label
    .filter((l) => dipakai.has(l.id))
    .sort((a, b) => ((a.terakhir_dipakai ?? '') < (b.terakhir_dipakai ?? '') ? 1 : -1))
}

export function validasiNamaLabel(nama: string, data: Pick<DataProjek, 'label' | 'projek'>, kecualiId: string | null): string | null {
  const k = kunciNama(nama)
  if (!k) return 'Nama label wajib diisi.'
  if (nama.trim().length > NAMA_LABEL_MAX) return `Nama label maksimal ${NAMA_LABEL_MAX} karakter.`
  if (k === 'mandiri') return '"Mandiri" dicadangkan. Pilih nama lain.'
  const projek = data.projek.find((p) => kunciNama(p.nama) === k)
  if (projek) return `Nama sama dengan projek “${projek.nama}”.`
  const sama = data.label.find((l) => l.id !== kecualiId && kunciNama(l.nama) === k)
  if (sama) return `Label “${sama.nama}” sudah ada.`
  return null
}

export type TujuanTask = { jenis: 'sesi'; sesiId: string } | { jenis: 'mandiri'; labelId: string | null; labelBaru: string }

export type IsianTask = {
  nama: string
  deskripsi: string
  deadline_tanggal: Tanggal | ''
  deadline_menit: Menit | null
  kesulitan: number
}

export type GalatTask = Partial<Record<'nama' | 'deskripsi' | 'deadline_tanggal' | 'deadline_menit' | 'kesulitan' | 'tujuan' | 'label', string>>

type KonteksValidasi = {
  data: DataProjek
  hariIni: Tanggal
  menit: Menit
  /** Task yang sedang diubah, untuk mengecualikan dirinya dari keunikan nama. */
  kecualiId: string | null
  /** C-04: validasi deadline hanya berjalan saat deadline atau sesi berubah. */
  periksaDeadline: boolean
  formatTanggal: (t: Tanggal) => string
}

export function validasiTask(isian: IsianTask, tujuan: TujuanTask, k: KonteksValidasi): GalatTask {
  const g: GalatTask = {}
  const nama = isian.nama.trim()
  if (!nama) g.nama = 'Nama task wajib diisi.'
  else if (nama.length > NAMA_TASK_MAX) g.nama = `Nama task maksimal ${NAMA_TASK_MAX} karakter.`
  if (isian.deskripsi.length > DESKRIPSI_TASK_MAX) g.deskripsi = `Deskripsi maksimal ${DESKRIPSI_TASK_MAX} karakter.`
  if (!Number.isInteger(isian.kesulitan) || isian.kesulitan < 1 || isian.kesulitan > 5) g.kesulitan = 'Pilih kesulitan 1 sampai 5.'

  let sesi: Sesi | undefined
  if (tujuan.jenis === 'sesi') {
    sesi = k.data.sesi.find((s) => s.id === tujuan.sesiId)
    if (!sesi) g.tujuan = 'Pilih sesi projek.'
  } else if (!tujuan.labelId) {
    const gl = validasiNamaLabel(tujuan.labelBaru, k.data, null)
    if (gl) g.label = tujuan.labelBaru.trim() ? gl : 'Label wajib untuk task mandiri.'
  }

  if (!g.nama && !g.tujuan && !g.label) {
    const kunci =
      tujuan.jenis === 'sesi'
        ? `p:${sesi?.projek_id ?? ''}`
        : tujuan.labelId
          ? `l:${tujuan.labelId}`
          : `baru:${kunciNama(tujuan.labelBaru)}`
    const bentrok = k.data.task.find(
      (t) => t.id !== k.kecualiId && taskAktif(t) && kunciLabel(k.data, t) === kunci && kunciNama(t.nama) === kunciNama(nama),
    )
    if (bentrok) g.nama = 'Nama sudah dipakai task aktif berlabel sama.'
  }

  if (k.periksaDeadline) {
    if (!isian.deadline_tanggal) {
      if (tujuan.jenis === 'sesi') g.deadline_tanggal = 'Deadline wajib untuk task di sesi.'
      if (isian.deadline_menit !== null) g.deadline_menit = 'Isi tanggal lebih dulu.'
    } else {
      if (isian.deadline_tanggal < k.hariIni) g.deadline_tanggal = 'Deadline harus hari ini atau setelahnya.'
      else if (sesi && (isian.deadline_tanggal < sesi.mulai || isian.deadline_tanggal > sesi.akhir)) {
        g.deadline_tanggal = `Pilih tanggal dalam periode sesi (${k.formatTanggal(sesi.mulai)} – ${k.formatTanggal(sesi.akhir)}).`
      }
      if (isian.deadline_menit !== null) {
        if (isian.deadline_menit % 5 !== 0) g.deadline_menit = 'Jam harus kelipatan 5 menit.'
        else if (isian.deadline_tanggal === k.hariIni && isian.deadline_menit <= k.menit) g.deadline_menit = 'Jam itu sudah lewat.'
      }
    }
  }
  return g
}

/** Status projek bila task ini berubah (selesai, batal, atau pindah); untuk aturan penutupan 2.4. */
export function projekMenjadiSelesai(
  data: DataProjek,
  taskId: string,
  ubah: Partial<Pick<Task, 'progress' | 'batal' | 'sesi_id'>>,
  hariIni: Tanggal,
): Projek | null {
  const task = data.task.find((t) => t.id === taskId)
  if (!task?.sesi_id) return null
  const info = infoLabel(data, task)
  if (info?.jenis !== 'projek') return null
  const sebelum = hitungStatusProjek(data, info.projek, hariIni)
  const tasks = data.task.map((t) => (t.id === taskId ? { ...t, ...ubah } : t))
  const idSesi = new Set(sesiProjek(data, info.projek.id).map((s) => s.id))
  const sesudah = statusProjek(
    info.projek,
    sesiProjek(data, info.projek.id),
    tasks.filter((t) => t.sesi_id !== null && idSesi.has(t.sesi_id)),
    hariIni,
  )
  return sebelum !== 'selesai' && sesudah === 'selesai' ? info.projek : null
}

/**
 * Dampak aksi task yang menutup projek (2.4): dikirim ke server agar dicek ulang.
 * Null bila aksi tidak membuat projek menjadi selesai, sehingga tidak perlu dialog berat.
 */
export function dampakTask(
  data: DataProjek,
  taskId: string,
  ubah: Partial<Pick<Task, 'progress' | 'batal' | 'sesi_id'>>,
  hariIni: Tanggal,
): Dampak | null {
  if (!projekMenjadiSelesai(data, taskId, ubah, hariIni)) return null
  return {
    projek_menjadi: 'selesai',
    task_batal: ubah.batal ? [taskId] : [],
    task_di_luar_periode: [],
    sesi_dihapus: [],
    sesi_batal: [],
    sesi_dipotong: [],
  }
}

/** Waktu selesai = baris riwayat terakhir bertanda selesai (DA-7). */
export function waktuSelesai(riwayat: RiwayatProgress[], taskId: string): string | null {
  const r = riwayat
    .filter((x) => x.task_id === taskId && x.penanda === 'selesai')
    .sort((a, b) => (a.tanggal_lokal + String(a.menit_lokal).padStart(4, '0') < b.tanggal_lokal + String(b.menit_lokal).padStart(4, '0') ? 1 : -1))[0]
  return r ? `${r.tanggal_lokal}T${String(r.menit_lokal).padStart(4, '0')}` : null
}

/** Nilai progress sebelum 10, dipakai saat buka kembali (C-07). */
export function progressSebelumSelesai(riwayat: RiwayatProgress[], taskId: string): number {
  const r = riwayat
    .filter((x) => x.task_id === taskId && x.sesudah === PROGRESS_SELESAI)
    .sort((a, b) => (a.tanggal_lokal + String(a.menit_lokal).padStart(4, '0') < b.tanggal_lokal + String(b.menit_lokal).padStart(4, '0') ? 1 : -1))[0]
  return Math.min(r?.sebelum ?? 9, 9)
}

export function syaratBukaKembaliTask(data: DataProjek, task: Task, hariIni: Tanggal): string | null {
  if (!taskSelesai(task)) return 'Hanya task selesai yang bisa dibuka kembali.'
  const info = infoLabel(data, task)
  if (info?.jenis === 'projek') {
    if (info.sesi.batal) return 'Sesi task ini batal.'
    if (projekTertutup(hitungStatusProjek(data, info.projek, hariIni))) return 'Projek tertutup. Buka kembali projeknya dulu.'
  }
  return null
}

/** Nama bentrok dengan task aktif berlabel sama saat buka kembali (C-07). */
export function namaBentrokBukaKembali(data: DataProjek, task: Task, nama: string): boolean {
  const kunci = kunciLabel(data, task)
  return data.task.some((t) => t.id !== task.id && taskAktif(t) && kunciLabel(data, t) === kunci && kunciNama(t.nama) === kunciNama(nama))
}

// Filter dan pencarian Daftar Task (H-02..H-04).

export type StatusFilter = 'aktif' | 'telat' | 'selesai' | 'batal' | 'luar' | 'tanpa_deadline' | 'semua'

export type FilterTask = {
  /** id projek, 'mandiri', atau kosong untuk semua. */
  projek: string
  sesi: string
  label: string
  status: StatusFilter
  /** Status dipilih sendiri oleh pengguna; pencarian hanya melepas status bawaan (H-04). */
  statusEksplisit: boolean
  cari: string
}

export const FILTER_AWAL: FilterTask = { projek: '', sesi: '', label: '', status: 'aktif', statusEksplisit: false, cari: '' }

function cocokStatus(data: DataProjek, t: Task, status: StatusFilter, hariIni: Tanggal, menit: Menit): boolean {
  switch (status) {
    case 'semua':
      return true
    case 'aktif':
      return taskAktif(t)
    case 'selesai':
      return taskSelesai(t)
    case 'batal':
      return t.batal
    case 'telat':
      return taskTelat(t, hariIni, menit)
    case 'luar':
      return taskAktif(t) && taskDiLuarPeriode(t, data.sesi.find((s) => s.id === t.sesi_id))
    case 'tanpa_deadline':
      return taskAktif(t) && !t.deadline_tanggal
  }
}

export function saringTask(data: DataTask, f: FilterTask, hariIni: Tanggal, menit: Menit): Task[] {
  const cari = kunciNama(f.cari)
  const status = cari && !f.statusEksplisit ? 'semua' : f.status
  const cocok = data.task.filter((t) => {
    const info = infoLabel(data, t)
    if (f.projek === 'mandiri' && info?.jenis !== 'mandiri') return false
    if (f.projek && f.projek !== 'mandiri' && (info?.jenis !== 'projek' || info.projek.id !== f.projek)) return false
    if (f.sesi && t.sesi_id !== f.sesi) return false
    if (f.label && t.label_id !== f.label) return false
    if (!cocokStatus(data, t, status, hariIni, menit)) return false
    if (cari) {
      const teks = [t.nama, info?.jenis === 'projek' ? info.projek.nama : '', info?.jenis === 'mandiri' ? info.label.nama : '']
      if (!teks.some((x) => kunciNama(x).includes(cari))) return false
    }
    return true
  })
  return cocok.sort(urutanDaftar(data))
}

/** Aktif (D-04), lalu selesai menurut waktu selesai terbaru, lalu batal menurut waktu batal terbaru (H-02, H-04). */
export function urutanDaftar(data: DataTask) {
  const selesaiPada = new Map(data.task.filter(taskSelesai).map((t) => [t.id, waktuSelesai(data.riwayat, t.id) ?? '']))
  return (a: Task, b: Task): number => {
    const kelas = (t: Task) => (t.batal ? 2 : taskSelesai(t) ? 1 : 0)
    if (kelas(a) !== kelas(b)) return kelas(a) - kelas(b)
    if (kelas(a) === 0) return bandingkanTaskAktif(a, b)
    const wa = kelas(a) === 1 ? (selesaiPada.get(a.id) ?? '') : (a.dibatalkan_pada ?? '')
    const wb = kelas(b) === 1 ? (selesaiPada.get(b.id) ?? '') : (b.dibatalkan_pada ?? '')
    return wa < wb ? 1 : wa > wb ? -1 : 0
  }
}
