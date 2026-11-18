import { deleteDB, openDB, type IDBPDatabase } from 'idb'
import { NAMA_TABEL } from '../domain/tipe'
import { isiKosong, type Snapshot } from './snapshot'

export interface Penyimpanan {
  baca(akunId: string): Promise<Snapshot | null>
  simpan(akunId: string, snapshot: Snapshot): Promise<void>
  hapus(akunId: string): Promise<void>
}

const VERSI_DB = 1
const STORE_META = 'meta'
const STORE_DRAF = 'draf_formulir'

const namaDb = (akunId: string) => `perencana:${akunId}`

function buka(akunId: string): Promise<IDBPDatabase> {
  return openDB(namaDb(akunId), VERSI_DB, {
    upgrade(db) {
      for (const tabel of NAMA_TABEL) db.createObjectStore(tabel, { keyPath: 'id' })
      db.createObjectStore(STORE_META)
      db.createObjectStore(STORE_DRAF)
    },
  })
}

type Meta = Omit<Snapshot, 'isi'>

/** IndexedDB per akun, satu store per tabel ditambah metadata (Arsitektur Sistem 5.4). */
export const penyimpananIdb: Penyimpanan = {
  async baca(akunId) {
    const db = await buka(akunId)
    try {
      const meta = (await db.get(STORE_META, 'snapshot')) as Meta | undefined
      if (!meta) return null
      const isi = isiKosong() as unknown as Record<string, Record<string, { id: string }>>
      for (const tabel of NAMA_TABEL) {
        const baris = (await db.getAll(tabel)) as Array<{ id: string }>
        isi[tabel] = Object.fromEntries(baris.map((b) => [b.id, b]))
      }
      return { ...meta, isi: isi as unknown as Snapshot['isi'] }
    } finally {
      db.close()
    }
  },

  async simpan(akunId, snapshot) {
    const db = await buka(akunId)
    try {
      const tx = db.transaction([...NAMA_TABEL, STORE_META], 'readwrite')
      for (const tabel of NAMA_TABEL) {
        const store = tx.objectStore(tabel)
        await store.clear()
        for (const baris of Object.values(snapshot.isi[tabel])) await store.put(baris)
      }
      const { isi: _isi, ...meta } = snapshot
      await tx.objectStore(STORE_META).put(meta, 'snapshot')
      await tx.done
    } finally {
      db.close()
    }
  },

  async hapus(akunId) {
    await deleteDB(namaDb(akunId))
  },
}

/** Draf formulir sebelum pengalihan ke Google untuk login ulang (DA-10); hanya di perangkat. */
export async function simpanDraf(akunId: string, draf: Record<string, unknown>): Promise<void> {
  const db = await buka(akunId)
  try {
    const tx = db.transaction(STORE_DRAF, 'readwrite')
    for (const [kunci, nilai] of Object.entries(draf)) await tx.store.put(nilai, kunci)
    await tx.done
  } finally {
    db.close()
  }
}

/** Mengambil lalu menghapus semua draf: draf hanya dipulihkan sekali (N-60). */
export async function ambilDraf(akunId: string): Promise<Record<string, unknown>> {
  const db = await buka(akunId)
  try {
    const tx = db.transaction(STORE_DRAF, 'readwrite')
    const kunci = (await tx.store.getAllKeys()) as string[]
    const hasil: Record<string, unknown> = {}
    for (const k of kunci) hasil[k] = await tx.store.get(k)
    await tx.store.clear()
    await tx.done
    return hasil
  } finally {
    db.close()
  }
}

/** Pengganti IndexedDB untuk tes. */
export function penyimpananMemori(): Penyimpanan & { isi: Map<string, Snapshot> } {
  const isi = new Map<string, Snapshot>()
  return {
    isi,
    baca: async (id) => isi.get(id) ?? null,
    simpan: async (id, s) => {
      isi.set(id, s)
    },
    hapus: async (id) => {
      isi.delete(id)
    },
  }
}

const KUNCI_AKUN_TERAKHIR = 'softblock:akun-terakhir'

/** Saat akun lain masuk di perangkat yang sama, salinan akun sebelumnya dihapus (N-60). */
export async function gantiPemilikPerangkat(akunId: string, penyimpanan: Penyimpanan): Promise<void> {
  let sebelumnya: string | null = null
  try {
    sebelumnya = localStorage.getItem(KUNCI_AKUN_TERAKHIR)
    localStorage.setItem(KUNCI_AKUN_TERAKHIR, akunId)
  } catch {
    return
  }
  if (sebelumnya && sebelumnya !== akunId) await penyimpanan.hapus(sebelumnya).catch(() => undefined)
}

export async function lupakanPemilikPerangkat(akunId: string, penyimpanan: Penyimpanan): Promise<void> {
  await penyimpanan.hapus(akunId)
  try {
    localStorage.removeItem(KUNCI_AKUN_TERAKHIR)
  } catch {
    // Penyimpanan diblokir; tidak ada penanda yang perlu dihapus.
  }
}
