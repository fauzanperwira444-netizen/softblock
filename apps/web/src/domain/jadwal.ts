import { hariIso, tambahHari } from './tanggal'
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

export const NAMA_JADWAL_MAX = 30

export type IsianJadwal = {
  nama: string
  mulai: Menit
  selesai: Menit
  sekaliJalan: boolean
  hari: number[]
  /** Tanggal mulai berlaku (mingguan) atau tanggal kejadian (sekali jalan). */
  tanggal: Tanggal
  /** Tanggal berakhir inklusif, opsional, hanya untuk mingguan. */
  berakhir: Tanggal | null
}

export type GalatJadwal = Partial<Record<'nama' | 'jam' | 'hari' | 'tanggal' | 'berakhir', string>>

/** F-01, F-02: validasi isian Jadwal. Bentrok dengan Jadwal lain hanya peringatan (F-05). */
export function validasiJadwal(isian: IsianJadwal, hariIni: Tanggal): GalatJadwal {
  const g: GalatJadwal = {}
  const nama = isian.nama.trim()
  if (!nama) g.nama = 'Nama Jadwal wajib diisi.'
  else if (nama.length > NAMA_JADWAL_MAX) g.nama = `Nama maksimal ${NAMA_JADWAL_MAX} karakter.`
  if (isian.mulai < JAM_AWAL || isian.selesai > JAM_AKHIR) g.jam = 'Jam harus di antara 06.00 dan 24.00.'
  else if (isian.mulai % 5 !== 0 || isian.selesai % 5 !== 0) g.jam = 'Jam harus kelipatan 5 menit.'
  else if (isian.mulai >= isian.selesai) g.jam = 'Jam mulai harus lebih awal dari jam selesai.'
  if (!isian.sekaliJalan && isian.hari.length === 0) g.hari = 'Pilih minimal satu hari.'
  if (!isian.tanggal) g.tanggal = 'Tanggal wajib diisi.'
  else if (isian.tanggal < hariIni) g.tanggal = 'Tanggal harus hari ini atau setelahnya.'
  if (!isian.sekaliJalan && isian.berakhir && isian.tanggal && isian.berakhir < isian.tanggal) {
    g.berakhir = 'Tanggal berakhir harus pada atau setelah tanggal mulai.'
  }
  return g
}

/** Versi baru dari isian: sekali jalan = versi satu hari. */
export function versiDariIsian(isian: IsianJadwal): Pick<JadwalVersi, 'hari' | 'mulai_menit' | 'selesai_menit' | 'berlaku_mulai' | 'berlaku_akhir' | 'sekali_jalan'> {
  return {
    hari: isian.sekaliJalan ? [] : [...isian.hari].sort(),
    mulai_menit: isian.mulai,
    selesai_menit: isian.selesai,
    berlaku_mulai: isian.tanggal,
    berlaku_akhir: isian.sekaliJalan ? isian.tanggal : isian.berakhir,
    sekali_jalan: isian.sekaliJalan,
  }
}

/** Apakah versi ini jatuh pada setidaknya satu hari di [dari, sampai] (inklusif). */
function versiJatuhDalam(v: JadwalVersi, dari: Tanggal, sampai: Tanggal): boolean {
  const awal = v.berlaku_mulai > dari ? v.berlaku_mulai : dari
  const akhir = v.berlaku_akhir !== null && v.berlaku_akhir < sampai ? v.berlaku_akhir : sampai
  if (awal > akhir) return false
  if (v.sekali_jalan) return true
  let t = awal
  for (let i = 0; i < 7 && t <= akhir; i++) {
    if (v.hari.includes(hariIso(t))) return true
    t = tambahHari(t, 1)
  }
  return false
}

/** F-03: Jadwal yang pernah berlaku di hari lewat tidak bisa dihapus, hanya diakhiri. */
export function pernahBerlaku(versi: JadwalVersi[], jadwalId: string, hariIni: Tanggal): boolean {
  const kemarin = tambahHari(hariIni, -1)
  return versi.some((v) => v.jadwal_id === jadwalId && v.berlaku_mulai <= kemarin && versiJatuhDalam(v, v.berlaku_mulai, kemarin))
}

export function versiTerakhir(versi: JadwalVersi[], jadwalId: string): JadwalVersi | undefined {
  return versi.filter((v) => v.jadwal_id === jadwalId).sort((a, b) => (a.berlaku_mulai < b.berlaku_mulai ? 1 : -1))[0]
}

/** Sub-tab Aktif (belum berakhir) atau Berakhir (tanggal berakhir sudah lewat), J-03. */
export function jadwalBerakhir(versi: JadwalVersi[], jadwalId: string, hariIni: Tanggal): boolean {
  const v = versiTerakhir(versi, jadwalId)
  return !!v && v.berlaku_akhir !== null && v.berlaku_akhir < hariIni
}

/**
 * Peringatan bentrok antar-Jadwal (F-05) dalam 8 minggu ke depan sejak tanggal mulai isian.
 * Mengembalikan nama Jadwal lain yang bertumpuk jam pada hari yang sama.
 */
export function bentrokJadwalLain(
  data: { jadwal: Jadwal[]; versi: JadwalVersi[]; pengecualian: Pengecualian[] },
  isian: IsianJadwal,
  kecualiJadwalId: string | null,
): Array<{ nama: string; tanggal: Tanggal; mulai: Menit; selesai: Menit }> {
  const hasil: Array<{ nama: string; tanggal: Tanggal; mulai: Menit; selesai: Menit }> = []
  const dilihat = new Set<string>()
  const lain = { ...data, jadwal: data.jadwal.filter((j) => j.id !== kecualiJadwalId) }
  const hariList = isian.sekaliJalan ? [isian.tanggal] : Array.from({ length: 56 }, (_, i) => tambahHari(isian.tanggal, i))
  for (const t of hariList) {
    if (!isian.sekaliJalan && (!isian.hari.includes(hariIso(t)) || (isian.berakhir && t > isian.berakhir))) continue
    for (const k of jadwalPadaTanggal(lain, t)) {
      if (dilihat.has(k.jadwal.id) || !jamBertumpuk(k, isian)) continue
      dilihat.add(k.jadwal.id)
      hasil.push({ nama: k.jadwal.nama, tanggal: t, mulai: k.mulai, selesai: k.selesai })
    }
  }
  return hasil
}

/** F-04: tanggal kejadian isian yang jatuh dalam pengecualian (cukup kejadian pertama). */
export function jatuhDalamPengecualian(pengecualian: Pengecualian[], isian: IsianJadwal, jadwalId: string | null): Pengecualian | undefined {
  return pengecualian.find(
    (p) =>
      (p.jadwal_id === null || p.jadwal_id === jadwalId) &&
      p.akhir >= isian.tanggal &&
      (isian.sekaliJalan ? p.mulai <= isian.tanggal : !isian.berakhir || p.mulai <= isian.berakhir),
  )
}


/** Rentang jam [mulai, selesai) bertumpuk; berbatasan (selesai = mulai lain) tidak dihitung bentrok. */
export function jamBertumpuk(a: { mulai: Menit; selesai: Menit }, b: { mulai: Menit; selesai: Menit }): boolean {
  return a.mulai < b.selesai && b.mulai < a.selesai
}
