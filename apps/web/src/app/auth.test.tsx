// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AKUN_CONTOH } from '../api/mock/seed'
import { pakaiServerMock } from '../test/server'
import { AuthProvider } from './auth'
import { routes } from './router'

pakaiServerMock()

function tampilkan(jalur: string) {
  const router = createMemoryRouter(routes, { initialEntries: [jalur] })
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
  return router
}

describe('alur masuk', () => {
  test('tanpa sesi diarahkan ke Masuk lalu kembali ke tujuan semula', async () => {
    const user = userEvent.setup()
    const router = tampilkan('/akun')

    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?ke=%2Fakun')

    await user.type(screen.getByLabelText('Email'), AKUN_CONTOH.email)
    await user.type(screen.getByLabelText('Password'), AKUN_CONTOH.password)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('heading', { name: 'Akun pengguna', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/akun')
  })

  test('Keluar menuju Masuk tanpa membawa halaman terakhir', async () => {
    const user = userEvent.setup()
    const router = tampilkan('/masuk')
    await screen.findByRole('heading', { name: 'Masuk' })
    await user.type(screen.getByLabelText('Email'), AKUN_CONTOH.email)
    await user.type(screen.getByLabelText('Password'), AKUN_CONTOH.password)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    await screen.findByRole('heading', { name: 'Dashboard', level: 1 })

    await router.navigate('/akun')
    await user.click(await screen.findByRole('button', { name: 'Keluar dari perangkat ini' }))
    const dialog = await screen.findByRole('dialog', { name: 'Keluar dari perangkat ini?' })
    await user.click(within(dialog).getByRole('button', { name: 'Keluar' }))

    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(router.state.location.pathname + router.state.location.search).toBe('/masuk')
  })

  test('password salah menampilkan pesan dan isian tetap ada', async () => {
    const user = userEvent.setup()
    tampilkan('/masuk')
    await screen.findByRole('heading', { name: 'Masuk' })

    await user.type(screen.getByLabelText('Email'), AKUN_CONTOH.email)
    await user.type(screen.getByLabelText('Password'), 'salah-sekali')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email atau password salah.')
    expect(screen.getByLabelText('Email')).toHaveValue(AKUN_CONTOH.email)
  })

  test('lima kali gagal memunculkan pesan tunggu', async () => {
    const user = userEvent.setup()
    tampilkan('/masuk')
    await screen.findByRole('heading', { name: 'Masuk' })
    await user.type(screen.getByLabelText('Email'), AKUN_CONTOH.email)
    await user.type(screen.getByLabelText('Password'), 'salah')

    for (let i = 0; i < 6; i++) {
      await user.click(screen.getByRole('button', { name: 'Masuk' }))
      await screen.findByRole('alert')
    }
    expect(screen.getByRole('alert')).toHaveTextContent(/Coba lagi dalam 15 menit/)
  })

  test('isian kosong ditandai per kolom tanpa memanggil server', async () => {
    const user = userEvent.setup()
    tampilkan('/masuk')
    await screen.findByRole('heading', { name: 'Masuk' })
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Email wajib diisi.')
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Password wajib diisi.')
  })
})
