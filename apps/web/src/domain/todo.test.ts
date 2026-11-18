import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { jadwalPadaTanggal } from './jadwal'
import { belumSelesai, jadwalPenyebabBentrok, statusEntri, validasiBlok, type DataJadwal } from './todo'
import type { EntriTodo, RiwayatProgress, Task } from './tipe'

const formatJamUji = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`

function fixture<T>(nama: string): T {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`../../../../fixtures/${nama}`, import.meta.url)), 'utf8')) as T
}

describe('jadwal-efektif.json', () => {
  const f = fixture<{ data: DataJadwal; kasus: Array<{ nama: string; tanggal: string; expected: Array<{ jadwal_id: string; mulai: number; selesai: number }> }> }>(
    'jadwal-efektif.json',
  )
  test.each(f.kasus)('$nama', ({ tanggal, expected }) => {
    const hasil = jadwalPadaTanggal(f.data, tanggal).map((k) => ({ jadwal_id: k.jadwal.id, mulai: k.mulai, selesai: k.selesai }))
    expect(hasil).toEqual(expected)
  })
})

describe('bentrok-blok.json', () => {
  const f = fixture<{
    jadwal: DataJadwal
    kasus: Array<{ nama: string; blok: { tanggal: string; mulai_menit: number; selesai_menit: number }; expected: string | null }>
  }>('bentrok-blok.json')
  test.each(f.kasus)('$nama', ({ blok, expected }) => {
    expect(jadwalPenyebabBentrok(blok, f.jadwal)?.jadwal.id ?? null).toBe(expected)
  })
})

const task = (t: Partial<Task>): Task =>
  ({ id: 't', progress: 2, batal: false, dibatalkan_tanggal_lokal: null, deadline_tanggal: null, deadline_menit: null, ...t }) as Task
const entri = (e: Partial<EntriTodo>): EntriTodo => ({ id: 'e', versi: 1, task_id: 't', tanggal: '2026-11-17', ceklis: false, ...e })
const riwayat = (r: Partial<RiwayatProgress>): RiwayatProgress =>
  ({ id: 'r', versi: 1, task_id: 't', sebelum: 1, sesudah: 2, deskripsi: '', penanda: null, tanggal_lokal: '2026-11-17', menit_lokal: 600, ...r }) as RiwayatProgress

describe('statusEntri (E-07)', () => {
  test('prioritas dibatalkan > selesai > dikerjakan > tidak dikerjakan', () => {
    expect(statusEntri(entri({}), task({ batal: true, dibatalkan_tanggal_lokal: '2026-11-17' }), [riwayat({})])).toBe('dibatalkan')
    expect(statusEntri(entri({}), task({ progress: 10 }), [riwayat({ sesudah: 10, penanda: 'selesai' })])).toBe('selesai')
    expect(statusEntri(entri({ ceklis: true }), task({}), [])).toBe('dikerjakan')
    expect(statusEntri(entri({}), task({}), [riwayat({})])).toBe('dikerjakan')
    expect(statusEntri(entri({}), task({}), [riwayat({ tanggal_lokal: '2026-11-16' })])).toBe('tidak_dikerjakan')
  })

  test('selesai lalu dibuka kembali di hari yang sama dihitung dikerjakan', () => {
    const r = [riwayat({ id: 'a', sesudah: 10, penanda: 'selesai', menit_lokal: 600 }), riwayat({ id: 'b', sebelum: 10, sesudah: 9, penanda: 'buka_kembali', menit_lokal: 700 })]
    expect(statusEntri(entri({}), task({ progress: 9 }), r)).toBe('dikerjakan')
  })
})

test('Belum selesai (E-09): 7 hari terakhir, satu per task, tanpa task yang sudah ada di hari ini', () => {
  const data = {
    task: [task({ id: 'a' }), task({ id: 'b' }), task({ id: 'c' }), task({ id: 'd', progress: 10 })],
    entri: [
      entri({ id: 'a1', task_id: 'a', tanggal: '2026-11-15' }),
      entri({ id: 'a2', task_id: 'a', tanggal: '2026-11-17' }),
      entri({ id: 'b1', task_id: 'b', tanggal: '2026-11-17' }),
      entri({ id: 'b2', task_id: 'b', tanggal: '2026-11-18' }),
      entri({ id: 'c1', task_id: 'c', tanggal: '2026-11-10' }),
      entri({ id: 'd1', task_id: 'd', tanggal: '2026-11-17' }),
    ],
    riwayat: [],
  }
  expect(belumSelesai(data, '2026-11-18').map((x) => x.entri.id)).toEqual(['a2'])
})

describe('validasiBlok (E-04)', () => {
  const jadwal: DataJadwal = {
    jadwal: [{ id: 'j', versi: 1, nama: 'Kuliah' }],
    versi: [{ id: 'v', versi: 1, jadwal_id: 'j', hari: [3], mulai_menit: 480, selesai_menit: 600, berlaku_mulai: '2026-11-01', berlaku_akhir: null, sekali_jalan: false }],
    pengecualian: [],
  }
  const konteks = {
    tanggal: '2026-11-18',
    hariIni: '2026-11-18',
    task: { deadline_tanggal: '2026-11-18', deadline_menit: 17 * 60 },
    blokLain: [{ id: 'b', versi: 1, entri_id: 'x', tanggal: '2026-11-18', mulai_menit: 780, selesai_menit: 840 }],
    jadwal,
    kecualiBlokId: null,
    formatJam: formatJamUji,
  }
  test('menolak di luar 06.00–24.00, bukan kelipatan 5, terbalik, bentrok blok, bentrok Jadwal', () => {
    expect(validasiBlok({ mulai: 300, selesai: 400 }, konteks).galat).toMatch(/06\.00/)
    expect(validasiBlok({ mulai: 661, selesai: 700 }, konteks).galat).toMatch(/kelipatan 5/)
    expect(validasiBlok({ mulai: 700, selesai: 660 }, konteks).galat).toMatch(/lebih awal/)
    expect(validasiBlok({ mulai: 810, selesai: 900 }, konteks).galat).toMatch(/blok lain/)
    expect(validasiBlok({ mulai: 570, selesai: 630 }, konteks).galat).toMatch(/Kuliah/)
    expect(validasiBlok({ mulai: 600, selesai: 660 }, konteks)).toEqual({ galat: null, peringatan: null })
  })
  test('blok setelah deadline hanya peringatan; hari lewat membeku', () => {
    expect(validasiBlok({ mulai: 1020, selesai: 1080 }, konteks)).toEqual({ galat: null, peringatan: expect.stringMatching(/setelah deadline/) })
    expect(validasiBlok({ mulai: 600, selesai: 660 }, { ...konteks, tanggal: '2026-11-17' }).galat).toMatch(/lewat/)
  })
})
