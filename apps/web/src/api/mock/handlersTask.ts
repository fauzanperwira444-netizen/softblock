import { delay, http, HttpResponse } from 'msw'
import { dampakSama, type Dampak, type DataProjek } from '../../domain/projek'
import { PROGRESS_SELESAI, taskAktif } from '../../domain/status'
import {
  CATATAN_PROGRESS_MAX,
  dampakTask,
  namaBentrokBukaKembali,
  progressSebelumSelesai,
  sesiTujuan,
  syaratBukaKembaliTask,
  taskTerkunci,
  validasiNamaLabel,
  validasiTask,
  type IsianTask,
  type TujuanTask,
} from '../../domain/task'
import { waktuLokal } from '../../domain/tanggal'
import type { Task } from '../../domain/tipe'
import { galatMock, transaksi, type Transaksi } from './db'
import { AKUN_BERDATA, penggunaAktif } from './handlers'

/* Handler modul Task untuk mode mock, memakai aturan domain TS yang sama (pengganti domain PHP). */

type Json = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const angkaAtauNull = (v: unknown) => (typeof v === 'number' ? v : null)

function dataDari(tx: Transaksi): DataProjek {
  return { projek: tx.semua('projek'), sesi: tx.semua('sesi'), task: tx.semua('task'), label: tx.semua('label_mandiri') }
}

function validasiGagal(rincian: Record<string, string | undefined>): never {
  const bersih = Object.fromEntries(Object.entries(rincian).filter(([, v]) => v)) as Record<string, string>
  galatMock(422, 'validasi_gagal', 'Periksa lagi isian yang ditandai.', { kolom: Object.keys(bersih)[0], rincian: bersih })
}

function tolak(pesan: string | null) {
  if (pesan) galatMock(422, 'validasi_gagal', pesan, { rincian: {} })
}

function wajibTask(tx: Transaksi, id: string): Task {
  return tx.ambil('task', id) ?? galatMock(404, 'tidak_ditemukan', 'Task tidak ditemukan.')
}

/** Penutupan projek wajib membawa dampak yang sama dengan hitungan server (2.4, AD-4). */
function cekPenutupan(dikirim: unknown, terkini: Dampak | null) {
  if (!terkini) return
  if (!dikirim || !dampakSama(dikirim as Dampak, terkini)) {
    galatMock(409, 'dampak_berubah', 'Dampak aksi berubah karena data berubah di perangkat lain.', { dampak: terkini })
  }
}

function isianDari(body: Json): IsianTask {
  return {
    nama: str(body.nama).trim(),
    deskripsi: str(body.deskripsi),
    deadline_tanggal: str(body.deadline_tanggal),
    deadline_menit: angkaAtauNull(body.deadline_menit),
    kesulitan: Number(body.kesulitan),
  }
}

function tujuanDari(body: Json): TujuanTask {
  if (body.sesi_id) return { jenis: 'sesi', sesiId: str(body.sesi_id) }
  return { jenis: 'mandiri', labelId: body.label_id ? str(body.label_id) : null, labelBaru: str(body.label_baru) }
}

/** Mengembalikan id label; membuat label baru bila perlu, dan menandai terakhir dipakai. */
function siapkanLabel(tx: Transaksi, tujuan: TujuanTask): string | null {
  if (tujuan.jenis === 'sesi') return null
  const sekarang = new Date().toISOString()
  if (tujuan.labelId) {
    const l = tx.ambil('label_mandiri', tujuan.labelId) ?? galatMock(404, 'tidak_ditemukan', 'Label tidak ditemukan.')
    tx.tulis('label_mandiri', { ...l, terakhir_dipakai: sekarang })
    return l.id
  }
  // Mengetik nama label lama yang tanpa task memakai ulang label itu (C-03).
  const lama = tx.semua('label_mandiri').find((l) => l.nama.trim().toLowerCase() === tujuan.labelBaru.trim().toLowerCase())
  const id = lama?.id ?? crypto.randomUUID()
  tx.tulis('label_mandiri', { id, nama: lama?.nama ?? tujuan.labelBaru.trim(), terakhir_dipakai: sekarang })
  return id
}

type Ctx = { tx: Transaksi; body: Json; params: Record<string, string>; hariIni: string; menit: number }

function ubah(kerja: (c: Ctx) => { id?: string } | void) {
  return async ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => {
    await delay(250)
    const akun = penggunaAktif()
    if (!akun) return HttpResponse.json({ kode: 'sesi_habis', pesan: 'Sesi habis. Masuk lagi.' }, { status: 401 })
    const body = (await request.json().catch(() => ({}))) as Json
    const { tanggal, menit } = waktuLokal(new Date(), akun.zona_waktu)
    const p = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    return transaksi(akun.id, akun.zona_waktu, AKUN_BERDATA.has(akun.email), request.headers.get('If-Match'), (tx) =>
      kerja({ tx, body, params: p, hariIni: tanggal, menit }),
    )
  }
}

const formatTeks = (t: string) => t

function catatRiwayat(tx: Transaksi, task: Task, sesudah: number, deskripsi: string, hariIni: string, menit: number, penanda: 'selesai' | 'buka_kembali' | null) {
  tx.tulis('riwayat_progress', {
    id: crypto.randomUUID(),
    task_id: task.id,
    sebelum: task.progress,
    sesudah,
    deskripsi,
    penanda,
    tanggal_lokal: hariIni,
    menit_lokal: menit,
  })
}

/** E-08: saat task selesai atau batal, entri hari ini tetap dan entri mendatang dihapus. */
function hapusEntriMendatang(tx: Transaksi, taskId: string, hariIni: string) {
  for (const e of tx.semua('entri_todo')) if (e.task_id === taskId && e.tanggal > hariIni) tx.hapus('entri_todo', e.id)
}

/** E-06: progress berubah mencentang entri hari ini yang sudah ada, tanpa membuat entri baru. */
function centangEntriHariIni(tx: Transaksi, taskId: string, hariIni: string) {
  const e = tx.semua('entri_todo').find((x) => x.task_id === taskId && x.tanggal === hariIni)
  if (e && !e.ceklis) tx.tulis('entri_todo', { ...e, ceklis: true })
}

export const handlersTask = [
  http.post(
    '/api/task',
    ubah(({ tx, body, hariIni, menit }) => {
      const data = dataDari(tx)
      const tujuan = tujuanDari(body)
      const isian = isianDari(body)
      if (tujuan.jenis === 'sesi' && !sesiTujuan(data, hariIni).some((x) => x.sesi.id === tujuan.sesiId)) {
        validasiGagal({ tujuan: 'Sesi harus belum mulai atau berjalan di projek yang belum tertutup.' })
      }
      const g = validasiTask(isian, tujuan, { data, hariIni, menit, kecualiId: null, periksaDeadline: true, formatTanggal: formatTeks })
      if (Object.keys(g).length > 0) validasiGagal(g)
      const id = crypto.randomUUID()
      tx.tulis('task', {
        id,
        sesi_id: tujuan.jenis === 'sesi' ? tujuan.sesiId : null,
        label_id: siapkanLabel(tx, tujuan),
        nama: isian.nama,
        deskripsi: isian.deskripsi,
        deadline_tanggal: isian.deadline_tanggal || null,
        deadline_menit: isian.deadline_tanggal ? isian.deadline_menit : null,
        kesulitan: isian.kesulitan as Task['kesulitan'],
        progress: 0,
        batal: false,
        dibatalkan_pada: null,
        dibatalkan_tanggal_lokal: null,
        dibuat_tanggal_lokal: hariIni,
      })
      return { id }
    }),
  ),

  http.patch(
    '/api/task/:id',
    ubah(({ tx, body, params, hariIni, menit }) => {
      const t = wajibTask(tx, params.id ?? '')
      const data = dataDari(tx)
      if (!taskAktif(t)) tolak('Hanya task aktif yang bisa diubah.')
      tolak(taskTerkunci(data, t, hariIni))
      const isian = isianDari(body)
      const tujuan: TujuanTask = t.sesi_id ? { jenis: 'sesi', sesiId: t.sesi_id } : { jenis: 'mandiri', labelId: t.label_id, labelBaru: '' }
      const periksaDeadline = (isian.deadline_tanggal || null) !== t.deadline_tanggal || isian.deadline_menit !== t.deadline_menit
      const g = validasiTask(isian, tujuan, { data, hariIni, menit, kecualiId: t.id, periksaDeadline, formatTanggal: formatTeks })
      if (Object.keys(g).length > 0) validasiGagal(g)
      tx.tulis('task', {
        ...t,
        nama: isian.nama,
        deskripsi: isian.deskripsi,
        deadline_tanggal: isian.deadline_tanggal || null,
        deadline_menit: isian.deadline_tanggal ? isian.deadline_menit : null,
        kesulitan: isian.kesulitan as Task['kesulitan'],
      })
    }),
  ),

  http.post(
    '/api/task/:id/pindah',
    ubah(({ tx, body, params, hariIni, menit }) => {
      const t = wajibTask(tx, params.id ?? '')
      const data = dataDari(tx)
      if (!taskAktif(t)) tolak('Hanya task aktif yang bisa dipindahkan.')
      const tujuan = tujuanDari(body)
      if (tujuan.jenis === 'mandiri' && !t.sesi_id) tolak('Task mandiri tidak bisa dipindah ke label lain.')
      if (tujuan.jenis === 'sesi') {
        if (tujuan.sesiId === t.sesi_id) tolak('Pilih sesi yang berbeda.')
        if (!sesiTujuan(data, hariIni).some((x) => x.sesi.id === tujuan.sesiId)) tolak('Sesi tujuan harus belum mulai atau berjalan.')
      }
      const isian: IsianTask = {
        nama: t.nama,
        deskripsi: t.deskripsi,
        deadline_tanggal: str(body.deadline_tanggal),
        deadline_menit: angkaAtauNull(body.deadline_menit),
        kesulitan: t.kesulitan,
      }
      const g = validasiTask(isian, tujuan, { data, hariIni, menit, kecualiId: t.id, periksaDeadline: true, formatTanggal: formatTeks })
      if (Object.keys(g).length > 0) validasiGagal(g)
      const sesiBaru = tujuan.jenis === 'sesi' ? tujuan.sesiId : null
      cekPenutupan(body.dampak, dampakTask(data, t.id, { sesi_id: sesiBaru }, hariIni))
      tx.tulis('task', {
        ...t,
        sesi_id: sesiBaru,
        label_id: siapkanLabel(tx, tujuan),
        deadline_tanggal: isian.deadline_tanggal || null,
        deadline_menit: isian.deadline_tanggal ? isian.deadline_menit : null,
      })
    }),
  ),

  http.post(
    '/api/task/:id/progress',
    ubah(({ tx, body, params, hariIni, menit }) => {
      const t = wajibTask(tx, params.id ?? '')
      const data = dataDari(tx)
      if (!taskAktif(t)) tolak('Progress hanya untuk task aktif.')
      tolak(taskTerkunci(data, t, hariIni))
      const nilai = Number(body.nilai)
      const deskripsi = str(body.deskripsi)
      if (!Number.isInteger(nilai) || nilai < 0 || nilai > PROGRESS_SELESAI) validasiGagal({ nilai: 'Progress harus bilangan bulat 0 sampai 10.' })
      if (nilai === t.progress) validasiGagal({ nilai: 'Nilai baru harus berbeda dari nilai sekarang.' })
      if (deskripsi.length > CATATAN_PROGRESS_MAX) validasiGagal({ deskripsi: `Catatan maksimal ${CATATAN_PROGRESS_MAX} karakter.` })
      cekPenutupan(body.dampak, nilai === PROGRESS_SELESAI ? dampakTask(data, t.id, { progress: nilai }, hariIni) : null)
      const selesai = nilai === PROGRESS_SELESAI
      catatRiwayat(tx, t, nilai, deskripsi, hariIni, menit, selesai ? 'selesai' : null)
      tx.tulis('task', { ...t, progress: nilai })
      centangEntriHariIni(tx, t.id, hariIni)
      if (selesai) hapusEntriMendatang(tx, t.id, hariIni)
    }),
  ),

  http.post(
    '/api/task/:id/batal',
    ubah(({ tx, body, params, hariIni }) => {
      const t = wajibTask(tx, params.id ?? '')
      const data = dataDari(tx)
      if (!taskAktif(t)) tolak('Hanya task aktif yang bisa dibatalkan.')
      tolak(taskTerkunci(data, t, hariIni))
      cekPenutupan(body.dampak, dampakTask(data, t.id, { batal: true }, hariIni))
      tx.tulis('task', { ...t, batal: true, dibatalkan_pada: new Date().toISOString(), dibatalkan_tanggal_lokal: hariIni })
      hapusEntriMendatang(tx, t.id, hariIni)
    }),
  ),

  http.post(
    '/api/task/:id/buka-kembali',
    ubah(({ tx, body, params, hariIni, menit }) => {
      const t = wajibTask(tx, params.id ?? '')
      const data = dataDari(tx)
      tolak(syaratBukaKembaliTask(data, t, hariIni))
      const nama = str(body.nama).trim() || t.nama
      if (namaBentrokBukaKembali(data, t, nama)) validasiGagal({ nama: 'Nama bentrok dengan task aktif berlabel sama. Pakai nama lain.' })
      if (nama.length > 30) validasiGagal({ nama: 'Nama task maksimal 30 karakter.' })
      const kembali = progressSebelumSelesai(tx.semua('riwayat_progress'), t.id)
      catatRiwayat(tx, t, kembali, '', hariIni, menit, 'buka_kembali')
      tx.tulis('task', { ...t, nama, progress: kembali })
    }),
  ),

  http.patch(
    '/api/label/:id',
    ubah(({ tx, body, params }) => {
      const l = tx.ambil('label_mandiri', params.id ?? '') ?? galatMock(404, 'tidak_ditemukan', 'Label tidak ditemukan.')
      const g = validasiNamaLabel(str(body.nama), dataDari(tx), l.id)
      if (g) validasiGagal({ nama: g })
      tx.tulis('label_mandiri', { ...l, nama: str(body.nama).trim() })
    }),
  ),

  http.delete(
    '/api/label/:id',
    ubah(({ tx, params }) => {
      const l = tx.ambil('label_mandiri', params.id ?? '') ?? galatMock(404, 'tidak_ditemukan', 'Label tidak ditemukan.')
      if (tx.semua('task').some((t) => t.label_id === l.id)) tolak('Label yang punya task tidak bisa dihapus.')
      tx.hapus('label_mandiri', l.id)
    }),
  ),
]

