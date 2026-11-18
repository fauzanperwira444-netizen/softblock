// Kode galat dari Arsitektur Sistem 7.5.
export type KodeGalat =
  | 'sesi_habis'
  | 'tidak_ditemukan'
  | 'versi_konflik'
  | 'dampak_berubah'
  | 'klien_usang'
  | 'validasi_gagal'
  | 'terlalu_banyak_percobaan'
  | 'kesalahan_server'
  | 'jaringan'

export type BadanGalat = {
  kode?: string
  pesan?: string
  kolom?: string
  rincian?: Record<string, string>
  tunggu_detik?: number
  dampak?: unknown
}

const PESAN_BAWAAN: Record<KodeGalat, string> = {
  sesi_habis: 'Sesi habis. Masuk lagi.',
  tidak_ditemukan: 'Data tidak ditemukan.',
  versi_konflik: 'Data berubah di perangkat lain. Muat ulang?',
  dampak_berubah: 'Dampak aksi berubah. Periksa lagi sebelum melanjutkan.',
  klien_usang: 'Ada versi baru aplikasi.',
  validasi_gagal: 'Periksa lagi isian yang ditandai.',
  terlalu_banyak_percobaan: 'Terlalu banyak percobaan. Coba lagi nanti.',
  kesalahan_server: 'Server sedang bermasalah. Coba lagi sebentar lagi.',
  jaringan: 'Tidak tersambung ke server. Periksa jaringan lalu coba lagi.',
}

export class ApiError extends Error {
  readonly kode: KodeGalat
  readonly status: number
  readonly rincian: Record<string, string>
  readonly kolom: string | undefined
  readonly tungguDetik: number | undefined
  readonly dampak: unknown

  constructor(kode: KodeGalat, status: number, badan: BadanGalat = {}) {
    super(badan.pesan ?? PESAN_BAWAAN[kode])
    this.name = 'ApiError'
    this.kode = kode
    this.status = status
    this.rincian = badan.rincian ?? {}
    this.kolom = badan.kolom
    this.tungguDetik = badan.tunggu_detik
    this.dampak = badan.dampak
  }
}

export function kodeDariStatus(status: number, kode: string | undefined): KodeGalat {
  if (status === 401) return 'sesi_habis'
  if (status === 404) return 'tidak_ditemukan'
  if (status === 409) {
    if (kode === 'dampak_berubah' || kode === 'klien_usang') return kode
    return 'versi_konflik'
  }
  if (status === 422) return 'validasi_gagal'
  if (status === 429) return 'terlalu_banyak_percobaan'
  return 'kesalahan_server'
}
