import { formatDataPer, formatJam, formatTanggal } from './format'

test('format tanggal dan jam Indonesia', () => {
  expect(formatTanggal('2026-11-18')).toBe('18 Nov 2026')
  expect(formatTanggal('2026-05-02')).toBe('2 Mei 2026')
  expect(formatJam(13 * 60 + 5)).toBe('13.05')
  expect(formatJam(0)).toBe('00.00')
})

test('Data per: jam saja untuk hari ini, tanggal + jam untuk hari lain', () => {
  // 07.52 UTC = 14.52 WIB
  expect(formatDataPer('2026-11-18T07:52:00Z', 'Asia/Jakarta', '2026-11-18')).toBe('14.52')
  expect(formatDataPer('2026-11-17T15:10:00Z', 'Asia/Jakarta', '2026-11-18')).toBe('17 Nov 2026, 22.10')
})
