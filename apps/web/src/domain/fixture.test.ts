import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { statusProjek, statusSesi, taskDiLuarPeriode, taskTelat } from './status'
import { awalMinggu, hariIniTerjaga, hariIso, hariLewat, selisihHari, tambahHari } from './tanggal'

// Golden fixture dibaca bersama Pest (AD-8); implementasi TS harus memberi hasil identik.
function fixture<T>(nama: string): T {
  const path = fileURLToPath(new URL(`../../../../fixtures/${nama}`, import.meta.url))
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

type Kasus<I, E> = { nama: string; today?: string; nowMinutes?: number; input: I; expected: E }
type Berkas<I, E> = { kasus: Array<Kasus<I, E>> }

describe('status-sesi.json', () => {
  const { kasus } = fixture<Berkas<{ mulai: string; akhir: string; batal: boolean }, string>>('status-sesi.json')
  test.each(kasus)('$nama', ({ input, today, expected }) => {
    expect(statusSesi(input, today ?? '')).toBe(expected)
  })
})

describe('status-projek.json', () => {
  type Input = {
    projek: { batal: boolean }
    sesi: Array<{ mulai: string; akhir: string; batal: boolean }>
    tasks: Array<{ progress: number; batal: boolean }>
  }
  const { kasus } = fixture<Berkas<Input, string>>('status-projek.json')
  test.each(kasus)('$nama', ({ input, today, expected }) => {
    expect(statusProjek(input.projek, input.sesi, input.tasks, today ?? '')).toBe(expected)
  })
})

describe('telat.json', () => {
  type Input = { progress: number; batal: boolean; deadline_tanggal: string | null; deadline_menit: number | null }
  const { kasus } = fixture<Berkas<Input, boolean>>('telat.json')
  test.each(kasus)('$nama', ({ input, today, nowMinutes, expected }) => {
    expect(taskTelat(input, today ?? '', nowMinutes ?? 0)).toBe(expected)
  })
})

describe('di-luar-periode.json', () => {
  type Input = { task: { deadline_tanggal: string | null }; sesi: { mulai: string; akhir: string } | null }
  const { kasus } = fixture<Berkas<Input, boolean>>('di-luar-periode.json')
  test.each(kasus)('$nama', ({ input, expected }) => {
    expect(taskDiLuarPeriode(input.task, input.sesi ?? undefined)).toBe(expected)
  })
})

describe('tanggal.json', () => {
  type Kasus2<I, E> = { input: I; expected: E; today?: string }
  const f = fixture<{
    tambah_hari: Array<Kasus2<[string, number], string>>
    selisih_hari: Array<Kasus2<[string, string], number>>
    hari_iso: Array<Kasus2<string, number>>
    awal_minggu: Array<Kasus2<string, string>>
    hari_lewat: Array<Kasus2<string, boolean>>
    hari_ini_terjaga: Array<Kasus2<[string, string | null], string>>
  }>('tanggal.json')

  test.each(f.tambah_hari)('tambahHari($input)', ({ input, expected }) => expect(tambahHari(...input)).toBe(expected))
  test.each(f.selisih_hari)('selisihHari($input)', ({ input, expected }) => expect(selisihHari(...input)).toBe(expected))
  test.each(f.hari_iso)('hariIso($input)', ({ input, expected }) => expect(hariIso(input)).toBe(expected))
  test.each(f.awal_minggu)('awalMinggu($input)', ({ input, expected }) => expect(awalMinggu(input)).toBe(expected))
  test.each(f.hari_lewat)('hariLewat($input)', ({ input, today, expected }) => expect(hariLewat(input, today ?? '')).toBe(expected))
  test.each(f.hari_ini_terjaga)('hariIniTerjaga($input)', ({ input, expected }) => expect(hariIniTerjaga(...input)).toBe(expected))
})
