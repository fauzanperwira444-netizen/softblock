import { expect, test } from '@playwright/test'
import { masuk } from './bantu.ts'

test('masuk membuka Dashboard dengan bagian Sekarang', async ({ page }) => {
  await masuk(page)
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Telat/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Jam kosong hari ini' })).toBeVisible()
})

test('tambah task mandiri lalu muncul di Daftar Task', async ({ page }) => {
  await masuk(page, '/task')
  await page.getByRole('button', { name: 'Tambah task' }).first().click()
  const form = page.getByRole('dialog', { name: 'Tambah task' })
  await form.getByRole('radio', { name: 'Mandiri' }).click()
  await form.getByLabel('Atau label baru').fill('Belanja')
  await form.getByLabel(/Nama task/).fill('Beli sabun')
  await form.getByRole('button', { name: 'Simpan task' }).click()
  await expect(form).toBeHidden()
  await expect(page.getByRole('button', { name: 'Beli sabun', exact: true })).toBeVisible()
})

test('selesaikan task dari baris lalu tampil di filter Selesai', async ({ page }) => {
  await masuk(page, '/task')
  const nama = 'Beli tinta printer'
  const baris = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: nama, exact: true }) })
  await baris.getByRole('button', { name: 'Selesai', exact: true }).click()
  await expect(page.getByRole('button', { name: nama, exact: true })).toBeHidden()

  await page.getByRole('group', { name: 'Filter status' }).getByRole('button', { name: 'Selesai', exact: true }).click()
  await expect(page.getByRole('button', { name: nama, exact: true })).toBeVisible()
})
