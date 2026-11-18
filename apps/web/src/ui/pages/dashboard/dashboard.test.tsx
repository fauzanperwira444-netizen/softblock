// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AKUN_CONTOH } from '../../../api/mock/seed'
import { AuthProvider } from '../../../app/auth'
import { routes } from '../../../app/router'
import { pakaiServerMock } from '../../../test/server'

pakaiServerMock()

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

describe('Dashboard', () => {
  test('menampilkan semua bagian S-10 lalu Pola kerja dimuat terakhir', async () => {
    await masuk()
    expect(await screen.findByRole('heading', { name: /^Telat/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hari ini dan 7 hari ke depan' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'To-do hari ini' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Jam kosong hari ini' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Minggu ini' })).toBeInTheDocument()

    const projek = screen.getByRole('region', { name: 'Projek' })
    expect(within(projek).getByRole('link', { name: /Skripsi Bab 3/ })).toHaveAttribute('href', expect.stringMatching(/^\/projek\//))

    const pola = screen.getByRole('region', { name: 'Pola kerja' })
    expect(await within(pola).findByText(/Dibuat/)).toBeInTheDocument()
    expect(within(pola).getByRole('img', { name: /Task selesai per minggu/ })).toBeInTheDocument()
  })

  test('kalender mini bisa digeser antarminggu dan membuka panel hari', async () => {
    const { user } = await masuk()
    await user.click(await screen.findByRole('button', { name: 'Minggu berikutnya' }))
    expect(await screen.findByRole('heading', { name: 'Minggu lain' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hari ini' }))
    expect(await screen.findByRole('heading', { name: 'Minggu ini' })).toBeInTheDocument()

    const kalender = screen.getByRole('region', { name: 'Minggu ini' })
    const tombolHari = within(kalender)
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-current') === 'date')
    if (!tombolHari) throw new Error('hari ini tidak ditemukan')
    await user.click(tombolHari)
    expect(await screen.findByRole('dialog', { name: /, \d+ \w+ \d{4}/ })).toBeInTheDocument()
  })
})
