import { ApiError } from '../api/errors'

export type FormGalat = { umum?: string; terkunci?: boolean; kolom: Record<string, string> }

export const TANPA_GALAT: FormGalat = { kolom: {} }

function menit(detik: number) {
  return Math.max(1, Math.ceil(detik / 60))
}

/** Memetakan galat API ke pesan per kolom (N-20) dan satu pesan umum. */
export function galatForm(e: unknown): FormGalat {
  if (!(e instanceof ApiError)) return { umum: 'Terjadi kesalahan tak terduga. Coba lagi.', kolom: {} }
  if (e.kode === 'terlalu_banyak_percobaan') {
    const tunggu = e.tungguDetik ? ` Coba lagi dalam ${menit(e.tungguDetik)} menit, atau reset password.` : ''
    return { umum: `Terlalu banyak percobaan.${tunggu}`, terkunci: true, kolom: {} }
  }
  if (e.kode === 'validasi_gagal') {
    const adaKolom = Object.keys(e.rincian).length > 0
    return adaKolom ? { kolom: e.rincian } : { umum: e.message, kolom: {} }
  }
  return { umum: e.message, kolom: {} }
}
