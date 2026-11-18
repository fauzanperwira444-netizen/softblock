import { bentrokJadwalLain, jadwalBerakhir, jatuhDalamPengecualian, pernahBerlaku, validasiJadwal, type IsianJadwal } from './jadwal'
import { formatDurasi, slotKosong } from './jamKosong'
import type { DataJadwal } from './todo'

describe('jam kosong (F-07, D-09)', () => {
  test('06.00–24.00 dikurangi gabungan rentang; slot < 30 menit dibuang', () => {
    const hasil = slotKosong([
      { mulai: 480, selesai: 600 },
      { mulai: 590, selesai: 620 },
      { mulai: 640, selesai: 700 },
    ])
    // 06.00–08.00 (120), 10.20–10.40 (20, dibuang), 11.40–24.00 (740)
    expect(hasil.slot).toEqual([
      { mulai: 360, selesai: 480 },
      { mulai: 700, selesai: 1440 },
    ])
    expect(hasil.total).toBe(860)
    expect(hasil.terpanjang).toEqual({ mulai: 700, selesai: 1440 })
  })

  test('potong di "sekarang" lebih dulu, lalu buang slot pendek', () => {
    const hasil = slotKosong([{ mulai: 1000, selesai: 1430 }], 980)
    // 16.20–16.40 (20) dan 23.50–24.00 (10) sama-sama di bawah 30 menit.
    expect(hasil.slot).toEqual([])
    expect(hasil.total).toBe(0)
  })

  test('format durasi', () => {
    expect(formatDurasi(460)).toBe('7 j 40 m')
    expect(formatDurasi(180)).toBe('3 j')
    expect(formatDurasi(45)).toBe('45 m')
  })
})

const data: DataJadwal = {
  jadwal: [
    { id: 'j-kuliah', versi: 1, nama: 'Kuliah' },
    { id: 'j-baru', versi: 1, nama: 'Baru' },
    { id: 'j-lama', versi: 1, nama: 'Lama' },
  ],
  versi: [
    { id: 'v1', versi: 1, jadwal_id: 'j-kuliah', hari: [3], mulai_menit: 480, selesai_menit: 600, berlaku_mulai: '2026-11-01', berlaku_akhir: null, sekali_jalan: false },
    { id: 'v2', versi: 1, jadwal_id: 'j-baru', hari: [2], mulai_menit: 480, selesai_menit: 600, berlaku_mulai: '2026-11-18', berlaku_akhir: null, sekali_jalan: false },
    { id: 'v3', versi: 1, jadwal_id: 'j-lama', hari: [1], mulai_menit: 480, selesai_menit: 600, berlaku_mulai: '2026-10-01', berlaku_akhir: '2026-11-10', sekali_jalan: false },
  ],
  pengecualian: [{ id: 'x', versi: 1, jadwal_id: null, mulai: '2026-12-24', akhir: '2026-12-26', keterangan: '' }],
}

const isian = (i: Partial<IsianJadwal>): IsianJadwal => ({
  nama: 'Rapat',
  mulai: 540,
  selesai: 660,
  sekaliJalan: false,
  hari: [3],
  tanggal: '2026-11-18',
  berakhir: null,
  ...i,
})

describe('aturan Jadwal (F-01..F-05)', () => {
  test('validasi: nama, jam, minimal satu hari, tanggal tidak lampau', () => {
    expect(validasiJadwal(isian({}), '2026-11-18')).toEqual({})
    expect(validasiJadwal(isian({ nama: '' }), '2026-11-18').nama).toBeDefined()
    expect(validasiJadwal(isian({ mulai: 300 }), '2026-11-18').jam).toMatch(/06\.00/)
    expect(validasiJadwal(isian({ hari: [] }), '2026-11-18').hari).toBeDefined()
    expect(validasiJadwal(isian({ tanggal: '2026-11-17' }), '2026-11-18').tanggal).toBeDefined()
    expect(validasiJadwal(isian({ berakhir: '2026-11-10' }), '2026-11-18').berakhir).toBeDefined()
  })

  test('pernah berlaku hanya bila ada kejadian sebelum hari ini', () => {
    expect(pernahBerlaku(data.versi, 'j-kuliah', '2026-11-18')).toBe(true)
    // Berlaku mulai hari ini: belum pernah berlaku, jadi masih boleh dihapus.
    expect(pernahBerlaku(data.versi, 'j-baru', '2026-11-18')).toBe(false)
  })

  test('Jadwal berakhir bila tanggal berakhir versi terakhir sudah lewat', () => {
    expect(jadwalBerakhir(data.versi, 'j-lama', '2026-11-18')).toBe(true)
    expect(jadwalBerakhir(data.versi, 'j-kuliah', '2026-11-18')).toBe(false)
  })

  test('bentrok dengan Jadwal lain diperingatkan; pengecualian dideteksi', () => {
    expect(bentrokJadwalLain(data, isian({}), null).map((b) => b.nama)).toEqual(['Kuliah'])
    expect(bentrokJadwalLain(data, isian({ mulai: 600, selesai: 660 }), null)).toEqual([])
    expect(jatuhDalamPengecualian(data.pengecualian, isian({ sekaliJalan: true, tanggal: '2026-12-25' }), null)?.id).toBe('x')
  })
})
