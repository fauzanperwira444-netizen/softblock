import { HttpResponse } from 'msw'
import { waktuLokal } from '../../domain/tanggal'
import { NAMA_TABEL, type IsiTabel, type NamaTabel, type ResponsMutasi, type ResponsSinkron, type Tabel } from '../../domain/tipe'
import { buatSeed } from './seedData'

/*
  Basis data tiruan per akun untuk mode mock: nomor revisi akun, versi per baris, dan tombstone
  penghapusan, meniru kontrak 7.3 agar sinkron delta dan If-Match bisa diuji di peramban.
*/
type DbAkun = {
  revisi: number
  isi: IsiTabel
  penghapusan: Array<{ tabel: NamaTabel; id: string; revisi: number }>
}

const KUNCI = 'softblock-mock-data'

function bacaSemua(): Record<string, DbAkun> {
  try {
    return JSON.parse(localStorage.getItem(KUNCI) ?? '{}') as Record<string, DbAkun>
  } catch {
    return {}
  }
}

function simpanSemua(semua: Record<string, DbAkun>) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(semua))
  } catch {
    // Penyimpanan diblokir; perubahan mock hanya bertahan sampai permintaan ini selesai.
  }
}

export function resetDb() {
  try {
    localStorage.removeItem(KUNCI)
  } catch {
    // Tidak ada yang perlu dihapus.
  }
}

function isiKosong(): IsiTabel {
  return Object.fromEntries(NAMA_TABEL.map((t) => [t, {}])) as unknown as IsiTabel
}

export function dbAkun(akunId: string, zona: string, berdata: boolean): DbAkun {
  const semua = bacaSemua()
  const ada = semua[akunId]
  if (ada) return ada
  const isi = isiKosong() as unknown as Record<NamaTabel, Record<string, { id: string }>>
  if (berdata) {
    const seed = buatSeed(waktuLokal(new Date(), zona).tanggal)
    for (const t of NAMA_TABEL) isi[t] = Object.fromEntries(seed[t].map((b) => [b.id, b]))
  }
  const db: DbAkun = { revisi: 1, isi: isi as unknown as IsiTabel, penghapusan: [] }
  semua[akunId] = db
  simpanSemua(semua)
  return db
}

export function responsSinkron(db: DbAkun, sejak: number, meta: ResponsSinkron['meta']): ResponsSinkron {
  const penuh = sejak <= 0 || sejak > db.revisi
  const ubah: ResponsSinkron['ubah'] = {}
  for (const t of NAMA_TABEL) {
    const baris = Object.values(db.isi[t]).filter((b) => penuh || b.versi > sejak)
    if (baris.length > 0) (ubah as Record<string, unknown[]>)[t] = baris
  }
  const hapus = penuh ? [] : db.penghapusan.filter((p) => p.revisi > sejak).map(({ tabel, id }) => ({ tabel, id }))
  return { revisi: db.revisi, penuh, ubah, hapus, meta }
}

export type Transaksi = {
  revisi: number
  ambil<K extends NamaTabel>(tabel: K, id: string): Tabel[K] | undefined
  semua<K extends NamaTabel>(tabel: K): Tabel[K][]
  tulis<K extends NamaTabel>(tabel: K, baris: Omit<Tabel[K], 'versi'> & { versi?: number }): void
  hapus(tabel: NamaTabel, id: string): void
}

export class GalatMock extends Error {
  readonly respons: Response
  constructor(respons: Response) {
    super('galat mock')
    this.respons = respons
  }
}

export function galatMock(status: number, kode: string, pesan: string, extra: Record<string, unknown> = {}): never {
  throw new GalatMock(HttpResponse.json({ kode, pesan, ...extra }, { status }))
}

/** Satu aksi = satu transaksi: periksa If-Match, naikkan revisi, catat baris berubah dan tombstone (AD-3). */
export function transaksi(
  akunId: string,
  zona: string,
  berdata: boolean,
  ifMatch: string | null,
  kerja: (tx: Transaksi) => { id?: string } | void,
): Response {
  const semua = bacaSemua()
  const db = semua[akunId] ?? dbAkun(akunId, zona, berdata)
  if (ifMatch === null || Number(ifMatch) !== db.revisi) {
    return HttpResponse.json({ kode: 'versi_konflik', pesan: 'Data berubah di perangkat lain. Muat ulang?' }, { status: 409 })
  }
  const salinan: DbAkun = structuredClone(db)
  const revisiBaru = db.revisi + 1
  const ubah: Partial<Record<NamaTabel, Map<string, { id: string }>>> = {}
  const hapus: Array<{ tabel: NamaTabel; id: string }> = []
  const isi = salinan.isi as unknown as Record<NamaTabel, Record<string, { id: string; versi: number }>>

  const tx: Transaksi = {
    revisi: revisiBaru,
    ambil: (tabel, id) => isi[tabel][id] as never,
    semua: (tabel) => Object.values(isi[tabel]) as never,
    tulis: (tabel, baris) => {
      const b = { ...baris, versi: revisiBaru } as { id: string; versi: number }
      const tempat: Record<string, { id: string; versi: number }> = isi[tabel]
      tempat[b.id] = b
      ;(ubah[tabel] ??= new Map()).set(b.id, b)
    },
    hapus: (tabel, id) => {
      if (!isi[tabel][id]) return
      delete isi[tabel][id]
      ubah[tabel]?.delete(id)
      hapus.push({ tabel, id })
      salinan.penghapusan.push({ tabel, id, revisi: revisiBaru })
    },
  }

  let hasil: { id?: string } | void
  try {
    hasil = kerja(tx)
  } catch (e) {
    if (e instanceof GalatMock) return e.respons
    throw e
  }

  salinan.revisi = revisiBaru
  semua[akunId] = salinan
  simpanSemua(semua)

  const respons: ResponsMutasi = {
    revisi: revisiBaru,
    revisi_sebelum: db.revisi,
    ubah: Object.fromEntries(Object.entries(ubah).map(([t, m]) => [t, [...m.values()]])) as ResponsMutasi['ubah'],
    hapus,
    peringatan: [],
    ...(hasil?.id ? { id: hasil.id } : {}),
  }
  return HttpResponse.json(respons)
}
