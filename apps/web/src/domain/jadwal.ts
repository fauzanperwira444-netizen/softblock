import { hariIso } from './tanggal'
import type { Jadwal, JadwalVersi, Menit, Pengecualian, Tanggal } from './tipe'

// Jadwal efektif dan pola mingguan (Spesifikasi F-01..F-04). Diikat golden fixture bersama PHP (AD-8).

export const JAM_AWAL = 6 * 60
export const JAM_AKHIR = 24 * 60

export type KejadianJadwal = { jadwal: Jadwal; versi: JadwalVersi; mulai: Menit; selesai: Menit }

/** Versi yang berlaku pada tanggal itu, atau undefined. Versi satu Jadwal tidak bertumpuk. */
export function versiBerlaku(versi: JadwalVersi[], jadwalId: string, tanggal: Tanggal): JadwalVersi | undefined {
  return versi.find(
    (v) => v.jadwal_id === jadwalId && v.berlaku_mulai <= tanggal && (v.berlaku_akhir === null || tanggal <= v.berlaku_akhir),
  )
}

/** Pengecualian berlaku untuk Jadwal tertentu, atau semua Jadwal bila jadwal_id kosong (dinamis, F-04). */
export function dikecualikan(pengecualian: Pengecualian[], jadwalId: string, tanggal: Tanggal): boolean {
  return pengecualian.some((p) => (p.jadwal_id === null || p.jadwal_id === jadwalId) && p.mulai <= tanggal && tanggal <= p.akhir)
}

/** Kejadian Jadwal aktif pada sebuah tanggal, urut jam mulai. */
export function jadwalPadaTanggal(
  data: { jadwal: Jadwal[]; versi: JadwalVersi[]; pengecualian: Pengecualian[] },
  tanggal: Tanggal,
): KejadianJadwal[] {
  const hasil: KejadianJadwal[] = []
  const hari = hariIso(tanggal)
  for (const jadwal of data.jadwal) {
    const v = versiBerlaku(data.versi, jadwal.id, tanggal)
    if (!v) continue
    const jatuh = v.sekali_jalan ? v.berlaku_mulai === tanggal : v.hari.includes(hari)
    if (!jatuh || dikecualikan(data.pengecualian, jadwal.id, tanggal)) continue
    hasil.push({ jadwal, versi: v, mulai: v.mulai_menit, selesai: v.selesai_menit })
  }
  return hasil.sort((a, b) => a.mulai - b.mulai)
}

/** Rentang jam [mulai, selesai) bertumpuk; berbatasan (selesai = mulai lain) tidak dihitung bentrok. */
export function jamBertumpuk(a: { mulai: Menit; selesai: Menit }, b: { mulai: Menit; selesai: Menit }): boolean {
  return a.mulai < b.selesai && b.mulai < a.selesai
}
