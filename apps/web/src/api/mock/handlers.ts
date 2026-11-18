import { http, HttpResponse, delay } from 'msw'
import type { Akun } from '../akun'
import { PASSWORD_MAX, PASSWORD_MIN } from '../akun'
import { waktuLokal } from '../../domain/tanggal'
import type { ResponsSinkron } from '../../domain/tipe'
import { AKUN_CONTOH } from './seed'
import { buatSeed } from './seedData'

const AKUN_BERDATA = new Set([AKUN_CONTOH.email, 'google.demo@softblock.test'])

export type SimulasiJaringan = 'normal' | 'lambat' | 'mati' | 'usang'
export const KUNCI_SIMULASI = 'softblock-mock-jaringan'

/** Dipilih dari katalog /_kit untuk mencoba bilah status L01–L04. */
function simulasiJaringan(): SimulasiJaringan {
  try {
    return (localStorage.getItem(KUNCI_SIMULASI) as SimulasiJaringan | null) ?? 'normal'
  } catch {
    return 'normal'
  }
}

/*
  Server tiruan untuk dev sampai endpoint Laravel tersedia. Bentuk galat mengikuti
  Arsitektur Sistem 7.5; sesi disimpan di localStorage karena mock tidak bisa memakai cookie httpOnly.
*/
type AkunMock = Akun & { password: string | null }

type Status = {
  akun: AkunMock[]
  sesi: string | null
  gagal: Record<string, { jumlah: number; sampai: number }>
  reset: Record<string, { email: string; kedaluwarsa: number }>
}

const KUNCI = 'softblock-mock'
const BATAS_GAGAL = 5
const TUNDA_MS = 15 * 60 * 1000
const RESET_MS = 30 * 60 * 1000

function awal(): Status {
  return {
    akun: [
      {
        id: 'akun-demo',
        email: AKUN_CONTOH.email,
        nama_tampil: AKUN_CONTOH.nama_tampil,
        zona_waktu: AKUN_CONTOH.zona_waktu,
        punya_password: true,
        tertaut_google: false,
        password: AKUN_CONTOH.password,
      },
    ],
    sesi: null,
    gagal: {},
    reset: {},
  }
}

function baca(): Status {
  try {
    const isi = localStorage.getItem(KUNCI)
    return isi ? (JSON.parse(isi) as Status) : awal()
  } catch {
    return awal()
  }
}

function simpan(s: Status) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(s))
  } catch {
    // Penyimpanan diblokir (mode privat); mock tetap jalan di memori untuk permintaan ini.
  }
}

export function resetMock() {
  simpan(awal())
}

function publik({ password, ...akun }: AkunMock): Akun {
  return { ...akun, punya_password: password !== null }
}

function galat(status: number, kode: string, pesan: string, extra: Record<string, unknown> = {}) {
  return HttpResponse.json({ kode, pesan, ...extra }, { status })
}

function validasi(rincian: Record<string, string>) {
  const kolom = Object.keys(rincian)[0]
  return galat(422, 'validasi_gagal', 'Periksa lagi isian yang ditandai.', { kolom, rincian })
}

const normal = (email: string) => email.trim().toLowerCase()

function aktif(s: Status): AkunMock | undefined {
  return s.akun.find((a) => a.id === s.sesi)
}

function cekPassword(password: string, kolom: string): Record<string, string> {
  if (password.length < PASSWORD_MIN) return { [kolom]: `Password minimal ${PASSWORD_MIN} karakter.` }
  if (password.length > PASSWORD_MAX) return { [kolom]: `Password maksimal ${PASSWORD_MAX} karakter.` }
  return {}
}

type Json = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')

export const handlers = [
  http.get('/sanctum/csrf-cookie', () => {
    document.cookie = 'XSRF-TOKEN=mock-xsrf; path=/; SameSite=Lax'
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/kesehatan', async () => {
    const sim = simulasiJaringan()
    if (sim === 'mati') return HttpResponse.error()
    if (sim === 'usang') return galat(409, 'klien_usang', 'Ada versi baru aplikasi.')
    if (sim === 'lambat') await delay(10_000)
    return HttpResponse.json({ status: 'ok', build: 'dev' })
  }),

  http.get('/api/sinkron', async ({ request }) => {
    await delay(200)
    if (simulasiJaringan() === 'mati') return HttpResponse.error()
    const s = baca()
    const akun = aktif(s)
    if (!akun) return galat(401, 'sesi_habis', 'Sesi habis. Masuk lagi.')
    const hariIni = waktuLokal(new Date(), akun.zona_waktu).tanggal
    const sejak = Number(new URL(request.url).searchParams.get('sejak') ?? '0')
    const revisi = 1
    const meta = { hari_ini: hariIni, zona_waktu: akun.zona_waktu }
    // Data mock tidak berubah lewat mutasi (belum ada), jadi delta dari revisi terkini selalu kosong.
    if (sejak === revisi) {
      return HttpResponse.json<ResponsSinkron>({ revisi, penuh: false, ubah: {}, hapus: [], meta })
    }
    const ubah = AKUN_BERDATA.has(akun.email) ? buatSeed(hariIni) : {}
    return HttpResponse.json<ResponsSinkron>({ revisi, penuh: true, ubah, hapus: [], meta })
  }),

  http.get('/api/akun', async () => {
    await delay(150)
    const akun = aktif(baca())
    return akun ? HttpResponse.json(publik(akun)) : galat(401, 'sesi_habis', 'Sesi habis. Masuk lagi.')
  }),

  http.post('/api/auth/masuk', async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Json
    const email = normal(str(body.email))
    const s = baca()
    const catatan = s.gagal[email]
    if (catatan && catatan.jumlah >= BATAS_GAGAL && catatan.sampai > Date.now()) {
      const tunggu_detik = Math.ceil((catatan.sampai - Date.now()) / 1000)
      return galat(429, 'terlalu_banyak_percobaan', 'Terlalu banyak percobaan masuk.', { tunggu_detik })
    }
    const akun = s.akun.find((a) => a.email === email)
    if (!akun || akun.password === null || akun.password !== str(body.password)) {
      const jumlah = (catatan && catatan.sampai > Date.now() ? catatan.jumlah : 0) + 1
      s.gagal[email] = { jumlah, sampai: Date.now() + TUNDA_MS }
      simpan(s)
      return galat(422, 'validasi_gagal', 'Email atau password salah.', { rincian: {} })
    }
    delete s.gagal[email]
    s.sesi = akun.id
    simpan(s)
    return HttpResponse.json(publik(akun))
  }),

  http.post('/api/auth/daftar', async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Json
    const email = normal(str(body.email))
    const password = str(body.password)
    const nama = str(body.nama_tampil).trim()
    const s = baca()
    const rincian: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) rincian.email = 'Format email tidak valid.'
    else if (s.akun.some((a) => a.email === email)) rincian.email = 'Email sudah terdaftar. Masuk atau reset password.'
    Object.assign(rincian, cekPassword(password, 'password'))
    if (nama.length > 45) rincian.nama_tampil = 'Nama tampil maksimal 45 karakter.'
    if (Object.keys(rincian).length > 0) return validasi(rincian)

    const akun: AkunMock = {
      id: crypto.randomUUID(),
      email,
      nama_tampil: nama || (email.split('@')[0] ?? email),
      zona_waktu: 'Asia/Jakarta',
      punya_password: true,
      tertaut_google: false,
      password,
    }
    s.akun.push(akun)
    s.sesi = akun.id
    simpan(s)
    return HttpResponse.json(publik(akun), { status: 201 })
  }),

  // Pengganti pengalihan Google di mode mock: langsung masuk sebagai akun Google contoh.
  http.post('/api/mock/google', async () => {
    await delay(300)
    const s = baca()
    const email = 'google.demo@softblock.test'
    let akun = s.akun.find((a) => a.email === email)
    if (!akun) {
      akun = {
        id: crypto.randomUUID(),
        email,
        nama_tampil: 'Demo Google',
        zona_waktu: 'Asia/Jakarta',
        punya_password: false,
        tertaut_google: true,
        password: null,
      }
      s.akun.push(akun)
    }
    s.sesi = akun.id
    simpan(s)
    return HttpResponse.json(publik(akun))
  }),

  http.post('/api/auth/keluar', () => {
    const s = baca()
    s.sesi = null
    simpan(s)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/auth/lupa-password', async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Json
    const email = normal(str(body.email))
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return validasi({ email: 'Format email tidak valid.' })
    const s = baca()
    const akun = s.akun.find((a) => a.email === email)
    if (akun) {
      const token = crypto.randomUUID()
      s.reset[token] = { email, kedaluwarsa: Date.now() + RESET_MS }
      simpan(s)
      // Pengganti email reset di mode mock.
      console.info(`[mock] Tautan reset password: ${location.origin}/reset-password?token=${token}`)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/auth/reset-password', async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Json
    const s = baca()
    const data = s.reset[str(body.token)]
    if (!data || data.kedaluwarsa < Date.now()) {
      return galat(422, 'validasi_gagal', 'Tautan reset tidak valid atau sudah kedaluwarsa.', {
        kolom: 'token',
        rincian: { token: 'Tautan tidak valid.' },
      })
    }
    const rincian = cekPassword(str(body.password), 'password')
    if (Object.keys(rincian).length > 0) return validasi(rincian)
    const akun = s.akun.find((a) => a.email === data.email)
    if (akun) akun.password = str(body.password)
    delete s.reset[str(body.token)]
    simpan(s)
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('/api/akun', async ({ request }) => {
    await delay(250)
    const s = baca()
    const akun = aktif(s)
    if (!akun) return galat(401, 'sesi_habis', 'Sesi habis. Masuk lagi.')
    const body = (await request.json()) as Json
    if (typeof body.nama_tampil === 'string') {
      const nama = body.nama_tampil.trim()
      if (nama.length === 0) return validasi({ nama_tampil: 'Nama tampil wajib diisi.' })
      if (nama.length > 45) return validasi({ nama_tampil: 'Nama tampil maksimal 45 karakter.' })
      akun.nama_tampil = nama
    }
    if (typeof body.zona_waktu === 'string') akun.zona_waktu = body.zona_waktu
    simpan(s)
    return HttpResponse.json(publik(akun))
  }),

  http.put('/api/akun/password', async ({ request }) => {
    await delay(300)
    const s = baca()
    const akun = aktif(s)
    if (!akun) return galat(401, 'sesi_habis', 'Sesi habis. Masuk lagi.')
    const body = (await request.json()) as Json
    if (akun.password !== null && akun.password !== str(body.password_lama)) {
      return validasi({ password_lama: 'Password lama salah.' })
    }
    const rincian = cekPassword(str(body.password_baru), 'password_baru')
    if (Object.keys(rincian).length > 0) return validasi(rincian)
    akun.password = str(body.password_baru)
    simpan(s)
    return new HttpResponse(null, { status: 204 })
  }),
]
