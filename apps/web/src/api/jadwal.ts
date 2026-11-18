import type { IsianJadwal } from '../domain/jadwal'
import type { ResponsMutasi } from '../domain/tipe'
import { request } from './client'

// Endpoint modul Jadwal (F-01..F-09, 7.2).
type M = Promise<ResponsMutasi>

export const jadwalApi = {
  buat: (v: number, isi: IsianJadwal): M => request('POST', '/api/jadwal', isi, { ifMatch: v }),
  /** Edit berlaku mulai `isi.tanggal`; versi lama berakhir sehari sebelumnya (F-03). */
  ubah: (v: number, id: string, isi: IsianJadwal): M => request('PATCH', `/api/jadwal/${id}`, isi, { ifMatch: v }),
  akhiri: (v: number, id: string, tanggal: string): M => request('POST', `/api/jadwal/${id}/akhiri`, { tanggal }, { ifMatch: v }),
  hapus: (v: number, id: string): M => request('DELETE', `/api/jadwal/${id}`, undefined, { ifMatch: v }),
  tambahPengecualian: (v: number, isi: { jadwal_id: string | null; mulai: string; akhir: string; keterangan: string }): M =>
    request('POST', '/api/pengecualian', isi, { ifMatch: v }),
  hapusPengecualian: (v: number, id: string): M => request('DELETE', `/api/pengecualian/${id}`, undefined, { ifMatch: v }),
}
