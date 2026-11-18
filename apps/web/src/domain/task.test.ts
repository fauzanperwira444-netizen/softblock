import { buatSeed } from '../api/mock/seedData'
import {
  FILTER_AWAL,
  namaBentrokBukaKembali,
  progressSebelumSelesai,
  projekMenjadiSelesai,
  saranLabel,
  saringTask,
  validasiNamaLabel,
  validasiTask,
  type DataTask,
} from './task'

const HARI_INI = '2026-11-18'
const seed = buatSeed(HARI_INI)
const data: DataTask = {
  projek: seed.projek,
  sesi: seed.sesi,
  task: seed.task,
  label: seed.label_mandiri,
  riwayat: seed.riwayat_progress,
}
const fmt = (t: string) => t
const konteks = { data, hariIni: HARI_INI, menit: 10 * 60, kecualiId: null, periksaDeadline: true, formatTanggal: fmt }
const isi = { nama: 'Task baru', deskripsi: '', deadline_tanggal: '2026-11-20', deadline_menit: null, kesulitan: 3 }

describe('validasiTask', () => {
  test('task sesi: deadline wajib, dalam periode, tidak lampau', () => {
    const tujuan = { jenis: 'sesi', sesiId: 's-kos-1' } as const
    expect(validasiTask(isi, tujuan, konteks)).toEqual({})
    expect(validasiTask({ ...isi, deadline_tanggal: '' }, tujuan, konteks).deadline_tanggal).toMatch(/wajib/)
    expect(validasiTask({ ...isi, deadline_tanggal: '2026-12-31' }, tujuan, konteks).deadline_tanggal).toMatch(/periode sesi/)
    expect(validasiTask({ ...isi, deadline_tanggal: '2026-11-17' }, tujuan, konteks).deadline_tanggal).toMatch(/hari ini/)
  })

  test('jam: kelipatan 5 dan tidak boleh lewat hari ini', () => {
    const tujuan = { jenis: 'sesi', sesiId: 's-kos-1' } as const
    expect(validasiTask({ ...isi, deadline_menit: 601 }, tujuan, konteks).deadline_menit).toMatch(/kelipatan 5/)
    expect(validasiTask({ ...isi, deadline_tanggal: HARI_INI, deadline_menit: 9 * 60 }, tujuan, konteks).deadline_menit).toMatch(/lewat/)
  })

  test('nama unik di antara task aktif berlabel sama saja', () => {
    const sesi = { jenis: 'sesi', sesiId: 's-kos-1' } as const
    expect(validasiTask({ ...isi, nama: 'survei 3 KOS' }, sesi, konteks).nama).toMatch(/sudah dipakai/)
    // Sama dengan task di projek lain: boleh.
    expect(validasiTask({ ...isi, nama: 'Kirim revisi bab 2' }, sesi, konteks).nama).toBeUndefined()
  })

  test('mandiri: label wajib, label baru divalidasi; deadline opsional', () => {
    expect(validasiTask({ ...isi, deadline_tanggal: '' }, { jenis: 'mandiri', labelId: null, labelBaru: '' }, konteks).label).toMatch(/wajib/)
    expect(validasiTask({ ...isi, deadline_tanggal: '' }, { jenis: 'mandiri', labelId: 'l-rumah', labelBaru: '' }, konteks)).toEqual({})
    expect(validasiNamaLabel('Skripsi Bab 3', data, null)).toMatch(/projek/)
    expect(validasiNamaLabel('rumah', data, null)).toMatch(/sudah ada/)
  })
})

describe('saringTask', () => {
  test('default Aktif; pencarian melepas default dan mencocokkan nama projek atau label', () => {
    const aktif = saringTask(data, FILTER_AWAL, HARI_INI, 600)
    expect(aktif.every((t) => !t.batal && t.progress < 10)).toBe(true)

    const cari = saringTask(data, { ...FILTER_AWAL, cari: 'rumah' }, HARI_INI, 600).map((t) => t.nama)
    expect(cari).toEqual(['Beli tinta printer', 'Servis kipas'])

    const eksplisit = saringTask(data, { ...FILTER_AWAL, cari: 'rumah', statusEksplisit: true }, HARI_INI, 600).map((t) => t.nama)
    expect(eksplisit).toEqual(['Beli tinta printer'])
  })

  test('status Telat dan filter Mandiri', () => {
    expect(saringTask(data, { ...FILTER_AWAL, status: 'telat' }, HARI_INI, 600).map((t) => t.id)).toEqual(['t-1', 't-2'])
    expect(saringTask(data, { ...FILTER_AWAL, projek: 'mandiri' }, HARI_INI, 600).map((t) => t.id)).toEqual(['t-12', 't-13'])
  })

  test('selesai diurut dari waktu selesai terbaru', () => {
    expect(saringTask(data, { ...FILTER_AWAL, status: 'selesai' }, HARI_INI, 600).map((t) => t.id)).toEqual(['t-5', 't-9', 't-11', 't-6'])
  })
})

test('menyelesaikan task aktif terakhir di sesi yang sudah lewat membuat projek selesai (2.4)', () => {
  const d: DataTask = {
    ...data,
    sesi: [{ id: 's', versi: 1, projek_id: 'p', nama: 'S', deskripsi: '', mulai: '2026-11-01', akhir: '2026-11-10', batal: false }],
    projek: [{ id: 'p', versi: 1, nama: 'P', deskripsi: '', warna: '#2e8b7a', batal: false }],
    task: [{ ...seed.task[0], id: 'x', sesi_id: 's', progress: 9 } as DataTask['task'][number]],
  }
  expect(projekMenjadiSelesai(d, 'x', { progress: 10 }, HARI_INI)?.id).toBe('p')
  expect(projekMenjadiSelesai(d, 'x', { progress: 8 }, HARI_INI)).toBeNull()
})

test('buka kembali: progress kembali ke nilai sebelum 10 dan nama bentrok terdeteksi', () => {
  expect(progressSebelumSelesai(data.riwayat, 't-5')).toBe(6)
  const t5 = data.task.find((t) => t.id === 't-5')
  expect(t5 && namaBentrokBukaKembali(data, t5, 'Susun kerangka bab 3')).toBe(true)
  expect(saranLabel(data).map((l) => l.nama)).toEqual(['Rumah', 'Kesehatan'])
})
