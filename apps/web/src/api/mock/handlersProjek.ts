import { delay, http, HttpResponse } from 'msw'
import {
  dampakBatalProjek,
  dampakBatalSesi,
  dampakHapusSesi,
  dampakSama,
  dampakSelesaiDini,
  dampakUbahPeriode,
  DESKRIPSI_MAX,
  DOKUMEN_MAX,
  hitungStatusProjek,
  PALET_PROJEK,
  rapikanUrl,
  syaratBatalProjek,
  syaratBatalSesi,
  syaratBukaKembali,
  syaratHapusProjek,
  syaratHapusSesi,
  syaratSelesaiDini,
  syaratUbahPeriode,
  validasiNamaProjek,
  validasiSesi,
  warnaTerpakai,
  type Dampak,
  type DataProjek,
  type IsianSesi,
} from '../../domain/projek'
import { projekTertutup } from '../../domain/status'
import { waktuLokal } from '../../domain/tanggal'
import type { Projek, Sesi } from '../../domain/tipe'
import { galatMock, transaksi, type Transaksi } from './db'
import { AKUN_BERDATA, klienUsang, penggunaAktif } from './handlers'

/*
  Handler modul Projek untuk mode mock. Memakai aturan domain TypeScript yang sama
  sebagai pengganti domain PHP, termasuk pemeriksaan ulang dampak (AD-4).
*/

type Json = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')

function rentangTeks(a: string, b: string) {
  return a === b ? a : `${a} – ${b}`
}

function validasiGagal(rincian: Record<string, string>): never {
  galatMock(422, 'validasi_gagal', 'Periksa lagi isian yang ditandai.', { kolom: Object.keys(rincian)[0], rincian })
}

function dataDari(tx: Transaksi): DataProjek {
  return { projek: tx.semua('projek'), sesi: tx.semua('sesi'), task: tx.semua('task'), label: tx.semua('label_mandiri') }
}

function wajibProjek(tx: Transaksi, id: string): Projek {
  return tx.ambil('projek', id) ?? galatMock(404, 'tidak_ditemukan', 'Projek tidak ditemukan.')
}

function wajibSesi(tx: Transaksi, id: string): Sesi {
  return tx.ambil('sesi', id) ?? galatMock(404, 'tidak_ditemukan', 'Sesi tidak ditemukan.')
}

function tolakBila(syarat: string | null) {
  if (syarat) galatMock(422, 'validasi_gagal', syarat, { rincian: {} })
}

function wajibTerbuka(data: DataProjek, projek: Projek, hariIni: string) {
  if (projekTertutup(hitungStatusProjek(data, projek, hariIni))) {
    galatMock(422, 'validasi_gagal', 'Projek tertutup terkunci. Buka kembali dulu.', { rincian: {} })
  }
}

/** Server menghitung ulang dampak dan menolak dengan 409 bila berbeda dari kiriman klien. */
function cocokkanDampak(dikirim: unknown, terkini: Dampak) {
  if (!dikirim || !dampakSama(dikirim as Dampak, terkini)) {
    galatMock(409, 'dampak_berubah', 'Dampak aksi berubah karena data berubah di perangkat lain.', { dampak: terkini })
  }
}

function terapkanDampak(tx: Transaksi, d: Dampak, hariIni: string) {
  for (const id of d.task_batal) {
    const t = tx.ambil('task', id)
    if (!t) continue
    tx.tulis('task', { ...t, batal: true, dibatalkan_pada: new Date().toISOString(), dibatalkan_tanggal_lokal: hariIni })
    // E-08: entri hari ini tetap, entri mendatang dihapus.
    for (const e of tx.semua('entri_todo')) if (e.task_id === id && e.tanggal > hariIni) tx.hapus('entri_todo', e.id)
  }
  for (const id of d.sesi_batal) {
    const s = tx.ambil('sesi', id)
    if (s) tx.tulis('sesi', { ...s, batal: true })
  }
  for (const { id, akhir_baru } of d.sesi_dipotong) {
    const s = tx.ambil('sesi', id)
    if (s) tx.tulis('sesi', { ...s, akhir: akhir_baru })
  }
  for (const id of d.sesi_dihapus) tx.hapus('sesi', id)
}

function validasiIsianSesi(body: Json): IsianSesi {
  return { nama: str(body.nama).trim(), mulai: str(body.mulai), akhir: str(body.akhir), deskripsi: str(body.deskripsi) }
}

type Ctx = { tx: Transaksi; body: Json; params: Record<string, string>; hariIni: string }

/** Bungkus handler pengubah: autentikasi, latensi kecil, transaksi dengan If-Match. */
function ubah(kerja: (c: Ctx) => { id?: string } | void) {
  return async ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => {
    await delay(250)
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

function cekIsianProjek(body: Json, data: DataProjek, hariIni: string, kecualiId: string | null, wajibWarna: boolean) {
  const rincian: Record<string, string> = {}
  if (body.nama !== undefined) {
    const g = validasiNamaProjek(str(body.nama), data, kecualiId)
    if (g) rincian.nama = g
  }
  if (str(body.deskripsi).length > DESKRIPSI_MAX) rincian.deskripsi = `Deskripsi maksimal ${DESKRIPSI_MAX} karakter.`
  if (body.warna !== undefined || wajibWarna) {
    const w = str(body.warna).toLowerCase()
    if (!(PALET_PROJEK as readonly string[]).includes(w)) rincian.warna = 'Pilih warna dari palet.'
    else if (warnaTerpakai(data, hariIni, kecualiId).has(w)) rincian.warna = 'Warna ini dipakai projek lain yang belum tertutup.'
  }
  if (Object.keys(rincian).length > 0) validasiGagal(rincian)
}

export const handlersProjek = [
  http.post(
    '/api/projek',
    ubah(({ tx, body, hariIni }) => {
      cekIsianProjek(body, dataDari(tx), hariIni, null, true)
      const id = crypto.randomUUID()
      tx.tulis('projek', { id, nama: str(body.nama).trim(), deskripsi: str(body.deskripsi), warna: str(body.warna).toLowerCase(), batal: false })
      return { id }
    }),
  ),

  http.patch(
    '/api/projek/:id',
    ubah(({ tx, body, params, hariIni }) => {
      const p = wajibProjek(tx, params.id ?? '')
      const data = dataDari(tx)
      wajibTerbuka(data, p, hariIni)
      cekIsianProjek(body, data, hariIni, p.id, false)
      tx.tulis('projek', {
        ...p,
        ...(body.nama !== undefined ? { nama: str(body.nama).trim() } : {}),
        ...(body.deskripsi !== undefined ? { deskripsi: str(body.deskripsi) } : {}),
        ...(body.warna !== undefined ? { warna: str(body.warna).toLowerCase() } : {}),
      })
    }),
  ),

  http.delete(
    '/api/projek/:id',
    ubah(({ tx, params }) => {
      const p = wajibProjek(tx, params.id ?? '')
      tolakBila(syaratHapusProjek(dataDari(tx), p))
      for (const d of tx.semua('dokumen')) if (d.projek_id === p.id) tx.hapus('dokumen', d.id)
      tx.hapus('projek', p.id)
    }),
  ),

  http.post(
    '/api/projek/:id/selesai-dini',
    ubah(({ tx, body, params, hariIni }) => {
      const p = wajibProjek(tx, params.id ?? '')
      const data = dataDari(tx)
      tolakBila(syaratSelesaiDini(data, p, hariIni))
      const d = dampakSelesaiDini(data, p, hariIni)
      cocokkanDampak(body.dampak, d)
      terapkanDampak(tx, d, hariIni)
    }),
  ),

  http.post(
    '/api/projek/:id/batal',
    ubah(({ tx, body, params, hariIni }) => {
      const p = wajibProjek(tx, params.id ?? '')
      const data = dataDari(tx)
      tolakBila(syaratBatalProjek(data, p, hariIni))
      const d = dampakBatalProjek(data, p, hariIni)
      cocokkanDampak(body.dampak, d)
      terapkanDampak(tx, d, hariIni)
      if (d.projek_menjadi === 'dihapus') {
        for (const s of tx.semua('sesi')) if (s.projek_id === p.id) tx.hapus('sesi', s.id)
        for (const dok of tx.semua('dokumen')) if (dok.projek_id === p.id) tx.hapus('dokumen', dok.id)
        tx.hapus('projek', p.id)
      } else {
        tx.tulis('projek', { ...p, batal: true })
      }
    }),
  ),

  http.post(
    '/api/projek/:id/buka-kembali',
    ubah(({ tx, body, params, hariIni }) => {
      const p = wajibProjek(tx, params.id ?? '')
      const data = dataDari(tx)
      tolakBila(syaratBukaKembali(data, p, hariIni))
      const isian = validasiIsianSesi((body.sesi ?? {}) as Json)
      const sesiP = data.sesi.filter((s) => s.projek_id === p.id)
      const g = validasiSesi(isian, sesiP, hariIni, { kecualiId: null, periodeBerubah: true }, rentangTeks)
      const warna = body.warna ? str(body.warna).toLowerCase() : p.warna
      if (warnaTerpakai(data, hariIni, p.id).has(warna)) g.umum = g.umum ?? 'Warna lama sedang dipakai projek lain. Pilih warna baru.'
      if (Object.keys(g).length > 0) validasiGagal(g as Record<string, string>)
      tx.tulis('projek', { ...p, batal: false, warna })
      tx.tulis('sesi', { id: crypto.randomUUID(), projek_id: p.id, ...isian, batal: false })
    }),
  ),

  http.post(
    '/api/projek/:id/dokumen',
    ubah(({ tx, body, params, hariIni }) => {
      const p = wajibProjek(tx, params.id ?? '')
      wajibTerbuka(dataDari(tx), p, hariIni)
      const jumlah = tx.semua('dokumen').filter((d) => d.projek_id === p.id).length
      if (jumlah >= DOKUMEN_MAX) galatMock(422, 'validasi_gagal', `Maksimal ${DOKUMEN_MAX} dokumen per projek.`, { rincian: {} })
      const url = rapikanUrl(str(body.url))
      const rincian: Record<string, string> = {}
      if (!str(body.nama).trim()) rincian.nama = 'Nama dokumen wajib diisi.'
      if (!url) rincian.url = 'Tautan harus berupa alamat web yang valid (http atau https).'
      if (Object.keys(rincian).length > 0) validasiGagal(rincian)
      tx.tulis('dokumen', { id: crypto.randomUUID(), projek_id: p.id, nama: str(body.nama).trim(), url: url ?? '' })
    }),
  ),

  http.patch(
    '/api/dokumen/:id',
    ubah(({ tx, body, params, hariIni }) => {
      const d = tx.ambil('dokumen', params.id ?? '') ?? galatMock(404, 'tidak_ditemukan', 'Dokumen tidak ditemukan.')
      wajibTerbuka(dataDari(tx), wajibProjek(tx, d.projek_id), hariIni)
      const url = rapikanUrl(str(body.url))
      const rincian: Record<string, string> = {}
      if (!str(body.nama).trim()) rincian.nama = 'Nama dokumen wajib diisi.'
      if (!url) rincian.url = 'Tautan harus berupa alamat web yang valid (http atau https).'
      if (Object.keys(rincian).length > 0) validasiGagal(rincian)
      tx.tulis('dokumen', { ...d, nama: str(body.nama).trim(), url: url ?? '' })
    }),
  ),

  http.delete(
    '/api/dokumen/:id',
    ubah(({ tx, params, hariIni }) => {
      const d = tx.ambil('dokumen', params.id ?? '') ?? galatMock(404, 'tidak_ditemukan', 'Dokumen tidak ditemukan.')
      wajibTerbuka(dataDari(tx), wajibProjek(tx, d.projek_id), hariIni)
      tx.hapus('dokumen', d.id)
    }),
  ),

  http.post(
    '/api/projek/:id/sesi',
    ubah(({ tx, body, params, hariIni }) => {
      const p = wajibProjek(tx, params.id ?? '')
      const data = dataDari(tx)
      wajibTerbuka(data, p, hariIni)
      const isian = validasiIsianSesi(body)
      const g = validasiSesi(isian, data.sesi.filter((s) => s.projek_id === p.id), hariIni, { kecualiId: null, periodeBerubah: true }, rentangTeks)
      if (Object.keys(g).length > 0) validasiGagal(g as Record<string, string>)
      const id = crypto.randomUUID()
      tx.tulis('sesi', { id, projek_id: p.id, ...isian, batal: false })
      return { id }
    }),
  ),

  http.patch(
    '/api/sesi/:id',
    ubah(({ tx, body, params, hariIni }) => {
      const s = wajibSesi(tx, params.id ?? '')
      const p = wajibProjek(tx, s.projek_id)
      const data = dataDari(tx)
      wajibTerbuka(data, p, hariIni)
      if (s.batal) galatMock(422, 'validasi_gagal', 'Sesi batal hanya bisa dilihat.', { rincian: {} })
      const isian = validasiIsianSesi(body)
      const periodeBerubah = isian.mulai !== s.mulai || isian.akhir !== s.akhir
      if (periodeBerubah) tolakBila(syaratUbahPeriode(s, hariIni))
      const sesiP = data.sesi.filter((x) => x.projek_id === p.id)
      const g = validasiSesi(isian, sesiP, hariIni, { kecualiId: s.id, periodeBerubah }, rentangTeks)
      if (Object.keys(g).length > 0) validasiGagal(g as Record<string, string>)
      if (periodeBerubah) {
        const d = dampakUbahPeriode(data, p, s, isian.mulai, isian.akhir, hariIni)
        const butuh = d.task_di_luar_periode.length > 0 || d.projek_menjadi === 'selesai'
        if (butuh) cocokkanDampak(body.dampak, d)
        terapkanDampak(tx, d, hariIni)
      }
      tx.tulis('sesi', { ...s, ...isian })
    }),
  ),

  http.post(
    '/api/sesi/:id/batal',
    ubah(({ tx, body, params, hariIni }) => {
      const s = wajibSesi(tx, params.id ?? '')
      const p = wajibProjek(tx, s.projek_id)
      const data = dataDari(tx)
      wajibTerbuka(data, p, hariIni)
      tolakBila(syaratBatalSesi(s, hariIni))
      const d = dampakBatalSesi(data, p, s, hariIni)
      cocokkanDampak(body.dampak, d)
      terapkanDampak(tx, d, hariIni)
    }),
  ),

  http.delete(
    '/api/sesi/:id',
    ubah(({ tx, body, params, hariIni }) => {
      const s = wajibSesi(tx, params.id ?? '')
      const p = wajibProjek(tx, s.projek_id)
      const data = dataDari(tx)
      wajibTerbuka(data, p, hariIni)
      tolakBila(syaratHapusSesi(data, s, hariIni))
      const d = dampakHapusSesi(data, p, s, hariIni)
      cocokkanDampak(body.dampak, d)
      terapkanDampak(tx, d, hariIni)
    }),
  ),
]
