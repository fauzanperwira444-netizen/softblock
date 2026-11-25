import { sinkronApi } from '../api/sinkron'
import { ApiError } from '../api/errors'
import type { NamaTabel, ResponsMutasi, ResponsSinkron, Tabel } from '../domain/tipe'
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

  /** Terapkan respons aksi pengubah; bila ada perubahan lain di antaranya, tarik delta (10.2). */
  async terapkanMutasi(respons: ResponsMutasi) {
    const lama = this.state.snapshot
    if (!lama) return
    const terlewat = respons.revisi_sebelum !== lama.revisi
    const baru = terapkan(lama, { ...respons, penuh: false, meta: { hari_ini: lama.hari_ini, zona_waktu: lama.zona_waktu, akun_dibuat: lama.akun_dibuat ?? null } }, this.sekarang())
    // Waktu sinkron tetap dari sinkron penuh terakhir; mutasi bukan pengganti sinkron.
    this.set({ snapshot: { ...baru, disinkron_pada: terlewat ? lama.disinkron_pada : baru.disinkron_pada } })
    await this.opsi.penyimpanan.simpan(this.opsi.akunId, this.state.snapshot as Snapshot).catch(() => undefined)
    if (terlewat) await this.sinkronDiam()
  }

  /**
   * Pembaruan instan (N-50): ubah baris di snapshot sebelum server menjawab.
   * Mengembalikan baris lama agar bisa dipulihkan bila server menolak.
   */
  ubahLokal<K extends NamaTabel>(tabel: K, id: string, baris: Tabel[K] | null): Tabel[K] | undefined {
    const s = this.state.snapshot
    if (!s) return undefined
    const lama = s.isi[tabel][id] as Tabel[K] | undefined
    const isiTabel = { ...s.isi[tabel] } as Record<string, Tabel[K]>
    if (baris) isiTabel[id] = baris
    else delete isiTabel[id]
    this.set({ snapshot: { ...s, isi: { ...s.isi, [tabel]: isiTabel } } })
    return lama
  }

  pulihkanLokal<K extends NamaTabel>(tabel: K, id: string, lama: Tabel[K] | undefined) {
    const s = this.state.snapshot
    if (!s) return
    const isiTabel = { ...s.isi[tabel] } as Record<string, Tabel[K]>
    if (lama) isiTabel[id] = lama
    else delete isiTabel[id]
    this.set({ snapshot: { ...s, isi: { ...s.isi, [tabel]: isiTabel } } })
  }

  /** Galat aksi yang berlaku untuk seluruh aplikasi: sesi habis (U-13) dan klien usang (bilah versi baru). */
  laporGalatAksi(e: unknown) {
    if (!(e instanceof ApiError)) return
    if (e.kode === 'sesi_habis') this.opsi.onSesiHabis()
    if (e.kode === 'klien_usang') this.set({ koneksi: 'usang', galat: null })
  }

  /** Tarik delta tanpa mengubah bilah status; dipakai setelah 409 atau mutasi yang melompati revisi. */
  async sinkronDiam() {
    try {
      const respons = await this.api.sinkron(this.state.snapshot?.revisi ?? 0)
      const baru = terapkan(this.state.snapshot, respons, this.sekarang())
      this.set({ snapshot: baru })
      await this.opsi.penyimpanan.simpan(this.opsi.akunId, baru).catch(() => undefined)
    } catch (e) {
      if (e instanceof ApiError && e.kode === 'sesi_habis') {
        this.opsi.onSesiHabis()
        return
      }
      await this.segarkan()
    }
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
