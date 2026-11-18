import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  dampakBatalProjek,
  dampakBatalSesi,
  dampakHapusSesi,
  dampakSelesaiDini,
  dampakUbahPeriode,
  rapikanUrl,
  validasiNamaProjek,
  validasiSesi,
  type Dampak,
  type DataProjek,
} from './projek'
import type { Projek, Sesi, Task } from './tipe'

type Kasus = {
  nama: string
  aksi: 'selesai_dini' | 'batal_projek' | 'batal_sesi' | 'ubah_periode' | 'hapus_sesi'
  today: string
  input: {
    projek_id: string
    sesi_id?: string
    rentang?: { mulai: string; akhir: string }
    projek: Array<Partial<Projek>>
    sesi: Array<Partial<Sesi>>
    task: Array<Partial<Task>>
  }
  expected: Dampak
}

const path = fileURLToPath(new URL('../../../../fixtures/dampak.json', import.meta.url))
const { kasus } = JSON.parse(readFileSync(path, 'utf8')) as { kasus: Kasus[] }

describe('dampak.json', () => {
  test.each(kasus)('$nama', ({ aksi, today, input, expected }) => {
    const data = { projek: input.projek, sesi: input.sesi, task: input.task, label: [] } as unknown as DataProjek
    const projek = data.projek.find((p) => p.id === input.projek_id) as Projek
    const sesi = data.sesi.find((s) => s.id === input.sesi_id) as Sesi
    const hasil =
      aksi === 'selesai_dini'
        ? dampakSelesaiDini(data, projek, today)
        : aksi === 'batal_projek'
          ? dampakBatalProjek(data, projek, today)
          : aksi === 'batal_sesi'
            ? dampakBatalSesi(data, projek, sesi, today)
            : aksi === 'hapus_sesi'
              ? dampakHapusSesi(data, projek, sesi, today)
              : dampakUbahPeriode(data, projek, sesi, input.rentang?.mulai ?? '', input.rentang?.akhir ?? '', today)
    expect(hasil).toEqual(expected)
  })
})

describe('validasi', () => {
  const data = {
    projek: [{ id: 'p1', nama: 'Skripsi' }],
    label: [{ id: 'l1', nama: 'Rumah' }],
  } as unknown as Pick<DataProjek, 'projek' | 'label'>

  test('nama projek: wajib, unik tanpa beda kapital, bukan label, bukan "Mandiri"', () => {
    expect(validasiNamaProjek('  ', data, null)).toMatch(/wajib/)
    expect(validasiNamaProjek(' skripsi ', data, null)).toMatch(/sudah dipakai/)
    expect(validasiNamaProjek('Skripsi', data, 'p1')).toBeNull()
    expect(validasiNamaProjek('RUMAH', data, null)).toMatch(/label mandiri/)
    expect(validasiNamaProjek('Mandiri', data, null)).toMatch(/Mandiri/)
    expect(validasiNamaProjek('x'.repeat(46), data, null)).toMatch(/45/)
  })

  test('sesi: tidak boleh bertumpuk dengan sesi non-batal; berbatasan diperbolehkan', () => {
    const lain = [
      { id: 's1', nama: 'Sesi 1', mulai: '2026-11-01', akhir: '2026-11-14', batal: false },
      { id: 's2', nama: 'Sesi lama', mulai: '2026-11-15', akhir: '2026-11-30', batal: true },
    ] as Sesi[]
    const fmt = (a: string, b: string) => `${a}..${b}`
    const opsi = { kecualiId: null, periodeBerubah: true }
    expect(validasiSesi({ nama: 'Sesi 2', mulai: '2026-11-15', akhir: '2026-11-30', deskripsi: '' }, lain, '2026-11-10', opsi, fmt)).toEqual({})
    expect(validasiSesi({ nama: 'Sesi 2', mulai: '2026-11-14', akhir: '2026-11-30', deskripsi: '' }, lain, '2026-11-10', opsi, fmt).umum).toMatch(/Sesi 1/)
    expect(validasiSesi({ nama: 'sesi 1', mulai: '2026-12-01', akhir: '2026-12-02', deskripsi: '' }, lain, '2026-11-10', opsi, fmt).nama).toMatch(/sudah dipakai/)
    expect(validasiSesi({ nama: 'Baru', mulai: '2026-11-01', akhir: '2026-11-05', deskripsi: '' }, [], '2026-11-10', opsi, fmt).akhir).toMatch(/hari ini/)
  })

  test('URL dokumen: skema https ditambahkan, selain http/https ditolak', () => {
    expect(rapikanUrl('docs.google.com/abc')).toBe('https://docs.google.com/abc')
    expect(rapikanUrl('http://contoh.id')).toBe('http://contoh.id/')
    expect(rapikanUrl('javascript:alert(1)')).toBeNull()
    expect(rapikanUrl('bukan url')).toBeNull()
  })
})
