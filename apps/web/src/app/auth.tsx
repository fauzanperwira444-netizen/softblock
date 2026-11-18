import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { akunApi, GOOGLE_REDIRECT, type Akun } from '../api/akun'
import { request } from '../api/client'
import { ApiError } from '../api/errors'
import { MODE_MOCK } from '../api/mode'
import { lupakanPemilikPerangkat, penyimpananIdb } from '../data/penyimpanan'

type Status = 'memuat' | 'tamu' | 'masuk' | 'galat'

type AuthValue = {
  status: Status
  akun: Akun | null
  galat: ApiError | null
  /** Mengapa pengguna kembali menjadi tamu: menentukan tujuan dan pesan di halaman Masuk. */
  alasanTamu: 'keluar' | 'sesi_habis' | null
  /** Dipanggil lapisan data saat server menjawab 401 sesi_habis. */
  tandaiSesiHabis: () => void
  muatUlang: () => void
  masuk: (email: string, password: string) => Promise<void>
  daftar: (data: { email: string; password: string; nama_tampil: string }) => Promise<void>
  masukGoogle: () => Promise<void>
  keluar: () => Promise<void>
  perbarui: (akun: Akun) => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('memuat')
  const [akun, setAkun] = useState<Akun | null>(null)
  const [galat, setGalat] = useState<ApiError | null>(null)
  const [percobaan, setPercobaan] = useState(0)
  const [alasanTamu, setAlasanTamu] = useState<AuthValue['alasanTamu']>(null)

  useEffect(() => {
    let batal = false
    akunApi.saya().then(
      (a) => {
        if (batal) return
        setAkun(a)
        setStatus('masuk')
      },
      (e: unknown) => {
        if (batal) return
        if (e instanceof ApiError && e.kode === 'sesi_habis') {
          setStatus('tamu')
          return
        }
        setGalat(e instanceof ApiError ? e : new ApiError('kesalahan_server', 0))
        setStatus('galat')
      },
    )
    return () => {
      batal = true
    }
  }, [percobaan])

  const masukSebagai = useCallback((a: Akun) => {
    setAkun(a)
    setGalat(null)
    setAlasanTamu(null)
    setStatus('masuk')
  }, [])

  const tandaiSesiHabis = useCallback(() => {
    setAkun(null)
    setAlasanTamu('sesi_habis')
    setStatus('tamu')
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      status,
      akun,
      galat,
      alasanTamu,
      tandaiSesiHabis,
      muatUlang: () => {
        setStatus('memuat')
        setPercobaan((n) => n + 1)
      },
      masuk: async (email, password) => masukSebagai(await akunApi.masuk(email, password)),
      daftar: async (data) => masukSebagai(await akunApi.daftar(data)),
      masukGoogle: async () => {
        // Google memakai pengalihan halaman penuh (7.8); mock tidak bisa mencegatnya.
        if (MODE_MOCK) {
          masukSebagai(await request<Akun>('POST', '/api/mock/google'))
          return
        }
        window.location.assign(GOOGLE_REDIRECT)
      },
      keluar: async () => {
        await akunApi.keluar()
        // Snapshot offline dan draf ikut dihapus saat keluar (N-60).
        if (akun) await lupakanPemilikPerangkat(akun.id, penyimpananIdb).catch(() => undefined)
        setAkun(null)
        setAlasanTamu('keluar')
        setStatus('tamu')
      },
      perbarui: setAkun,
    }),
    [status, akun, galat, alasanTamu, masukSebagai, tandaiSesiHabis],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth dipakai di luar AuthProvider')
  return ctx
}
