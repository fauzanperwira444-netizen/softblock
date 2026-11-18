import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { MODE_MOCK } from './api/mode'
import { AuthProvider } from './app/auth'
import { buatRouter } from './app/router'
import './index.css'

async function mulai() {
  const root = document.getElementById('root')
  if (!root) throw new Error('Elemen #root tidak ditemukan')

  // import.meta.env.DEV ditulis langsung agar Vite membuang modul mock dari build produksi.
  if (import.meta.env.DEV && MODE_MOCK) {
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
