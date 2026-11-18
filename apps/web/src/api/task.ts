import type { Dampak } from '../domain/projek'
import type { IsianTask } from '../domain/task'
import type { ResponsMutasi } from '../domain/tipe'
import { request } from './client'

// Endpoint modul Task (konvensi 7.2). Penutupan projek oleh aksi task membawa `dampak` (2.4, I-10).
type M = Promise<ResponsMutasi>

export type TujuanKirim = { sesi_id: string } | { label_id: string } | { label_baru: string }

type IsiKirim = Omit<IsianTask, 'deadline_tanggal'> & { deadline_tanggal: string | null }

export const taskApi = {
  buat: (v: number, tujuan: TujuanKirim, isi: IsiKirim): M => request('POST', '/api/task', { ...tujuan, ...isi }, { ifMatch: v }),
  ubah: (v: number, id: string, isi: IsiKirim): M => request('PATCH', `/api/task/${id}`, isi, { ifMatch: v }),
  pindah: (
    v: number,
    id: string,
    tujuan: TujuanKirim,
    deadline: { deadline_tanggal: string | null; deadline_menit: number | null },
    dampak: Dampak | null,
  ): M => request('POST', `/api/task/${id}/pindah`, { ...tujuan, ...deadline, dampak }, { ifMatch: v }),
  progress: (v: number, id: string, nilai: number, deskripsi: string, dampak: Dampak | null): M =>
    request('POST', `/api/task/${id}/progress`, { nilai, deskripsi, dampak }, { ifMatch: v }),
  batal: (v: number, id: string, dampak: Dampak | null): M => request('POST', `/api/task/${id}/batal`, { dampak }, { ifMatch: v }),
  bukaKembali: (v: number, id: string, nama: string | null): M =>
    request('POST', `/api/task/${id}/buka-kembali`, { nama }, { ifMatch: v }),

  ubahLabel: (v: number, id: string, nama: string): M => request('PATCH', `/api/label/${id}`, { nama }, { ifMatch: v }),
  hapusLabel: (v: number, id: string): M => request('DELETE', `/api/label/${id}`, undefined, { ifMatch: v }),
}
