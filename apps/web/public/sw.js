/*
  Service worker Softblock: hanya cangkang aplikasi yang di-cache. Data tidak pernah
  di-cache di sini: snapshot offline ada di IndexedDB, dan /api, /auth, /sanctum selalu ke jaringan.
  - Navigasi: jaringan dulu, jatuh ke index.html tersimpan saat offline, agar build baru langsung dipakai.
  - /assets/*: nama berisi hash, jadi cache dulu aman.
*/
const CACHE = 'softblock-cangkang-v1'
const CANGKANG = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CANGKANG)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((kunci) => Promise.all(kunci.filter((k) => k.startsWith('softblock-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Halaman mengirim daftar aset yang sudah dimuat sebelum service worker aktif (kunjungan pertama).
self.addEventListener('message', (event) => {
  if (event.data?.jenis !== 'simpan-aset' || !Array.isArray(event.data.url)) return
  const url = event.data.url.filter((u) => typeof u === 'string' && new URL(u).origin === self.location.origin && new URL(u).pathname.startsWith('/assets/'))
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(url)).catch(() => undefined))
})

function bukanCangkang(url) {
  return url.origin !== self.location.origin || /^\/(api|auth|sanctum)(\/|$)/.test(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (bukanCangkang(url)) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const salinan = res.clone()
            void caches.open(CACHE).then((c) => c.put('/', salinan))
          }
          return res
        })
        .catch(() => caches.match('/').then((r) => r ?? Response.error())),
    )
    return
  }

  if (url.pathname.startsWith('/assets/') || CANGKANG.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (tersimpan) =>
          tersimpan ??
          fetch(req).then((res) => {
            if (res.ok) {
              const salinan = res.clone()
              void caches.open(CACHE).then((c) => c.put(req, salinan))
            }
            return res
          }),
      ),
    )
  }
})
