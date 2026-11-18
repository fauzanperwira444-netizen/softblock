import { expect, type Page } from '@playwright/test'
import { AKUN_CONTOH } from '../src/api/mock/seed.ts'

/** Masuk dengan akun contoh mock; setiap tes memulai dari penyimpanan browser yang bersih. */
export async function masuk(page: Page, ke = '/') {
  await page.goto(ke === '/' ? '/masuk' : `/masuk?ke=${encodeURIComponent(ke)}`)
  await page.getByLabel('Email').fill(AKUN_CONTOH.email)
  await page.getByLabel('Password', { exact: true }).fill(AKUN_CONTOH.password)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page.getByRole('main')).toBeVisible()
}
