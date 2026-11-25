import type { Tanggal } from '../domain/tipe'

/** Akun yang dibuat pada atau setelah tanggal ini mendapat pengenalan otomatis (O-01). */
export const TANGGAL_RILIS_PENGENALAN: Tanggal = '2026-11-25'

/** DA-11: status pengenalan per akun, hanya di perangkat ini. */
export type StatusPengenalan = {
  awal: boolean
  /** Kunci halaman yang pengenalannya sudah diselesaikan atau dilewati. */
  halaman: string[]
  mati: boolean
  /** Dinyalakan "Tampilkan pengenalan lagi", sehingga berlaku juga untuk akun lama (O-06). */
  aktif: boolean
}

export const STATUS_AWAL: StatusPengenalan = { awal: false, halaman: [], mati: false, aktif: false }

const kunci = (akunId: string) => `softblock:pengenalan:${akunId}`

// Bila localStorage diblokir, status hanya diingat selama aplikasi terbuka.
const cadangan = new Map<string, StatusPengenalan>()

function rapikan(nilai: unknown): StatusPengenalan {
  if (!nilai || typeof nilai !== 'object') return STATUS_AWAL
  const v = nilai as Partial<StatusPengenalan>
  return {
    awal: v.awal === true,
    halaman: Array.isArray(v.halaman) ? v.halaman.filter((h): h is string => typeof h === 'string') : [],
    mati: v.mati === true,
    aktif: v.aktif === true,
  }
}

export function bacaStatus(akunId: string): StatusPengenalan {
  try {
    const isi = localStorage.getItem(kunci(akunId))
    if (isi !== null) return rapikan(JSON.parse(isi))
  } catch {
    // Isi rusak atau penyimpanan diblokir: jatuh ke cadangan di memori.
  }
  return cadangan.get(akunId) ?? STATUS_AWAL
}

export function simpanStatus(akunId: string, status: StatusPengenalan) {
  cadangan.set(akunId, status)
  try {
    localStorage.setItem(kunci(akunId), JSON.stringify(status))
  } catch {
    // Mode privat atau kuota penuh; cadangan di memori sudah diperbarui.
  }
}

export function pengenalanBerlaku(status: StatusPengenalan, akunDibuat: Tanggal | null | undefined): boolean {
  if (status.mati) return false
  return status.aktif || (akunDibuat != null && akunDibuat >= TANGGAL_RILIS_PENGENALAN)
}

export function tandaiHalaman(status: StatusPengenalan, halaman: string): StatusPengenalan {
  return status.halaman.includes(halaman) ? status : { ...status, halaman: [...status.halaman, halaman] }
}
