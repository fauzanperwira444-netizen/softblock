import type { Dampak, DataProjek } from '../../../domain/projek'
import { formatTanggal } from '../../format'

export type AksiDampak = 'selesai_dini' | 'batal_projek' | 'batal_sesi' | 'hapus_sesi' | 'ubah_periode'

/** Maks 5 nama lalu "dan N lainnya" (I-04). */
function daftarNama(nama: string[]): string {
  if (nama.length <= 5) return nama.join(', ')
  return `${nama.slice(0, 5).join(', ')} dan ${nama.length - 5} lainnya`
}

const TETAP: Record<AksiDampak, string[]> = {
  selesai_dini: ['Sesi yang sudah lewat', 'Task selesai', 'Riwayat progress'],
  batal_projek: ['Sesi yang sudah lewat', 'Task selesai', 'Riwayat progress'],
  batal_sesi: ['Periode sesi tidak dipotong', 'Task selesai', 'Riwayat progress'],
  hapus_sesi: ['Sesi dan task lain di projek ini'],
  ubah_periode: ['Task dan progress-nya'],
}

/** Kalimat "Akan terjadi" dan "Tetap ada" dari payload dampak, dengan nama dari data yang sama. */
export function uraianDampak(aksi: AksiDampak, d: Dampak, data: DataProjek): { akanTerjadi: string[]; tetapAda: string[] } {
  const namaTask = (ids: string[]) => ids.map((id) => data.task.find((t) => t.id === id)?.nama ?? 'Task')
  const namaSesi = (ids: string[]) => ids.map((id) => data.sesi.find((s) => s.id === id)?.nama ?? 'Sesi')
  const baris: string[] = []

  for (const { id, akhir_baru } of d.sesi_dipotong) {
    baris.push(`${namaSesi([id])[0]} dipotong sampai ${formatTanggal(akhir_baru)}.`)
  }
  if (d.sesi_dihapus.length > 0) baris.push(`${daftarNama(namaSesi(d.sesi_dihapus))} dihapus karena kosong.`)
  if (d.sesi_batal.length > 0) baris.push(`${daftarNama(namaSesi(d.sesi_batal))} ditandai batal.`)
  if (d.task_batal.length > 0) baris.push(`${d.task_batal.length} task aktif dibatalkan: ${daftarNama(namaTask(d.task_batal))}.`)
  if (d.task_di_luar_periode.length > 0) {
    baris.push(`${d.task_di_luar_periode.length} task menjadi di luar periode: ${daftarNama(namaTask(d.task_di_luar_periode))}.`)
  }
  if (d.projek_menjadi === 'selesai') baris.push('Projek akan menjadi selesai dan terkunci.')
  if (d.projek_menjadi === 'batal') baris.push('Projek batal dan terkunci.')
  if (d.projek_menjadi === 'dihapus') baris.push('Projek dihapus karena belum punya sesi bertask.')
  if (d.projek_menjadi === 'belum_dijadwalkan' && aksi !== 'batal_projek') baris.push('Projek kembali belum dijadwalkan.')
  if (baris.length === 0) baris.push('Tidak ada task atau sesi lain yang terdampak.')

  return { akanTerjadi: baris, tetapAda: TETAP[aksi] }
}
