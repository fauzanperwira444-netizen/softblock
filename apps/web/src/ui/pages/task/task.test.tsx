// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AKUN_CONTOH } from '../../../api/mock/seed'
import { AuthProvider } from '../../../app/auth'
import { routes } from '../../../app/router'
import { pakaiServerMock, server } from '../../../test/server'

pakaiServerMock()

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

describe('Daftar Task', () => {
  test('default Aktif; pencarian melepas filter status bawaan', async () => {
    const { user } = await masukLalu('/task')
    expect(await screen.findByRole('button', { name: 'Survei 3 kos' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Servis kipas' })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Cari task, projek, atau label'), 'rumah')
    expect(await screen.findByRole('button', { name: 'Servis kipas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beli tinta printer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Survei 3 kos' })).not.toBeInTheDocument()
  })

  test('progress instan tampil langsung, lalu dipulihkan dengan Coba lagi saat server gagal', async () => {
    server.use(http.post('/api/task/:id/progress', async () => {
      await delay(300)
      return HttpResponse.json({ kode: 'kesalahan_server', pesan: 'Server bermasalah.' }, { status: 500 })
    }))
    const { user } = await masukLalu('/task')
    const meter = await screen.findByRole('meter', { name: 'Progress Survei 3 kos' })
    expect(meter).toHaveAttribute('aria-valuenow', '6')

    await user.click(screen.getByRole('button', { name: 'Tambah progress Survei 3 kos' }))
    expect(screen.getByRole('meter', { name: 'Progress Survei 3 kos' })).toHaveAttribute('aria-valuenow', '7')

    const galat = await screen.findByRole('alert')
    expect(galat).toHaveTextContent('Server bermasalah.')
    expect(within(galat).getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Progress Survei 3 kos' })).toHaveAttribute('aria-valuenow', '6')
  })

  test('progress instan tersimpan ke server dan tercatat di riwayat panel detail', async () => {
    const { user, router } = await masukLalu('/task')
    await user.click(await screen.findByRole('button', { name: 'Tambah progress Survei 3 kos' }))
    await waitFor(() => expect(screen.getByRole('meter', { name: 'Progress Survei 3 kos' })).toHaveAttribute('aria-valuenow', '7'))

    await user.click(screen.getByRole('button', { name: 'Survei 3 kos' }))
    const panel = await screen.findByRole('dialog', { name: 'Detail task' })
    expect(router.state.location.search).toMatch(/task=t-7/)
    expect(await within(panel).findByText('6→7')).toBeInTheDocument()
  })

  test('tambah task mandiri dengan label baru', async () => {
    const { user } = await masukLalu('/task')
    await user.click(await screen.findByRole('button', { name: 'Tambah task' }))
    const form = await screen.findByRole('dialog', { name: 'Tambah task' })
    await user.click(within(form).getByRole('radio', { name: 'Mandiri' }))
    await user.type(within(form).getByLabelText('Atau label baru'), 'Belanja')
    await user.type(within(form).getByLabelText(/Nama task/), 'Beli sabun')
    await user.click(within(form).getByRole('button', { name: 'Simpan task' }))

    expect(await screen.findByRole('button', { name: 'Beli sabun' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Belanja' }).length).toBeGreaterThan(0)
  })

  test('nama task bentrok dengan task aktif berlabel sama ditolak di formulir', async () => {
    const { user } = await masukLalu('/task')
    await user.click(await screen.findByRole('button', { name: 'Tambah task' }))
    const form = await screen.findByRole('dialog', { name: 'Tambah task' })
    await user.selectOptions(within(form).getByLabelText(/Sesi projek/), within(form).getByRole('option', { name: /Pindah Kos/ }))
    await user.type(within(form).getByLabelText(/Nama task/), 'Survei 3 kos')
    await user.click(within(form).getByRole('button', { name: 'Simpan task' }))
    expect(await within(form).findByText('Nama sudah dipakai task aktif berlabel sama.')).toBeInTheDocument()
  })
})
