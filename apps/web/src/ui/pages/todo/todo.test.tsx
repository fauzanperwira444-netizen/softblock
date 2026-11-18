// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AKUN_CONTOH } from '../../../api/mock/seed'
import { AuthProvider } from '../../../app/auth'
import { routes } from '../../../app/router'
import { pakaiServerMock } from '../../../test/server'

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

describe('To-do', () => {
  test('hari ini: entri berblok, kelompok belum diberi jam, ringkasan, dan Belum selesai', async () => {
    await masukLalu('/todo')
    expect(await screen.findByRole('button', { name: 'Kirim revisi bab 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ubah blok 13.00 sampai 15.00' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Belum diberi jam (1)' })).toHaveTextContent('Survei 3 kos')

    const tertunda = screen.getByRole('complementary', { name: 'Belum selesai' })
    expect(within(tertunda).getByText('Kemas buku')).toBeInTheDocument()
    // Entri kemarin "Cari 10 jurnal" punya riwayat progress di hari itu, jadi dihitung dikerjakan.
    expect(within(tertunda).queryByText('Cari 10 jurnal rujukan')).not.toBeInTheDocument()
  })

  test('ceklis instan dan Tambah ke hari ini dari Belum selesai', async () => {
    const { user } = await masukLalu('/todo')
    const centang = await screen.findByRole('checkbox', { name: 'Tandai Kirim revisi bab 2 dikerjakan' })
    expect(centang).toHaveAttribute('aria-checked', 'false')
    await user.click(centang)
    expect(centang).toHaveAttribute('aria-checked', 'true')

    const tertunda = screen.getByRole('complementary', { name: 'Belum selesai' })
    await user.click(within(tertunda).getByRole('button', { name: 'Tambah ke hari ini' }))
    await waitFor(() => expect(within(tertunda).queryByText('Kemas buku')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Kemas buku' })).toBeInTheDocument()
  })

  test('blok yang bentrok dengan blok lain tidak bisa disimpan', async () => {
    const { user } = await masukLalu('/todo')
    await user.click(await screen.findByRole('button', { name: 'Beri jam' }))
    const form = await screen.findByRole('dialog', { name: 'Tambah blok jam' })
    await user.selectOptions(within(form).getByLabelText('Mulai'), '14.00')
    await user.selectOptions(within(form).getByLabelText('Selesai'), '14.30')
    expect(within(form).getByText(/Bentrok dengan blok lain \(13\.00–15\.00\)/)).toBeInTheDocument()

    await user.selectOptions(within(form).getByLabelText('Mulai'), '21.00')
    await user.selectOptions(within(form).getByLabelText('Selesai'), '22.00')
    await user.click(within(form).getByRole('button', { name: 'Simpan blok' }))
    expect(await screen.findByRole('button', { name: 'Ubah blok 21.00 sampai 22.00' })).toBeInTheDocument()
  })

  test('tambah ke to-do dari baris task memakai pilihan hari', async () => {
    const { user, router } = await masukLalu('/task')
    const baris = (await screen.findByRole('button', { name: 'Beli tinta printer' })).closest('li') as HTMLElement
    await user.click(within(baris).getByRole('button', { name: 'To-do' }))
    const dialog = await screen.findByRole('dialog', { name: 'Tambah ke to-do' })
    await user.click(within(dialog).getByRole('button', { name: /Hari ini/ }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))

    await router.navigate('/todo')
    expect(await screen.findByRole('button', { name: 'Beli tinta printer' })).toBeInTheDocument()
  })

  test('panel penyusunan: tambah banyak task ke satu hari lalu taruh blok jam', async () => {
    const { user } = await masukLalu('/todo')
    await user.click(await screen.findByRole('button', { name: 'Susun to-do' }))
    const panel = await screen.findByRole('dialog', { name: 'Susun to-do' })

    const hari = within(panel).getAllByRole('button', { pressed: false }).filter((b) => /entri$/.test(b.getAttribute('aria-label') ?? ''))
    const besok = hari[0]
    if (!besok) throw new Error('hari besok tidak ada')
    await user.click(besok)

    const belum = within(panel).getByRole('region', { name: /^Belum ada di/ })
    const centang = within(belum).getAllByRole('checkbox').slice(0, 2)
    const nama = centang.map((c) => c.closest('label')?.querySelector('.font-semibold')?.textContent ?? '')
    for (const c of centang) await user.click(c)
    await user.click(within(panel).getByRole('button', { name: /^Tambahkan 2 task ke/ }))

    const sudah = within(panel).getByRole('region', { name: /^Sudah ada/ })
    expect(await within(panel).findByText(/^2 task ditambahkan ke/)).toBeInTheDocument()
    const baris = within(sudah).getByText(nama[0] ?? '').closest('li')
    if (!baris) throw new Error('baris entri tidak ada')
    await user.click(within(baris).getByRole('button', { name: /Beri jam|Tambah blok/ }))
    await user.selectOptions(within(panel).getByLabelText(/^Mulai blok/), '21.00')
    await user.click(within(panel).getByRole('button', { name: 'Taruh blok' }))
    expect(await within(panel).findByText(/Blok 21\.00–22\.00 untuk/)).toBeInTheDocument()
    expect(within(baris).getByText('21.00–22.00')).toBeInTheDocument()
  })
})
