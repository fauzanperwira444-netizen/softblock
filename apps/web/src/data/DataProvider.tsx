import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { ApiError } from '../api/errors'
import { useAuth } from '../app/auth'
import type { NamaTabel, ResponsMutasi, Tabel } from '../domain/tipe'
import { gantiPemilikPerangkat, penyimpananIdb, type Penyimpanan } from './penyimpanan'
import { MesinSinkron, type StateData } from './sinkron'

const MesinContext = createContext<MesinSinkron | null>(null)

type Props = { children: ReactNode; penyimpanan?: Penyimpanan }

/** Satu mesin sinkron per akun yang sedang masuk; dibuang saat keluar. */
export function DataProvider({ children, penyimpanan = penyimpananIdb }: Props) {
  const { akun, tandaiSesiHabis } = useAuth()
  const akunId = akun?.id ?? null
  const [mesin, setMesin] = useState<MesinSinkron | null>(null)

  useEffect(() => {
    if (!akunId) return
    const m = new MesinSinkron({ akunId, penyimpanan, onSesiHabis: tandaiSesiHabis })
    setMesin(m)
    void gantiPemilikPerangkat(akunId, penyimpanan).then(() => m.mulai())
    window.addEventListener('online', m.saatOnline)
    window.addEventListener('offline', m.saatOffline)
    return () => {
      window.removeEventListener('online', m.saatOnline)
      window.removeEventListener('offline', m.saatOffline)
      m.hentikan()
    }
  }, [akunId, penyimpanan, tandaiSesiHabis])

  if (!mesin) return null
  return <MesinContext.Provider value={mesin}>{children}</MesinContext.Provider>
}

function useMesin(): MesinSinkron {
  const m = useContext(MesinContext)
  if (!m) throw new Error('useData dipakai di luar DataProvider')
  return m
}

export function useData(): StateData & { segarkan: () => void } {
  const mesin = useMesin()
  const state = useSyncExternalStore(mesin.subscribe, mesin.getState)
  return { ...state, segarkan: () => void mesin.segarkan() }
}

/**
 * Menjalankan aksi pengubah dengan If-Match = revisi snapshot, lalu menerapkan hasilnya.
 * 409 versi_konflik atau dampak_berubah memicu sinkron delta sebelum galat diteruskan ke formulir.
 */
export function useMutasi() {
  const mesin = useMesin()
  return useCallback(
    async (aksi: (revisi: number) => Promise<ResponsMutasi>): Promise<ResponsMutasi> => {
      try {
        const hasil = await aksi(mesin.getState().snapshot?.revisi ?? 0)
        await mesin.terapkanMutasi(hasil)
        return hasil
      } catch (e) {
        if (e instanceof ApiError && (e.kode === 'versi_konflik' || e.kode === 'dampak_berubah')) await mesin.sinkronDiam()
        throw e
      }
    },
    [mesin],
  )
}

/**
 * Pembaruan instan untuk ceklis, progress, tambah ke to-do, dan hapus entri (N-50):
 * baris diubah di perangkat lebih dulu, lalu dipulihkan bila server menolak atau tidak menjawab.
 */
export function useMutasiInstan() {
  const mesin = useMesin()
  return useCallback(
    async <K extends NamaTabel>(
      /** Baris baru atau hasil ubah; `baris: null` menghapus baris `id` secara instan. */
      lokal: { tabel: K; id: string; baris: Tabel[K] | null },
      aksi: (revisi: number) => Promise<ResponsMutasi>,
    ): Promise<void> => {
      const revisi = mesin.getState().snapshot?.revisi ?? 0
      const lama = mesin.ubahLokal(lokal.tabel, lokal.id, lokal.baris)
      try {
        await mesin.terapkanMutasi(await aksi(revisi))
      } catch (e) {
        mesin.pulihkanLokal(lokal.tabel, lokal.id, lama)
        if (e instanceof ApiError && (e.kode === 'versi_konflik' || e.kode === 'dampak_berubah')) await mesin.sinkronDiam()
        throw e
      }
    },
    [mesin],
  )
}

/**
 * Aksi ubah hanya boleh saat tersambung dan sinkron selesai (N-47, AU-2).
 * `alasan` ditampilkan di dekat tombol yang dinonaktifkan (I-10).
 */
export function useBolehUbah(): { boleh: boolean; alasan: string | null } {
  const { koneksi } = useData()
  switch (koneksi) {
    case 'online':
      return { boleh: true, alasan: null }
    case 'offline':
      return { boleh: false, alasan: 'Offline. Perubahan dinonaktifkan sampai tersambung lagi.' }
    case 'usang':
      return { boleh: false, alasan: 'Muat ulang aplikasi untuk memakai versi baru sebelum menyimpan.' }
    case 'galat':
      return { boleh: false, alasan: 'Belum tersambung ke server. Tekan Coba lagi di bilah atas.' }
    default:
      return { boleh: false, alasan: 'Menunggu data selesai diperbarui.' }
  }
}
