// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
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

describe('Projek', () => {
  test('daftar menampilkan projek dan filter status menyaring', async () => {
    const { user } = await masukLalu('/projek')
    expect(await screen.findByText('Skripsi Bab 3')).toBeInTheDocument()
    expect(screen.getByText('Lomba UI')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Jeda/ }))
    await waitFor(() => expect(screen.queryByText('Skripsi Bab 3')).not.toBeInTheDocument())
    expect(screen.getByText('Les Bahasa Jepang')).toBeInTheDocument()
  })

  test('buat projek lalu tambah sesi; sesi bertumpuk ditolak', async () => {
    const { user, router } = await masukLalu('/projek')
    await user.click(await screen.findByRole('button', { name: 'Buat projek' }))
    const form = await screen.findByRole('dialog', { name: 'Buat projek baru' })
    await user.type(within(form).getByLabelText(/Nama projek/), 'Riset Lapangan')
    await user.click(within(form).getByRole('button', { name: 'Simpan projek' }))

    expect(await screen.findByRole('heading', { name: 'Riset Lapangan', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toMatch(/^\/projek\//)

    await user.click(screen.getAllByRole('button', { name: 'Tambah sesi' })[0] as HTMLElement)
    const sesi = await screen.findByRole('dialog', { name: 'Tambah sesi' })
    await user.click(within(sesi).getByRole('button', { name: 'Simpan sesi' }))
    expect(await screen.findByRole('heading', { name: 'Sesi 1', level: 2 })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Tambah sesi' })[0] as HTMLElement)
    const kedua = await screen.findByRole('dialog', { name: 'Tambah sesi' })
    await user.click(within(kedua).getByRole('button', { name: 'Simpan sesi' }))
    expect(await within(kedua).findByText(/bertabrakan dengan “Sesi 1”/)).toBeInTheDocument()
  })

  test('batal projek menampilkan dampak, lalu projek menjadi batal', async () => {
    const { user } = await masukLalu('/projek')
    await user.click(await screen.findByRole('link', { name: /Pindah Kos/ }))
    await user.click(await screen.findByRole('button', { name: 'Batal projek' }))

    const dialog = await screen.findByRole('dialog', { name: 'Batalkan projek “Pindah Kos”?' })
    expect(within(dialog).getByText(/2 task aktif dibatalkan: Survei 3 kos, Kemas buku/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Kembali' })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: 'Ya, batalkan projek' }))
    expect(await screen.findByRole('button', { name: 'Buka kembali' })).toBeInTheDocument()
    expect(screen.getAllByText('Batal').length).toBeGreaterThan(0)
  })

  test('409 dampak_berubah: aksi tidak jalan dan dialog memberi tahu', async () => {
    server.use(
      http.post('/api/projek/:id/batal', () =>
        HttpResponse.json({ kode: 'dampak_berubah', pesan: 'Dampak aksi berubah karena data berubah di perangkat lain.' }, { status: 409 }),
      ),
    )
    const { user } = await masukLalu('/projek')
    await user.click(await screen.findByRole('link', { name: /Pindah Kos/ }))
    await user.click(await screen.findByRole('button', { name: 'Batal projek' }))
    const dialog = await screen.findByRole('dialog', { name: 'Batalkan projek “Pindah Kos”?' })
    await user.click(within(dialog).getByRole('button', { name: 'Ya, batalkan projek' }))
    expect(await within(dialog).findByText(/Dampak aksi berubah/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Buka kembali' })).not.toBeInTheDocument()
  })
})
