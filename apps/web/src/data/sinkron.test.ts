import { ApiError } from '../api/errors'
import type { ResponsSinkron } from '../domain/tipe'
import { penyimpananMemori } from './penyimpanan'
import { BATAS_LAMBAT_MS, BATAS_MENYERAH_MS, MesinSinkron } from './sinkron'
import { isiKosong, terapkan, type Snapshot } from './snapshot'

const META = { hari_ini: '2026-11-18', zona_waktu: 'Asia/Jakarta', akun_dibuat: '2026-11-01' }
const projek = (id: string, nama: string) => ({ id, versi: 1, nama, deskripsi: '', warna: '#406653', batal: false })

function respons(sebagian: Partial<ResponsSinkron>): ResponsSinkron {
  return { revisi: 1, penuh: true, ubah: {}, hapus: [], meta: META, ...sebagian }
}

function snapshotLama(): Snapshot {
  return terapkan(null, respons({ revisi: 3, ubah: { projek: [projek('p1', 'Lama')] } }), new Date('2026-11-18T07:52:00Z'))
}

function buat(api: { kesehatan?: () => Promise<unknown>; sinkron?: (s: number) => Promise<ResponsSinkron> }, online = true) {
  const penyimpanan = penyimpananMemori()
  const onSesiHabis = vi.fn()
  const mesin = new MesinSinkron({
    akunId: 'a1',
    penyimpanan,
    onSesiHabis,
    online: () => online,
    api: {
      kesehatan: api.kesehatan ?? (async () => ({})),
      sinkron: api.sinkron ?? (async () => respons({})),
    },
  })
  return { mesin, penyimpanan, onSesiHabis }
}

describe('terapkan', () => {
  test('delta mengganti, menambah, dan menghapus baris tanpa menyentuh tabel lain', () => {
    const lama = terapkan(null, respons({ ubah: { projek: [projek('p1', 'A'), projek('p2', 'B')] } }), new Date())
    const baru = terapkan(
      lama,
      respons({ revisi: 2, penuh: false, ubah: { projek: [projek('p1', 'A2'), projek('p3', 'C')] }, hapus: [{ tabel: 'projek', id: 'p2' }] }),
      new Date(),
    )
    expect(Object.keys(baru.isi.projek).sort()).toEqual(['p1', 'p3'])
    expect(baru.isi.projek.p1?.nama).toBe('A2')
    expect(baru.revisi).toBe(2)
    expect(lama.isi.projek.p2).toBeDefined()
  })

  test('respons penuh membuang isi lama', () => {
    const lama = terapkan(null, respons({ ubah: { projek: [projek('p1', 'A')] } }), new Date())
    const baru = terapkan(lama, respons({ revisi: 9, ubah: { projek: [projek('p9', 'Z')] } }), new Date())
    expect(Object.keys(baru.isi.projek)).toEqual(['p9'])
  })
})

describe('MesinSinkron', () => {
  afterEach(() => vi.useRealTimers())

  test('snapshot lokal tampil dulu, lalu sinkron dengan sejak = revisi lokal dan disimpan', async () => {
    const sinkron = vi.fn(async () => respons({ revisi: 4, penuh: false, ubah: { projek: [projek('p2', 'Baru')] } }))
    const { mesin, penyimpanan } = buat({ sinkron })
    await penyimpanan.simpan('a1', snapshotLama())

    await mesin.mulai()

    expect(sinkron).toHaveBeenCalledWith(3)
    const s = mesin.getState()
    expect(s.koneksi).toBe('online')
    expect(Object.keys(s.snapshot?.isi.projek ?? {}).sort()).toEqual(['p1', 'p2'])
    expect((await penyimpanan.baca('a1'))?.revisi).toBe(4)
  })

  test('offline tanpa snapshot: tidak menghubungi server', async () => {
    const kesehatan = vi.fn(async () => ({}))
    const { mesin } = buat({ kesehatan }, false)
    await mesin.mulai()
    expect(mesin.getState()).toMatchObject({ koneksi: 'offline', snapshot: null, lokalDibaca: true })
    expect(kesehatan).not.toHaveBeenCalled()
  })

  test('setelah 8 detik menjadi lambat, setelah 90 detik menyerah ke galat', async () => {
    vi.useFakeTimers()
    const { mesin } = buat({ kesehatan: () => new Promise(() => {}) })
    const jalan = mesin.mulai()
    await vi.advanceTimersByTimeAsync(BATAS_LAMBAT_MS + 1)
    expect(mesin.getState().koneksi).toBe('lambat')
    await vi.advanceTimersByTimeAsync(BATAS_MENYERAH_MS)
    await jalan
    expect(mesin.getState().koneksi).toBe('galat')
  })

  test('401 sesi_habis diteruskan ke auth', async () => {
    const { mesin, onSesiHabis } = buat({
      sinkron: async () => {
        throw new ApiError('sesi_habis', 401)
      },
    })
    await mesin.mulai()
    expect(onSesiHabis).toHaveBeenCalledOnce()
  })

  test('409 klien_usang menampilkan versi baru', async () => {
    const { mesin } = buat({
      kesehatan: async () => {
        throw new ApiError('klien_usang', 409)
      },
    })
    await mesin.mulai()
    expect(mesin.getState().koneksi).toBe('usang')
  })

  test('kembali online: tersambung kembali lalu online, snapshot tetap tampil selama menunggu', async () => {
    let selesai: (r: ResponsSinkron) => void = () => {}
    let panggilan = 0
    const { mesin, penyimpanan } = buat({
      sinkron: () => {
        panggilan++
        return panggilan === 1 ? Promise.resolve(respons({ revisi: 3 })) : new Promise((r) => (selesai = r))
      },
    })
    await penyimpanan.simpan('a1', { ...snapshotLama(), isi: isiKosong() })
    await mesin.mulai()

    mesin.saatOffline()
    expect(mesin.getState().koneksi).toBe('offline')
    mesin.saatOnline()
    await Promise.resolve()
    expect(mesin.getState().koneksi).toBe('tersambung_kembali')
    expect(mesin.getState().snapshot).not.toBeNull()

    selesai(respons({ revisi: 5, penuh: false }))
    await vi.waitFor(() => expect(mesin.getState().koneksi).toBe('online'))
  })
})
