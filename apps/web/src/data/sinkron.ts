import { sinkronApi } from '../api/sinkron'
import { ApiError } from '../api/errors'
import type { ResponsSinkron } from '../domain/tipe'
import type { Penyimpanan } from './penyimpanan'
import { terapkan, type Snapshot } from './snapshot'

/*
  Alur buka aplikasi (Arsitektur Sistem 10.1): tampilkan snapshot lokal dulu, bangunkan server
  lewat /api/kesehatan, lalu tarik /api/sinkron?sejak=<revisi>. Perangkat hanya membaca (AD-2).
*/

export type Koneksi =
  | 'menyambungkan'
  /** Lebih dari 8 detik tanpa jawaban: server mungkin sedang bangun. */
  | 'lambat'
  | 'online'
  | 'offline'
  | 'tersambung_kembali'
  | 'galat'
  | 'usang'

export type StateData = {
  koneksi: Koneksi
  snapshot: Snapshot | null
  /** Snapshot lokal sudah dicoba dibaca; sebelum itu layar menampilkan kerangka. */
  lokalDibaca: boolean
  galat: string | null
}

export const BATAS_LAMBAT_MS = 8_000
export const BATAS_MENYERAH_MS = 90_000

type Api = {
  kesehatan: () => Promise<unknown>
  sinkron: (sejak: number) => Promise<ResponsSinkron>
}

type Opsi = {
  akunId: string
  penyimpanan: Penyimpanan
  api?: Api
  onSesiHabis: () => void
  sekarang?: () => Date
  online?: () => boolean
}

export class MesinSinkron {
  private state: StateData = { koneksi: 'menyambungkan', snapshot: null, lokalDibaca: false, galat: null }
  private pendengar = new Set<() => void>()
  private generasi = 0
  private timer: ReturnType<typeof setTimeout>[] = []
  private readonly api: Api
  private readonly sekarang: () => Date
  private readonly online: () => boolean
  private berhenti = false
  private readonly opsi: Opsi

  constructor(opsi: Opsi) {
    this.opsi = opsi
    this.api = opsi.api ?? sinkronApi
    this.sekarang = opsi.sekarang ?? (() => new Date())
    this.online = opsi.online ?? (() => navigator.onLine)
  }

  subscribe = (cb: () => void) => {
    this.pendengar.add(cb)
    return () => this.pendengar.delete(cb)
  }

  getState = () => this.state

  private set(patch: Partial<StateData>) {
    this.state = { ...this.state, ...patch }
    for (const cb of this.pendengar) cb()
  }

  private bersihkanTimer() {
    for (const t of this.timer) clearTimeout(t)
    this.timer = []
  }

  async mulai() {
    const lokal = await this.opsi.penyimpanan.baca(this.opsi.akunId).catch(() => null)
    if (this.berhenti) return
    this.set({ snapshot: lokal, lokalDibaca: true })
    await this.segarkan('menyambungkan')
  }

  /** Dipanggil saat koneksi pulih, tombol Coba lagi, atau pembukaan aplikasi. */
  async segarkan(awal: Koneksi = 'menyambungkan') {
    if (this.berhenti) return
    const gen = ++this.generasi
    this.bersihkanTimer()

    if (!this.online()) {
      this.set({ koneksi: 'offline', galat: null })
      return
    }

    this.set({ koneksi: awal, galat: null })
    this.timer.push(
      setTimeout(() => {
        if (gen === this.generasi && this.state.koneksi === 'menyambungkan') this.set({ koneksi: 'lambat' })
      }, BATAS_LAMBAT_MS),
    )
    const menyerah = new Promise<'menyerah'>((resolve) => {
      this.timer.push(setTimeout(() => resolve('menyerah'), BATAS_MENYERAH_MS))
    })

    try {
      const hasil = await Promise.race([this.tarik(), menyerah])
      if (gen !== this.generasi) return
      if (hasil === 'menyerah') {
        this.set({ koneksi: 'galat', galat: 'Server tidak menjawab dalam 90 detik.' })
        return
      }
      this.set({ koneksi: 'online', snapshot: hasil, galat: null })
      await this.opsi.penyimpanan.simpan(this.opsi.akunId, hasil).catch(() => undefined)
    } catch (e) {
      if (gen !== this.generasi) return
      if (e instanceof ApiError && e.kode === 'sesi_habis') {
        this.opsi.onSesiHabis()
        return
      }
      if (e instanceof ApiError && e.kode === 'klien_usang') {
        this.set({ koneksi: 'usang', galat: null })
        return
      }
      if (!this.online()) {
        this.set({ koneksi: 'offline', galat: null })
        return
      }
      this.set({ koneksi: 'galat', galat: e instanceof Error ? e.message : 'Gagal memperbarui data.' })
    } finally {
      if (gen === this.generasi) this.bersihkanTimer()
    }
  }

  private async tarik(): Promise<Snapshot> {
    await this.api.kesehatan()
    const respons = await this.api.sinkron(this.state.snapshot?.revisi ?? 0)
    return terapkan(this.state.snapshot, respons, this.sekarang())
  }

  saatOffline = () => {
    this.generasi++
    this.bersihkanTimer()
    this.set({ koneksi: 'offline' })
  }

  saatOnline = () => {
    void this.segarkan('tersambung_kembali')
  }

  hentikan() {
    this.berhenti = true
    this.generasi++
    this.bersihkanTimer()
    this.pendengar.clear()
  }
}
