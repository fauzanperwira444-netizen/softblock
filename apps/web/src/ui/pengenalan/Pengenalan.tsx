import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useAuth } from '../../app/auth'
import { useData } from '../../data/DataProvider'
import { PENGENALAN_HALAMAN, type KunciHalaman } from '../../pengenalan/isi'
import { bacaStatus, pengenalanBerlaku, simpanStatus, STATUS_AWAL, tandaiHalaman, type StatusPengenalan } from '../../pengenalan/status'
import { DialogAwal } from './DialogAwal'
import { Sorotan } from './Sorotan'

/** Jeda setelah layar tenang sebelum pengenalan muncul, agar tidak menyambar layar yang baru stabil. */
export const JEDA_TAMPIL_MS = 400

type Tampil = { jenis: 'awal' } | { jenis: 'halaman'; kunci: KunciHalaman }

type Nilai = {
  setHalaman: (ubah: (k: KunciHalaman | null) => KunciHalaman | null) => void
  tampilkanLagi: () => void
}

const Ctx = createContext<Nilai | null>(null)

/** Halaman mendaftarkan pengenalannya selama terpasang; meninggalkan halaman menutup sorotan tanpa menandainya (O-04). */
export function usePengenalanHalaman(kunci: KunciHalaman) {
  const setHalaman = useContext(Ctx)?.setHalaman
  useEffect(() => {
    if (!setHalaman) return
    setHalaman(() => kunci)
    return () => setHalaman((k) => (k === kunci ? null : k))
  }, [kunci, setHalaman])
}

export function useTampilkanPengenalanLagi() {
  return useContext(Ctx)?.tampilkanLagi
}

const QUERY_LEBAR = '(min-width: 768px)'

function useLayarLebar() {
  return useSyncExternalStore(
    (ubah) => {
      const mq = window.matchMedia(QUERY_LEBAR)
      mq.addEventListener('change', ubah)
      return () => mq.removeEventListener('change', ubah)
    },
    () => window.matchMedia(QUERY_LEBAR).matches,
  )
}

/** O-05: panel, formulir, dan dialog aplikasi memakai <dialog> native. */
function adaOverlayLain() {
  return document.querySelector('dialog[open]:not([data-lapisan-pengenalan])') !== null
}

function sasaranAda(kunci: KunciHalaman) {
  return PENGENALAN_HALAMAN[kunci].langkah.some((l) => l.sasaran.some((s) => document.querySelector(`[data-pengenalan="${s}"]`)))
}

export function PengenalanProvider({ children }: { children: ReactNode }) {
  const { akun } = useAuth()
  const { koneksi, snapshot } = useData()
  const lebar = useLayarLebar()
  const [halaman, setHalamanState] = useState<KunciHalaman | null>(null)
  const [status, setStatus] = useState<{ akunId: string; isi: StatusPengenalan } | null>(null)
  const [tampilState, setTampil] = useState<Tampil | null>(null)

  const akunId = akun?.id ?? null
  const tersimpan = useMemo(() => (akunId ? bacaStatus(akunId) : null), [akunId])
  const st = status && status.akunId === akunId ? status.isi : tersimpan

  const ubahStatus = useCallback(
    (ubah: (s: StatusPengenalan) => StatusPengenalan) => {
      if (!akunId) return
      setStatus((lama) => {
        const isi = ubah(lama?.akunId === akunId ? lama.isi : bacaStatus(akunId))
        simpanStatus(akunId, isi)
        return { akunId, isi }
      })
    },
    [akunId],
  )

  // Halaman ditinggalkan saat sorotannya tampil: tutup tanpa menandai, tampil lagi di kunjungan berikutnya (O-04).
  const setHalaman = useCallback((ubah: (k: KunciHalaman | null) => KunciHalaman | null) => {
    setHalamanState(ubah)
    setTampil((t) => (t?.jenis === 'halaman' ? null : t))
  }, [])

  // Layar menyempit ke ukuran HP: sorotan laptop tidak dipakai.
  const tampil = tampilState?.jenis === 'halaman' && !lebar ? null : tampilState
  const berlaku = st !== null && pengenalanBerlaku(st, snapshot?.akun_dibuat)
  // Sorotan halaman baru tersedia untuk laptop; HP menyusul dengan kartu di bawah layar.
  const kunciMau: 'awal' | KunciHalaman | null = !berlaku
    ? null
    : !st.awal
      ? 'awal'
      : halaman && lebar && !st.halaman.includes(halaman)
        ? halaman
        : null

  // Tunggu sampai tersambung, tidak ada overlay lain, dan sasaran sudah dirender; lalu beri jeda.
  useEffect(() => {
    if (!kunciMau || tampil || koneksi !== 'online') return
    const mau: Tampil = kunciMau === 'awal' ? { jenis: 'awal' } : { jenis: 'halaman', kunci: kunciMau }
    let timer: ReturnType<typeof setTimeout> | undefined
    const periksa = () => {
      clearTimeout(timer)
      if (adaOverlayLain()) return
      if (mau.jenis === 'halaman' && !sasaranAda(mau.kunci)) return
      timer = setTimeout(() => setTampil(mau), JEDA_TAMPIL_MS)
    }
    const pengamat = new MutationObserver(periksa)
    pengamat.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] })
    periksa()
    return () => {
      pengamat.disconnect()
      clearTimeout(timer)
    }
  }, [kunciMau, tampil, koneksi])

  const tutup = useCallback(() => {
    setTampil(null)
    document.getElementById('konten')?.focus({ preventScroll: true })
  }, [])

  const tampilkanLagi = useCallback(() => {
    ubahStatus(() => ({ ...STATUS_AWAL, aktif: true }))
    setTampil(null)
  }, [ubahStatus])

  const nilai = useMemo<Nilai>(() => ({ setHalaman, tampilkanLagi }), [setHalaman, tampilkanLagi])

  return (
    <Ctx.Provider value={nilai}>
      {children}
      {tampil?.jenis === 'awal' && (
        <DialogAwal
          nama={akun?.nama_tampil ?? ''}
          onSelesai={() => {
            ubahStatus((s) => ({ ...s, awal: true }))
            tutup()
          }}
          onMatikan={() => {
            ubahStatus((s) => ({ ...s, mati: true }))
            tutup()
          }}
        />
      )}
      {tampil?.jenis === 'halaman' && (
        <Sorotan
          key={tampil.kunci}
          isi={PENGENALAN_HALAMAN[tampil.kunci]}
          onSelesai={() => {
            ubahStatus((s) => tandaiHalaman(s, tampil.kunci))
            tutup()
          }}
          onMatikan={() => {
            ubahStatus((s) => ({ ...s, mati: true }))
            tutup()
          }}
        />
      )}
    </Ctx.Provider>
  )
}
