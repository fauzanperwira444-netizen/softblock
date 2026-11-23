import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { MODE_MOCK } from './api/mode'
import { AuthProvider } from './app/auth'
import { daftarkanServiceWorker } from './app/pwa'
import { buatRouter } from './app/router'
import './index.css'

async function mulai() {
  const root = document.getElementById('root')
  if (!root) throw new Error('Elemen #root tidak ditemukan')

  // Env ditulis langsung agar Vite membuang modul mock dari build produksi non-demo.
  if ((import.meta.env.DEV || import.meta.env.VITE_DEMO === 'on') && MODE_MOCK) {
    const { mulaiMock } = await import('./api/mock/browser')
    await mulaiMock()
  }

  createRoot(root).render(
    <StrictMode>
      {/* Gerak transform dimatikan otomatis saat pengguna memilih prefers-reduced-motion. */}
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <RouterProvider router={buatRouter()} />
        </AuthProvider>
      </MotionConfig>
    </StrictMode>,
  )
}

void mulai()
daftarkanServiceWorker()
