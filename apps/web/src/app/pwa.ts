import { useEffect, useState } from 'react'

/** Didaftarkan hanya di build produksi; saat dev, msw memakai service worker sendiri. */
export function daftarkanServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // Kunjungan pertama: aset sudah dimuat sebelum service worker aktif, jadi kirim daftarnya untuk di-cache.
        const url = performance
          .getEntriesByType('resource')
          .map((e) => e.name)
          .filter((u) => u.startsWith(`${location.origin}/assets/`))
        reg.active?.postMessage({ jenis: 'simpan-aset', url })
      })
      .catch(() => undefined)
  })
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let tertunda: BeforeInstallPromptEvent | null = null
const pendengar = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    tertunda = e as BeforeInstallPromptEvent
    pendengar.forEach((cb) => cb())
  })
  window.addEventListener('appinstalled', () => {
    tertunda = null
    pendengar.forEach((cb) => cb())
  })
}

/** Tombol "Pasang aplikasi" hanya tampil bila browser menawarkan pemasangan. */
export function usePasangAplikasi(): { bisa: boolean; pasang: () => Promise<void> } {
  const [, setDetak] = useState(0)
  useEffect(() => {
    const cb = () => setDetak((n) => n + 1)
    pendengar.add(cb)
    return () => {
      pendengar.delete(cb)
    }
  }, [])
  return {
    bisa: tertunda !== null,
    pasang: async () => {
      const e = tertunda
      if (!e) return
      await e.prompt()
      await e.userChoice
      tertunda = null
      pendengar.forEach((cb) => cb())
    },
  }
}
