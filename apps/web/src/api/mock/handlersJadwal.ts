import { delay, http, HttpResponse } from 'msw'
import { pernahBerlaku, validasiJadwal, versiDariIsian, versiTerakhir, type IsianJadwal } from '../../domain/jadwal'
import { tambahHari, waktuLokal } from '../../domain/tanggal'
import type { Jadwal } from '../../domain/tipe'
import { galatMock, transaksi, type Transaksi } from './db'
import { AKUN_BERDATA, penggunaAktif } from './handlers'

/* Handler modul Jadwal untuk mode mock: versi berlaku, akhiri, hapus, dan pengecualian (F-01..F-09). */

type Json = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')

function tolak(pesan: string): never {
  galatMock(422, 'validasi_gagal', pesan, { rincian: {} })
}

function isianDari(body: Json): IsianJadwal {
  return {
    nama: str(body.nama).trim(),
    mulai: Number(body.mulai),
    selesai: Number(body.selesai),
    sekaliJalan: body.sekaliJalan === true,
    hari: Array.isArray(body.hari) ? body.hari.map(Number) : [],
    tanggal: str(body.tanggal),
    berakhir: body.berakhir ? str(body.berakhir) : null,
  }
}

function cekIsian(isian: IsianJadwal, hariIni: string) {
  const g = validasiJadwal(isian, hariIni)
  if (Object.keys(g).length > 0) galatMock(422, 'validasi_gagal', 'Periksa lagi isian yang ditandai.', { kolom: Object.keys(g)[0], rincian: g })
}

function wajibJadwal(tx: Transaksi, id: string): Jadwal {
  return tx.ambil('jadwal', id) ?? galatMock(404, 'tidak_ditemukan', 'Jadwal tidak ditemukan.')
}

type Ctx = { tx: Transaksi; body: Json; params: Record<string, string>; hariIni: string }

function ubah(kerja: (c: Ctx) => { id?: string } | void) {
  return async ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => {
    await delay(250)
    const akun = penggunaAktif()
    if (!akun) return HttpResponse.json({ kode: 'sesi_habis', pesan: 'Sesi habis. Masuk lagi.' }, { status: 401 })
    const body = (await request.json().catch(() => ({}))) as Json
    const { tanggal } = waktuLokal(new Date(), akun.zona_waktu)
    const p = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    return transaksi(akun.id, akun.zona_waktu, AKUN_BERDATA.has(akun.email), request.headers.get('If-Match'), (tx) =>
      kerja({ tx, body, params: p, hariIni: tanggal }),
    )
  }
}

export const handlersJadwal = [
  http.post(
    '/api/jadwal',
    ubah(({ tx, body, hariIni }) => {
      const isian = isianDari(body)
      cekIsian(isian, hariIni)
      const id = crypto.randomUUID()
      tx.tulis('jadwal', { id, nama: isian.nama })
      tx.tulis('jadwal_versi', { id: crypto.randomUUID(), jadwal_id: id, ...versiDariIsian(isian) })
      return { id }
    }),
  ),

  http.patch(
    '/api/jadwal/:id',
    ubah(({ tx, body, params, hariIni }) => {
      const j = wajibJadwal(tx, params.id ?? '')
      const isian = isianDari(body)
      cekIsian(isian, hariIni)
      const versi = tx.semua('jadwal_versi').filter((v) => v.jadwal_id === j.id)
      tx.tulis('jadwal', { ...j, nama: isian.nama })
      if (!pernahBerlaku(versi, j.id, hariIni)) {
        // Belum pernah berlaku: ganti semua versi dengan versi baru (diedit langsung).
        for (const v of versi) tx.hapus('jadwal_versi', v.id)
      } else {
        // Pernah berlaku: versi yang masih berlaku berakhir sehari sebelum tanggal berlaku versi baru.
        const potong = tambahHari(isian.tanggal, -1)
        for (const v of versi) {
          if (v.berlaku_mulai >= isian.tanggal) tx.hapus('jadwal_versi', v.id)
          else if (v.berlaku_akhir === null || v.berlaku_akhir > potong) tx.tulis('jadwal_versi', { ...v, berlaku_akhir: potong })
        }
      }
      tx.tulis('jadwal_versi', { id: crypto.randomUUID(), jadwal_id: j.id, ...versiDariIsian(isian) })
    }),
  ),

  http.post(
    '/api/jadwal/:id/akhiri',
    ubah(({ tx, body, params, hariIni }) => {
      const j = wajibJadwal(tx, params.id ?? '')
      const tanggal = str(body.tanggal) || hariIni
      if (tanggal < hariIni) tolak('Tanggal berakhir harus hari ini atau setelahnya.')
      const v = versiTerakhir(tx.semua('jadwal_versi'), j.id) ?? tolak('Jadwal tidak punya versi.')
      if (v.sekali_jalan) tolak('Jadwal sekali jalan tidak perlu diakhiri; hapus saja.')
      if (tanggal < v.berlaku_mulai) tolak('Tanggal berakhir sebelum versi terakhir mulai berlaku.')
      tx.tulis('jadwal_versi', { ...v, berlaku_akhir: tanggal })
    }),
  ),

  http.delete(
    '/api/jadwal/:id',
    ubah(({ tx, params, hariIni }) => {
      const j = wajibJadwal(tx, params.id ?? '')
      const versi = tx.semua('jadwal_versi').filter((v) => v.jadwal_id === j.id)
      if (pernahBerlaku(versi, j.id, hariIni)) tolak('Jadwal yang pernah berlaku tidak bisa dihapus. Pakai Akhiri.')
      for (const v of versi) tx.hapus('jadwal_versi', v.id)
      for (const p of tx.semua('pengecualian')) if (p.jadwal_id === j.id) tx.hapus('pengecualian', p.id)
      tx.hapus('jadwal', j.id)
    }),
  ),

  http.post(
    '/api/pengecualian',
    ubah(({ tx, body, hariIni }) => {
      const mulai = str(body.mulai)
      const akhir = str(body.akhir)
      const rincian: Record<string, string> = {}
      if (!mulai) rincian.mulai = 'Tanggal awal wajib diisi.'
      else if (mulai < hariIni) rincian.mulai = 'Tanggal awal harus hari ini atau setelahnya.'
      if (!akhir) rincian.akhir = 'Tanggal akhir wajib diisi.'
      else if (mulai && akhir < mulai) rincian.akhir = 'Tanggal akhir harus pada atau setelah tanggal awal.'
      if (Object.keys(rincian).length > 0) galatMock(422, 'validasi_gagal', 'Periksa lagi rentang tanggal.', { kolom: Object.keys(rincian)[0], rincian })
      const jadwalId = body.jadwal_id ? str(body.jadwal_id) : null
      if (jadwalId) wajibJadwal(tx, jadwalId)
      const id = crypto.randomUUID()
      tx.tulis('pengecualian', { id, jadwal_id: jadwalId, mulai, akhir, keterangan: str(body.keterangan).slice(0, 100) })
      return { id }
    }),
  ),

  http.delete(
    '/api/pengecualian/:id',
    ubah(({ tx, params }) => {
      const p = tx.ambil('pengecualian', params.id ?? '') ?? galatMock(404, 'tidak_ditemukan', 'Pengecualian tidak ditemukan.')
      tx.hapus('pengecualian', p.id)
    }),
  ),
]
