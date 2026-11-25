// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AKUN_CONTOH } from '../../api/mock/seed'
import { AuthProvider } from '../../app/auth'
import { routes } from '../../app/router'
import { bacaStatus, pengenalanBerlaku, STATUS_AWAL, TANGGAL_RILIS_PENGENALAN } from '../../pengenalan/status'
import { pakaiServerMock } from '../../test/server'

pakaiServerMock()

const matchMediaAsli = window.matchMedia

afterEach(() => {
  window.matchMedia = matchMediaAsli
  localStorage.clear()
})

/** Sorotan halaman hanya dipakai di layar laptop. */
function layarLaptop() {
  window.matchMedia = (query: string) => ({ ...matchMediaAsli(query), matches: query === '(min-width: 768px)' })
}

async function masuk() {
  const user = userEvent.setup()
  const router = createMemoryRouter(routes, { initialEntries: ['/masuk'] })
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
  await user.type(await screen.findByLabelText('Email'), AKUN_CONTOH.email)
  await user.type(screen.getByLabelText('Password'), AKUN_CONTOH.password)
  await user.click(screen.getByRole('button', { name: 'Masuk' }))
  return { user, router }
}

describe('status pengenalan', () => {
  test('berlaku untuk akun sejak tanggal rilis, atau akun lama yang menyalakannya lagi', () => {
    expect(pengenalanBerlaku(STATUS_AWAL, TANGGAL_RILIS_PENGENALAN)).toBe(true)
    expect(pengenalanBerlaku(STATUS_AWAL, '2026-01-01')).toBe(false)
    expect(pengenalanBerlaku(STATUS_AWAL, null)).toBe(false)
    expect(pengenalanBerlaku({ ...STATUS_AWAL, aktif: true }, null)).toBe(true)
    expect(pengenalanBerlaku({ ...STATUS_AWAL, aktif: true, mati: true }, TANGGAL_RILIS_PENGENALAN)).toBe(false)
  })

  test('isi penyimpanan yang rusak dibaca sebagai status awal', () => {
    localStorage.setItem('softblock:pengenalan:a1', '{rusak')
    expect(bacaStatus('a1')).toEqual(STATUS_AWAL)
    localStorage.setItem('softblock:pengenalan:a1', JSON.stringify({ awal: true, halaman: ['task', 3] }))
    expect(bacaStatus('a1')).toEqual({ ...STATUS_AWAL, awal: true, halaman: ['task'] })
  })
})

describe('Pengenalan fitur', () => {
  test('akun lama tidak mendapat pengenalan otomatis', async () => {
    await masuk()
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 900))
    expect(screen.queryByText(/Selamat datang/)).not.toBeInTheDocument()
  })

  test('tampilkan lagi dari Akun, lalu pengenalan awal dan sorotan Dashboard', async () => {
    layarLaptop()
    const { user, router } = await masuk()
    await router.navigate('/akun')
    await user.click(await screen.findByRole('button', { name: 'Tampilkan pengenalan lagi' }))

    expect(await screen.findByRole('heading', { name: 'Mulai hari dari sini' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Kembali' })).not.toBeInTheDocument()
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(await screen.findByRole('heading', { name: 'Lihat waktu yang tersisa' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Selesai' }))
    expect(await screen.findByRole('heading', { name: 'Akun pengguna' })).toBeInTheDocument()
    await vi.waitFor(() => expect(screen.queryByRole('heading', { name: 'Lihat waktu yang tersisa' })).not.toBeInTheDocument())

    await router.navigate('/')
    expect(await screen.findByRole('heading', { name: 'Task telat' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(await screen.findByRole('heading', { name: 'Hari ini + 7 hari' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lewati' }))
    await vi.waitFor(() => expect(screen.queryByRole('heading', { name: 'Hari ini + 7 hari' })).not.toBeInTheDocument())

    const tersimpan = Object.entries(localStorage).find(([k]) => k.startsWith('softblock:pengenalan:'))?.[1]
    expect(JSON.parse(tersimpan ?? '{}')).toMatchObject({ awal: true, halaman: ['dashboard'], aktif: true, mati: false })
  })

  test('Matikan semua menutup pengenalan dan tidak memunculkan sorotan', async () => {
    layarLaptop()
    const { user, router } = await masuk()
    await router.navigate('/akun')
    await user.click(await screen.findByRole('button', { name: 'Tampilkan pengenalan lagi' }))
    await user.click(await screen.findByRole('button', { name: 'Matikan semua pengenalan' }))
    await router.navigate('/')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 900))
    expect(screen.queryByRole('heading', { name: 'Task telat' })).not.toBeInTheDocument()
  })
})
