import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Produksi: Laravel menyajikan SPA dan API dari satu origin (AD-7).
// Di dev, Vite meneruskan /api dan /auth ke Laravel agar tetap satu origin bagi cookie.
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_ORIGIN, changeOrigin: false },
      '/auth': { target: API_ORIGIN, changeOrigin: false },
      '/sanctum': { target: API_ORIGIN, changeOrigin: false },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
