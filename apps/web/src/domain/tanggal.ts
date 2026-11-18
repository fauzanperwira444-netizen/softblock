import type { Menit, Tanggal } from './tipe'

// Pembantu tanggal murni: semua aritmetika di UTC agar bebas dari zona waktu perangkat.

function keUtc(t: Tanggal): number {
  const [y, m, d] = t.split('-').map(Number)
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

function dariUtc(ms: number): Tanggal {
  return new Date(ms).toISOString().slice(0, 10)
}

const HARI_MS = 86_400_000

export function tambahHari(t: Tanggal, n: number): Tanggal {
  return dariUtc(keUtc(t) + n * HARI_MS)
}

/** Jumlah hari dari `a` ke `b` (positif bila b setelah a). */
export function selisihHari(a: Tanggal, b: Tanggal): number {
  return Math.round((keUtc(b) - keUtc(a)) / HARI_MS)
}

/** Hari ISO: 1 Senin sampai 7 Minggu. */
export function hariIso(t: Tanggal): number {
  const d = new Date(keUtc(t)).getUTCDay()
  return d === 0 ? 7 : d
}

/** Senin pada minggu yang memuat `t` (minggu dimulai Senin). */
export function awalMinggu(t: Tanggal): Tanggal {
  return tambahHari(t, 1 - hariIso(t))
}

export function hariLewat(t: Tanggal, hariIni: Tanggal): boolean {
  return t < hariIni
}

export function dalamRentang(t: Tanggal, mulai: Tanggal, akhir: Tanggal): boolean {
  return t >= mulai && t <= akhir
}

/** Rentang inklusif bertumpang tindih bila tidak ada yang berakhir sebelum yang lain mulai. */
export function rentangBertumpuk(a: { mulai: Tanggal; akhir: Tanggal }, b: { mulai: Tanggal; akhir: Tanggal }): boolean {
  return a.mulai <= b.akhir && b.mulai <= a.akhir
}

/** Tanggal dan menit lokal untuk sebuah instan di zona waktu tertentu. */
export function waktuLokal(instan: Date, zona: string): { tanggal: Tanggal; menit: Menit } {
  const bagian = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instan)
  const ambil = (tipe: string) => bagian.find((p) => p.type === tipe)?.value ?? '00'
  return {
    tanggal: `${ambil('year')}-${ambil('month')}-${ambil('day')}`,
    menit: Number(ambil('hour')) * 60 + Number(ambil('minute')),
  }
}

/** "Hari ini" tidak pernah mundur (N-44): ambil yang lebih besar dari jam perangkat dan nilai terakhir dari server. */
export function hariIniTerjaga(hariIniPerangkat: Tanggal, hariIniTerakhir: Tanggal | null): Tanggal {
  return hariIniTerakhir && hariIniTerakhir > hariIniPerangkat ? hariIniTerakhir : hariIniPerangkat
}
