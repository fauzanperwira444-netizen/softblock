// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { KUNCI_SIMULASI } from '../api/mock/handlers'
import { AKUN_CONTOH } from '../api/mock/seed'
import { pakaiServerMock } from '../test/server'
import { AuthProvider } from './auth'
import { routes } from './router'

pakaiServerMock()

afterEach(() => localStorage.removeItem(KUNCI_SIMULASI))

async function masukLalu(jalur: string) {
  const user = userEvent.setup()
  const router = createMemoryRouter(routes, { initialEntries: [`/masuk?ke=${encodeURIComponent(jalur)}`] })
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

/** Mengakhiri sesi di server tiruan tanpa lewat klien, seperti sesi yang kedaluwarsa sendiri. */
function sesiKedaluwarsa() {
  const s = JSON.parse(localStorage.getItem('softblock-mock') ?? '{}') as { sesi: string | null }
  localStorage.setItem('softblock-mock', JSON.stringify({ ...s, sesi: null }))
}

describe('Sesi dan versi aplikasi', () => {
  test('sesi habis saat formulir terbuka: dialog login ulang di atasnya dan isian tetap ada', async () => {
    const { user, router } = await masukLalu('/task')
    await user.click(await screen.findByRole('button', { name: 'Tambah task' }))
    const form = await screen.findByRole('dialog', { name: 'Tambah task' })
    await user.click(within(form).getByRole('radio', { name: 'Mandiri' }))
    await user.type(within(form).getByLabelText('Atau label baru'), 'Belanja')
    await user.type(within(form).getByLabelText(/Nama task/), 'Beli sabun')

    sesiKedaluwarsa()
    await user.click(within(form).getByRole('button', { name: 'Simpan task' }))

    const dialog = await screen.findByRole('dialog', { name: 'Sesi habis' })
    expect(within(dialog).getByLabelText('Email')).toHaveValue(AKUN_CONTOH.email)
    expect(within(dialog).getByLabelText('Email')).toHaveAttribute('readonly')
    expect(within(dialog).queryByRole('button', { name: /Batal|Tutup/ })).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/task')

    await user.type(within(dialog).getByLabelText('Password'), AKUN_CONTOH.password)
    await user.click(within(dialog).getByRole('button', { name: 'Masuk lagi' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sesi habis' })).not.toBeInTheDocument())

    expect(within(form).getByLabelText(/Nama task/)).toHaveValue('Beli sabun')
    await waitFor(() => expect(screen.queryByText(/^Menyambungkan/)).not.toBeInTheDocument())
    await waitFor(() => expect(within(form).getByRole('button', { name: 'Simpan task' })).toBeEnabled())
    await user.click(within(form).getByRole('button', { name: 'Simpan task' }))
    expect(await screen.findByRole('button', { name: 'Beli sabun' })).toBeInTheDocument()
  })

  test('sesi habis tanpa formulir terbuka: menuju halaman Masuk dengan pesan', async () => {
    const { user, router } = await masukLalu('/todo')
    const ceklis = await screen.findAllByRole('checkbox', { name: /^Tandai .* dikerjakan$/ })
    const aktif = ceklis.find((c) => !c.hasAttribute('disabled'))
    if (!aktif) throw new Error('tidak ada ceklis aktif')
    sesiKedaluwarsa()
    await user.click(aktif)
    expect(await screen.findByText('Sesi habis. Masuk lagi untuk melanjutkan.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/masuk')
  })

  test('aksi ditolak 409 klien_usang memunculkan bilah "Ada versi baru aplikasi"', async () => {
    const { user } = await masukLalu('/todo')
    const ceklis = await screen.findAllByRole('checkbox', { name: /^Tandai .* dikerjakan$/ })
    const aktif = ceklis.find((c) => !c.hasAttribute('disabled'))
    if (!aktif) throw new Error('tidak ada ceklis aktif')
    localStorage.setItem(KUNCI_SIMULASI, 'usang')
    await user.click(aktif)
    expect(await screen.findByText('Ada versi baru aplikasi.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Muat ulang' })).toBeInTheDocument()
  })
})
