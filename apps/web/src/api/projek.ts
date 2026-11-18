import type { Dampak, IsianSesi } from '../domain/projek'
import type { ResponsMutasi } from '../domain/tipe'
import { request } from './client'

// Endpoint modul Projek (konvensi 7.2). Semua aksi membawa If-Match = revisi akun di snapshot.
type M = Promise<ResponsMutasi>

export type IsianProjek = { nama: string; deskripsi: string; warna: string }

export const projekApi = {
  buat: (v: number, isi: IsianProjek): M => request('POST', '/api/projek', isi, { ifMatch: v }),
  ubah: (v: number, id: string, isi: Partial<IsianProjek>): M => request('PATCH', `/api/projek/${id}`, isi, { ifMatch: v }),
  hapus: (v: number, id: string): M => request('DELETE', `/api/projek/${id}`, undefined, { ifMatch: v }),
  selesaiDini: (v: number, id: string, dampak: Dampak): M =>
    request('POST', `/api/projek/${id}/selesai-dini`, { dampak }, { ifMatch: v }),
  batal: (v: number, id: string, dampak: Dampak): M => request('POST', `/api/projek/${id}/batal`, { dampak }, { ifMatch: v }),
  bukaKembali: (v: number, id: string, sesi: IsianSesi, warna: string | null): M =>
    request('POST', `/api/projek/${id}/buka-kembali`, { sesi, warna }, { ifMatch: v }),

  tambahDokumen: (v: number, projekId: string, isi: { nama: string; url: string }): M =>
    request('POST', `/api/projek/${projekId}/dokumen`, isi, { ifMatch: v }),
  ubahDokumen: (v: number, id: string, isi: { nama: string; url: string }): M =>
    request('PATCH', `/api/dokumen/${id}`, isi, { ifMatch: v }),
  hapusDokumen: (v: number, id: string): M => request('DELETE', `/api/dokumen/${id}`, undefined, { ifMatch: v }),

  tambahSesi: (v: number, projekId: string, isi: IsianSesi): M =>
    request('POST', `/api/projek/${projekId}/sesi`, isi, { ifMatch: v }),
  ubahSesi: (v: number, id: string, isi: IsianSesi, dampak: Dampak | null): M =>
    request('PATCH', `/api/sesi/${id}`, { ...isi, dampak }, { ifMatch: v }),
  batalSesi: (v: number, id: string, dampak: Dampak): M => request('POST', `/api/sesi/${id}/batal`, { dampak }, { ifMatch: v }),
  hapusSesi: (v: number, id: string, dampak: Dampak): M => request('DELETE', `/api/sesi/${id}`, { dampak }, { ifMatch: v }),
}
