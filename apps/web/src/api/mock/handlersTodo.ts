import { delay, http, HttpResponse } from 'msw'
import { taskAktif } from '../../domain/status'
import { waktuLokal } from '../../domain/tanggal'
import { validasiBlok, type DataJadwal } from '../../domain/todo'
import type { BlokJam, EntriTodo } from '../../domain/tipe'
import { galatMock, transaksi, type Transaksi } from './db'
import { AKUN_BERDATA, klienUsang, penggunaAktif } from './handlers'

/* Handler modul To-do untuk mode mock: entri, ceklis, dan blok jam (E-01..E-10). */

type Json = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const jam = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`

function tolak(pesan: string): never {
  galatMock(422, 'validasi_gagal', pesan, { rincian: {} })
}

function wajibEntri(tx: Transaksi, id: string): EntriTodo {
  return tx.ambil('entri_todo', id) ?? galatMock(404, 'tidak_ditemukan', 'Entri tidak ditemukan.')
}

function dataJadwal(tx: Transaksi): DataJadwal {
  return { jadwal: tx.semua('jadwal'), versi: tx.semua('jadwal_versi'), pengecualian: tx.semua('pengecualian') }
}

/** E-05: hari lewat membeku. */
function wajibBukanLewat(tanggal: string, hariIni: string) {
  if (tanggal < hariIni) tolak('Hari yang sudah lewat tidak bisa diubah.')
}

function cekBlok(tx: Transaksi, entri: EntriTodo, body: Json, hariIni: string, kecualiId: string | null) {
  const task = tx.ambil('task', entri.task_id) ?? galatMock(404, 'tidak_ditemukan', 'Task tidak ditemukan.')
  const isian = { mulai: Number(body.mulai_menit), selesai: Number(body.selesai_menit) }
  const { galat } = validasiBlok(isian, {
    tanggal: entri.tanggal,
    hariIni,
    task,
    blokLain: tx.semua('blok_jam'),
    jadwal: dataJadwal(tx),
    kecualiBlokId: kecualiId,
    formatJam: jam,
  })
  if (galat) galatMock(422, 'validasi_gagal', galat, { kolom: 'mulai_menit', rincian: { mulai_menit: galat } })
  return isian
}

type Ctx = { tx: Transaksi; body: Json; params: Record<string, string>; hariIni: string }

function ubah(kerja: (c: Ctx) => { id?: string } | void) {
  return async ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => {
    await delay(200)
    const akun = penggunaAktif()
    if (!akun) return HttpResponse.json({ kode: 'sesi_habis', pesan: 'Sesi habis. Masuk lagi.' }, { status: 401 })
    if (klienUsang()) return HttpResponse.json({ kode: 'klien_usang', pesan: 'Ada versi baru aplikasi.' }, { status: 409 })
    const body = (await request.json().catch(() => ({}))) as Json
    const { tanggal } = waktuLokal(new Date(), akun.zona_waktu)
    const p = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    return transaksi(akun.id, akun.zona_waktu, AKUN_BERDATA.has(akun.email), request.headers.get('If-Match'), (tx) =>
      kerja({ tx, body, params: p, hariIni: tanggal }),
    )
  }
}

export const handlersTodo = [
  http.post(
    '/api/entri',
    ubah(({ tx, body, hariIni }) => {
      const id = str(body.id) || crypto.randomUUID()
      // Id buatan klien: permintaan ulang untuk entri yang sudah tersimpan dianggap berhasil (7.6).
      if (tx.ambil('entri_todo', id)) return { id }
      const tanggal = str(body.tanggal)
      wajibBukanLewat(tanggal, hariIni)
      const task = tx.ambil('task', str(body.task_id)) ?? galatMock(404, 'tidak_ditemukan', 'Task tidak ditemukan.')
      if (!taskAktif(task)) tolak('Hanya task aktif yang bisa ditambahkan ke to-do.')
      if (tx.semua('entri_todo').some((e) => e.task_id === task.id && e.tanggal === tanggal)) tolak('Task ini sudah ada di to-do hari itu.')
      tx.tulis('entri_todo', { id, task_id: task.id, tanggal, ceklis: false })
      return { id }
    }),
  ),

  http.delete(
    '/api/entri/:id',
    ubah(({ tx, params, hariIni }) => {
      const e = wajibEntri(tx, params.id ?? '')
      wajibBukanLewat(e.tanggal, hariIni)
      for (const b of tx.semua('blok_jam')) if (b.entri_id === e.id) tx.hapus('blok_jam', b.id)
      tx.hapus('entri_todo', e.id)
    }),
  ),

  http.put(
    '/api/entri/:id/ceklis',
    ubah(({ tx, body, params, hariIni }) => {
      const e = wajibEntri(tx, params.id ?? '')
      wajibBukanLewat(e.tanggal, hariIni)
      tx.tulis('entri_todo', { ...e, ceklis: body.ceklis === true })
    }),
  ),

  http.post(
    '/api/entri/:id/blok',
    ubah(({ tx, body, params, hariIni }) => {
      const e = wajibEntri(tx, params.id ?? '')
      const { mulai, selesai } = cekBlok(tx, e, body, hariIni, null)
      const id = crypto.randomUUID()
      tx.tulis('blok_jam', { id, entri_id: e.id, tanggal: e.tanggal, mulai_menit: mulai, selesai_menit: selesai })
      return { id }
    }),
  ),

  http.patch(
    '/api/blok/:id',
    ubah(({ tx, body, params, hariIni }) => {
      const b: BlokJam = tx.ambil('blok_jam', params.id ?? '') ?? galatMock(404, 'tidak_ditemukan', 'Blok tidak ditemukan.')
      const { mulai, selesai } = cekBlok(tx, wajibEntri(tx, b.entri_id), body, hariIni, b.id)
      tx.tulis('blok_jam', { ...b, mulai_menit: mulai, selesai_menit: selesai })
    }),
  ),

  http.delete(
    '/api/blok/:id',
    ubah(({ tx, params, hariIni }) => {
      const b: BlokJam = tx.ambil('blok_jam', params.id ?? '') ?? galatMock(404, 'tidak_ditemukan', 'Blok tidak ditemukan.')
      wajibBukanLewat(b.tanggal, hariIni)
      tx.hapus('blok_jam', b.id)
    }),
  ),
]
