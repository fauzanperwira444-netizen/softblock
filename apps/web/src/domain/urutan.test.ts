import { bandingkanTaskAktif, nDariM } from './status'

type T = Parameters<typeof bandingkanTaskAktif>[0]

const t = (nama: string, deadline_tanggal: string | null, deadline_menit: number | null, kesulitan: T['kesulitan']): T => ({
  nama,
  deadline_tanggal,
  deadline_menit,
  kesulitan,
})

test('urutan D-04: tanggal, jam (tanpa jam = 23.59), kesulitan, abjad, tanpa deadline paling bawah', () => {
  const daftar = [
    t('Tanpa deadline sulit', null, null, 5),
    t('Besok tanpa jam', '2026-11-19', null, 1),
    t('Besok pagi', '2026-11-19', 480, 4),
    t('Tanpa deadline mudah', null, null, 1),
    t('Hari ini b', '2026-11-18', 600, 2),
    t('Hari ini a', '2026-11-18', 600, 2),
    t('Hari ini mudah', '2026-11-18', 600, 1),
  ]
  expect(daftar.sort(bandingkanTaskAktif).map((x) => x.nama)).toEqual([
    'Hari ini mudah',
    'Hari ini a',
    'Hari ini b',
    'Besok pagi',
    'Besok tanpa jam',
    'Tanpa deadline mudah',
    'Tanpa deadline sulit',
  ])
})

test('N dari M tidak menghitung task batal', () => {
  expect(
    nDariM([
      { progress: 10, batal: false },
      { progress: 4, batal: false },
      { progress: 10, batal: true },
    ]),
  ).toEqual({ n: 1, m: 2 })
})
