// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
import { pakaiServerMock, server } from '../test/server'
import { request } from './client'
import { ApiError } from './errors'

pakaiServerMock()

async function galatDari(p: Promise<unknown>): Promise<ApiError> {
  try {
    await p
  } catch (e) {
    if (e instanceof ApiError) return e
    throw e
  }
  throw new Error('Permintaan seharusnya gagal')
}

describe('request', () => {
  test('mengirim X-Build dan token CSRF pada permintaan pengubah', async () => {
    let header: Headers | undefined
    server.use(
      http.post('/api/coba', ({ request: req }) => {
        header = req.headers
        return HttpResponse.json({ ok: true })
      }),
    )
    await request('POST', '/api/coba', {})
    expect(header?.get('X-Build')).toBe('dev')
    expect(header?.get('X-XSRF-TOKEN')).toBe('mock-xsrf')
  })

  test('422 dipetakan ke validasi_gagal dengan rincian per kolom', async () => {
    const e = await galatDari(request('POST', '/api/auth/daftar', { email: 'salah', password: 'pendek' }))
    expect(e.kode).toBe('validasi_gagal')
    expect(e.rincian.email).toBe('Format email tidak valid.')
    expect(e.rincian.password).toMatch(/minimal 8/)
  })

  test('401 dipetakan ke sesi_habis', async () => {
    const e = await galatDari(request('GET', '/api/akun'))
    expect(e.kode).toBe('sesi_habis')
  })

  test('429 membawa tunggu_detik', async () => {
    server.use(
      http.get('/api/coba', () =>
        HttpResponse.json({ kode: 'terlalu_banyak_percobaan', pesan: 'Tunggu.', tunggu_detik: 900 }, { status: 429 }),
      ),
    )
    const e = await galatDari(request('GET', '/api/coba'))
    expect(e.kode).toBe('terlalu_banyak_percobaan')
    expect(e.tungguDetik).toBe(900)
  })

  test('409 membedakan klien_usang dari versi_konflik', async () => {
    server.use(
      http.get('/api/usang', () => HttpResponse.json({ kode: 'klien_usang' }, { status: 409 })),
      http.get('/api/konflik', () => HttpResponse.json({ kode: 'versi_konflik' }, { status: 409 })),
    )
    expect((await galatDari(request('GET', '/api/usang'))).kode).toBe('klien_usang')
    expect((await galatDari(request('GET', '/api/konflik'))).kode).toBe('versi_konflik')
  })

  test('kegagalan jaringan menjadi galat jaringan', async () => {
    server.use(http.get('/api/putus', () => HttpResponse.error()))
    const e = await galatDari(request('GET', '/api/putus'))
    expect(e.kode).toBe('jaringan')
  })
})
