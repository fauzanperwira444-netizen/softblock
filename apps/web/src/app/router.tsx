import { lazy, Suspense } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { Spinner } from '../ui/kit/display'
import { AkunPage } from '../ui/pages/akun/AkunPage'
import { DaftarPage } from '../ui/pages/auth/DaftarPage'
import { LupaPasswordPage } from '../ui/pages/auth/LupaPasswordPage'
import { MasukPage } from '../ui/pages/auth/MasukPage'
import { ResetPasswordPage } from '../ui/pages/auth/ResetPasswordPage'
import { DashboardPage } from '../ui/pages/dashboard/DashboardPage'
import { SedangDibangun } from '../ui/pages/SedangDibangun'
import { TidakDitemukanPage } from '../ui/pages/TidakDitemukanPage'
import { AppShell } from '../ui/shell/AppShell'
import { HanyaTamu, WajibMasuk } from './guards'

const rutePublik: RouteObject = {
  element: <HanyaTamu />,
  children: [
    { path: 'masuk', element: <MasukPage /> },
    { path: 'daftar', element: <DaftarPage /> },
    { path: 'lupa-password', element: <LupaPasswordPage /> },
  ],
}

const ruteMasuk: RouteObject = {
  element: <WajibMasuk />,
  children: [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'projek', element: <SedangDibangun judul="Projek" icon="folder" tahap="Tahap 3" /> },
        { path: 'projek/:id', element: <SedangDibangun judul="Detail projek" icon="folder" tahap="Tahap 3" /> },
        { path: 'task', element: <SedangDibangun judul="Task" icon="check_circle" tahap="Tahap 4" /> },
        { path: 'todo', element: <SedangDibangun judul="To-do" icon="checklist" tahap="Tahap 5" /> },
        { path: 'kalender', element: <SedangDibangun judul="Kalender" icon="calendar_today" tahap="Tahap 6" /> },
        { path: 'akun', element: <AkunPage /> },
      ],
    },
  ],
}

function ruteDev(): RouteObject[] {
  if (!import.meta.env.DEV) return []
  const KitPage = lazy(() => import('../ui/pages/kit/KitPage').then((m) => ({ default: m.KitPage })))
  return [
    {
      path: '_kit',
      element: (
        <Suspense fallback={<Spinner label="Memuat katalog…" />}>
          <KitPage />
        </Suspense>
      ),
    },
  ]
}

// Reset password bisa dibuka baik saat masuk maupun tidak, karena datang dari tautan email.
export const routes: RouteObject[] = [
  {
    path: '/',
    children: [
      rutePublik,
      { path: 'reset-password', element: <ResetPasswordPage /> },
      ruteMasuk,
      ...ruteDev(),
      { path: '*', element: <TidakDitemukanPage /> },
    ],
  },
]

export function buatRouter() {
  return createBrowserRouter(routes)
}
