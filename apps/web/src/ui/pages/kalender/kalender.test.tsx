// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AKUN_CONTOH } from '../../../api/mock/seed'
import { AuthProvider } from '../../../app/auth'
import { routes } from '../../../app/router'
import { pakaiServerMock } from '../../../test/server'

pakaiServerMock()

beforeEach(() => localStorage.removeItem('softblock:tab-kalender'))

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

describe('Kalender', () => {
  test('bulan: legenda projek berpola, lalu panel hari menampilkan blok dan to-do', async () => {
    const { user } = await masukLalu('/kalender')
    expect(await screen.findByRole('link', { name: /Skripsi Bab 3 \(/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /hari ini/ }))
    const panel = await screen.findByRole('dialog', { name: /, \d+ \w+ \d{4}/ })
    expect(within(panel).getByRole('button', { name: 'Blok Kirim revisi bab 2, 13.00–15.00' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Kirim revisi bab 2' })).toBeInTheDocument()

    await user.click(within(panel).getByRole('radio', { name: 'Daftar' }))
    expect(within(panel).getByRole('list', { name: 'Urutan kegiatan hari ini' })).toHaveTextContent('13.00–15.00')
  })

  test('pilihan tab diingat di perangkat', async () => {
    const { user } = await masukLalu('/kalender')
    await user.click(await screen.findByRole('radio', { name: 'Minggu' }))
    expect(localStorage.getItem('softblock:tab-kalender')).toBe('minggu')
    expect(await screen.findByRole('region', { name: 'Kalender minggu' })).toBeInTheDocument()
  })

  test('tab Jadwal: tambah Jadwal mingguan lalu hapus karena belum pernah berlaku', async () => {
    const { user } = await masukLalu('/kalender')
    await user.click(await screen.findByRole('radio', { name: 'Jadwal' }))
    expect(await screen.findByRole('cell', { name: 'Kuliah Metodologi' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tambah Jadwal' }))
    const form = await screen.findByRole('dialog', { name: 'Tambah Jadwal' })
    await user.type(within(form).getByLabelText(/Nama Jadwal/), 'Rapat lab')
    await user.selectOptions(within(form).getByLabelText('Mulai'), '21.00')
    await user.selectOptions(within(form).getByLabelText('Selesai'), '22.00')
    await user.click(within(form).getByRole('button', { name: 'Simpan Jadwal' }))
    expect(await screen.findByRole('cell', { name: 'Rapat lab' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hapus Rapat lab' }))
    const konfirmasi = await screen.findByRole('dialog', { name: 'Hapus “Rapat lab”?' })
    await user.click(within(konfirmasi).getByRole('button', { name: 'Hapus Jadwal' }))
    await waitFor(() => expect(screen.queryByRole('cell', { name: 'Rapat lab' })).not.toBeInTheDocument())
  })

  test('Jadwal yang pernah berlaku hanya bisa diakhiri, dan pengecualian untuk semua Jadwal bisa ditambah', async () => {
    const { user } = await masukLalu('/kalender')
    await user.click(await screen.findByRole('radio', { name: 'Jadwal' }))
    const baris = (await screen.findByRole('cell', { name: 'Kuliah Metodologi' })).closest('tr') as HTMLElement
    expect(within(baris).getByRole('button', { name: 'Akhiri' })).toBeInTheDocument()
    expect(within(baris).queryByRole('button', { name: /Hapus/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Pengecualian/ }))
    await user.click(await screen.findByRole('button', { name: 'Tambah pengecualian' }))
    const form = await screen.findByRole('dialog', { name: 'Tambah pengecualian' })
    await user.type(within(form).getByLabelText(/Keterangan/), 'Libur kampus')
    await user.click(within(form).getByRole('button', { name: 'Simpan pengecualian' }))
    const item = (await screen.findByText('Libur kampus')).closest('li') as HTMLElement
    expect(within(item).getByText('Semua Jadwal')).toBeInTheDocument()
  })
})
