import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router'
import { Button } from '../ui/kit/Button'
import { Alert, Spinner } from '../ui/kit/display'
import { DataProvider } from '../data/DataProvider'
import { useAuth } from './auth'
import { tujuanAman } from './tujuan'

function LayarStatus() {
  const { status, galat, muatUlang } = useAuth()
  if (status === 'galat') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-4">
        <Alert
          tone="error"
          title="Aplikasi belum bisa dimuat"
          action={
            <Button variant="sage" icon="refresh" onClick={muatUlang}>
              Coba lagi
            </Button>
          }
        >
          {galat?.message}
        </Alert>
      </main>
    )
  }
  return (
    <main className="grid min-h-dvh place-items-center">
      <Spinner label="Memuat Softblock…" />
    </main>
  )
}

/** Zona terautentikasi: tanpa sesi diarahkan ke Masuk, lalu kembali ke tujuan semula (U-12). */
export function WajibMasuk() {
  const { status, alasanTamu } = useAuth()
  const location = useLocation()
  if (status === 'memuat' || status === 'galat') return <LayarStatus />
  if (status === 'tamu') {
    const ke = location.pathname + location.search
    const params = new URLSearchParams()
    if (alasanTamu === 'sesi_habis') params.set('sesi', 'habis')
    if (alasanTamu !== 'keluar' && ke !== '/') params.set('ke', ke)
    const query = params.toString()
    return <Navigate to={query ? `/masuk?${query}` : '/masuk'} replace />
  }
  return (
    <DataProvider>
      <Outlet />
    </DataProvider>
  )
}

/** Zona publik: pengguna yang sudah masuk langsung ke tujuan atau Dashboard. */
export function HanyaTamu() {
  const { status } = useAuth()
  const [params] = useSearchParams()
  if (status === 'memuat' || status === 'galat') return <LayarStatus />
  if (status === 'masuk') return <Navigate to={tujuanAman(params.get('ke'))} replace />
  return <Outlet />
}
