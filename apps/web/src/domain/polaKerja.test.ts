import { granularitas, hitungPolaKerja, rentangPilihan } from './polaKerja'
import type { EntriTodo, RiwayatProgress, Task } from './tipe'

const task = (t: Partial<Task>): Task =>
  ({ id: 't', progress: 2, batal: false, dibatalkan_tanggal_lokal: null, deadline_tanggal: null, deadline_menit: null, dibuat_tanggal_lokal: '2026-11-01', ...t }) as Task
const riwayat = (r: Partial<RiwayatProgress>): RiwayatProgress =>
  ({ id: 'r', versi: 1, task_id: 't', sebelum: 9, sesudah: 10, deskripsi: '', penanda: 'selesai', tanggal_lokal: '2026-11-10', menit_lokal: 600, ...r }) as RiwayatProgress
const entri = (e: Partial<EntriTodo>): EntriTodo => ({ id: 'e', versi: 1, task_id: 't', tanggal: '2026-11-10', ceklis: false, ...e })

describe('rentang dan granularitas (D-11)', () => {
  test('4 minggu terakhir dimulai Senin tiga minggu sebelum minggu ini', () => {
    expect(rentangPilihan('empat_minggu', '2026-11-19', '2026-01-01')).toEqual({ dari: '2026-10-26', sampai: '2026-11-19' })
    expect(rentangPilihan('minggu_ini', '2026-11-19', '2026-01-01')).toEqual({ dari: '2026-11-16', sampai: '2026-11-19' })
    expect(rentangPilihan('semua', '2026-11-19', '2026-03-02').dari).toBe('2026-03-02')
  })

  test('harian sampai 14 hari, mingguan sampai ~4 bulan, lalu bulanan', () => {
    expect(granularitas('2026-11-16', '2026-11-19')).toBe('hari')
    expect(granularitas('2026-10-26', '2026-11-19')).toBe('minggu')
    expect(granularitas('2026-01-01', '2026-11-19')).toBe('bulan')
  })
})

describe('hitungPolaKerja (D-12)', () => {
  test('selesai dari kondisi sekarang: task yang dibuka kembali tidak dihitung', () => {
    const data = {
      task: [task({ id: 'a', progress: 10 }), task({ id: 'b', progress: 6 })],
      riwayat: [riwayat({ id: 'r1', task_id: 'a' }), riwayat({ id: 'r2', task_id: 'b' })],
      entri: [],
    }
    const h = hitungPolaKerja(data, '2026-11-09', '2026-11-15', '2026-11-19')
    expect(h.selesai).toBe(1)
    expect(h.seri.find((s) => s.mulai === '2026-11-10')?.selesai).toBe(1)
  })

  test('rasio hanya hari lewat dan tanpa entri dibatalkan', () => {
    const data = {
      task: [task({ id: 'a' }), task({ id: 'c', batal: true, dibatalkan_tanggal_lokal: '2026-11-12' })],
      riwayat: [riwayat({ id: 'r1', task_id: 'a', penanda: null, sesudah: 3, tanggal_lokal: '2026-11-10' })],
      entri: [
        entri({ id: 'e1', task_id: 'a', tanggal: '2026-11-10' }),
        entri({ id: 'e2', task_id: 'a', tanggal: '2026-11-11' }),
        entri({ id: 'e3', task_id: 'c', tanggal: '2026-11-12' }),
        entri({ id: 'e4', task_id: 'a', tanggal: '2026-11-19' }),
      ],
    }
    const h = hitungPolaKerja(data, '2026-11-01', '2026-11-19', '2026-11-19')
    expect([h.dikerjakan, h.tidak_dikerjakan]).toEqual([1, 1])
    expect(h.batal).toBe(1)
    expect(h.dibuat).toBe(2)
  })
})
