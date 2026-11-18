import type { ResponsMutasi } from '../domain/tipe'
import { request } from './client'

// Endpoint modul To-do (7.2, 7.6). Entri memakai id buatan klien sehingga aman diulang.
type M = Promise<ResponsMutasi>

export const todoApi = {
  tambahEntri: (v: number, entri: { id: string; task_id: string; tanggal: string }): M =>
    request('POST', '/api/entri', entri, { ifMatch: v }),
  hapusEntri: (v: number, id: string): M => request('DELETE', `/api/entri/${id}`, undefined, { ifMatch: v }),
  ceklis: (v: number, id: string, ceklis: boolean): M => request('PUT', `/api/entri/${id}/ceklis`, { ceklis }, { ifMatch: v }),
  tambahBlok: (v: number, entriId: string, isi: { mulai_menit: number; selesai_menit: number }): M =>
    request('POST', `/api/entri/${entriId}/blok`, isi, { ifMatch: v }),
  ubahBlok: (v: number, id: string, isi: { mulai_menit: number; selesai_menit: number }): M =>
    request('PATCH', `/api/blok/${id}`, isi, { ifMatch: v }),
  hapusBlok: (v: number, id: string): M => request('DELETE', `/api/blok/${id}`, undefined, { ifMatch: v }),
}
