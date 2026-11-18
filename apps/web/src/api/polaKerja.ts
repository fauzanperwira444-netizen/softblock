import type { HasilPolaKerja } from '../domain/polaKerja'
import { request } from './client'

/** GET /api/pola-kerja: satu-satunya bacaan selain sinkron (7.3). */
export const polaKerjaApi = {
  ambil: (dari: string, sampai: string) => request<HasilPolaKerja>('GET', `/api/pola-kerja?dari=${dari}&sampai=${sampai}`),
}
