import { request } from './client'

// Bentuk sementara sampai tipe dihasilkan dari OpenAPI (Scramble → openapi-typescript).
export type Akun = {
  id: string
  email: string
  nama_tampil: string
  zona_waktu: string
  punya_password: boolean
  tertaut_google: boolean
}

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128
export const NAMA_TAMPIL_MAX = 45

export const akunApi = {
  saya: () => request<Akun>('GET', '/api/akun'),
  masuk: (email: string, password: string) => request<Akun>('POST', '/api/auth/masuk', { email, password }),
  daftar: (data: { email: string; password: string; nama_tampil: string }) =>
    request<Akun>('POST', '/api/auth/daftar', data),
  keluar: () => request<void>('POST', '/api/auth/keluar'),
  lupaPassword: (email: string) => request<void>('POST', '/api/auth/lupa-password', { email }),
  resetPassword: (token: string, password: string) =>
    request<void>('POST', '/api/auth/reset-password', { token, password }),
  ubah: (data: Partial<Pick<Akun, 'nama_tampil' | 'zona_waktu'>>) => request<Akun>('PATCH', '/api/akun', data),
  gantiPassword: (data: { password_lama?: string; password_baru: string }) =>
    request<void>('PUT', '/api/akun/password', data),
}

export const GOOGLE_REDIRECT = '/auth/google/redirect'
