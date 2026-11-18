// Bentuk baris snapshot (Arsitektur Sistem 6.2). Tanggal = ISO "YYYY-MM-DD", jam = menit 0–1440.
// Sementara ditulis tangan; nantinya diganti tipe hasil OpenAPI.

export type Tanggal = string
export type Menit = number

type Baris = { id: string; versi: number }

export type Projek = Baris & {
  nama: string
  deskripsi: string
  warna: string
  batal: boolean
}

export type Dokumen = Baris & { projek_id: string; nama: string; url: string }

export type Sesi = Baris & {
  projek_id: string
  nama: string
  deskripsi: string
  mulai: Tanggal
  akhir: Tanggal
  batal: boolean
}

export type LabelMandiri = Baris & { nama: string; terakhir_dipakai: string | null }

export type Task = Baris & {
  sesi_id: string | null
  label_id: string | null
  nama: string
  deskripsi: string
  deadline_tanggal: Tanggal | null
  deadline_menit: Menit | null
  kesulitan: 1 | 2 | 3 | 4 | 5
  progress: number
  batal: boolean
  dibatalkan_pada: string | null
  dibatalkan_tanggal_lokal: Tanggal | null
  dibuat_tanggal_lokal: Tanggal
}

export type RiwayatProgress = Baris & {
  task_id: string
  sebelum: number
  sesudah: number
  deskripsi: string
  penanda: 'selesai' | 'buka_kembali' | null
  tanggal_lokal: Tanggal
  menit_lokal: Menit
}

export type EntriTodo = Baris & { task_id: string; tanggal: Tanggal; ceklis: boolean }

export type BlokJam = Baris & { entri_id: string; tanggal: Tanggal; mulai_menit: Menit; selesai_menit: Menit }

export type Jadwal = Baris & { nama: string }

export type JadwalVersi = Baris & {
  jadwal_id: string
  /** Hari ISO 1 (Senin) – 7 (Minggu); kosong untuk versi sekali jalan. */
  hari: number[]
  mulai_menit: Menit
  selesai_menit: Menit
  berlaku_mulai: Tanggal
  berlaku_akhir: Tanggal | null
  sekali_jalan: boolean
}

export type Pengecualian = Baris & { jadwal_id: string | null; mulai: Tanggal; akhir: Tanggal; keterangan: string }

export type Tabel = {
  projek: Projek
  dokumen: Dokumen
  sesi: Sesi
  label_mandiri: LabelMandiri
  task: Task
  riwayat_progress: RiwayatProgress
  entri_todo: EntriTodo
  blok_jam: BlokJam
  jadwal: Jadwal
  jadwal_versi: JadwalVersi
  pengecualian: Pengecualian
}

export type NamaTabel = keyof Tabel

export const NAMA_TABEL: NamaTabel[] = [
  'projek',
  'dokumen',
  'sesi',
  'label_mandiri',
  'task',
  'riwayat_progress',
  'entri_todo',
  'blok_jam',
  'jadwal',
  'jadwal_versi',
  'pengecualian',
]

export type IsiTabel = { [K in NamaTabel]: Record<string, Tabel[K]> }

/** Respons aksi pengubah: bentuk "perubahan" yang sama dengan sinkron, ditambah revisi_sebelum (7.3). */
export type ResponsMutasi = {
  revisi: number
  revisi_sebelum: number
  ubah: { [K in NamaTabel]?: Tabel[K][] }
  hapus: Array<{ tabel: NamaTabel; id: string }>
  peringatan: string[]
  /** Id baris baru yang dibuat aksi ini, bila ada. */
  id?: string
}

/** Respons GET /api/sinkron (7.3). */
export type ResponsSinkron = {
  revisi: number
  penuh: boolean
  ubah: { [K in NamaTabel]?: Tabel[K][] }
  hapus: Array<{ tabel: NamaTabel; id: string }>
  meta: { hari_ini: Tanggal; zona_waktu: string }
}
