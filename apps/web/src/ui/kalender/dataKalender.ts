import { useMemo } from 'react'
import type { DataLengkap } from '../../data/pilih'
import { jadwalPadaTanggal } from '../../domain/jadwal'
import { jamKosong, polaProjek, type PolaGaris } from '../../domain/jamKosong'
import { taskAktif } from '../../domain/status'
import { awalMinggu, tambahHari } from '../../domain/tanggal'
import { infoLabel } from '../../domain/task'
import type { BlokJam, Menit, Projek, Sesi, Tanggal, Task } from '../../domain/tipe'

export type GarisHari = { sesi: Sesi; projek: Projek; pola: PolaGaris }

/** Pola tetap per projek: urut nama agar konsisten di semua tampilan. */
export function usePolaProjek(data: DataLengkap | null): (projekId: string) => PolaGaris {
  return useMemo(() => {
    const urut = data ? [...data.projek].sort((a, b) => a.nama.localeCompare(b.nama, 'id')).map((p) => p.id) : []
    return (id: string) => polaProjek(urut, id)
  }, [data])
}

/** Garis sesi pada tanggal itu; sesi batal disembunyikan (G-03). */
export function garisPadaTanggal(data: DataLengkap, tanggal: Tanggal, pola: (id: string) => PolaGaris): GarisHari[] {
  const hasil: GarisHari[] = []
  for (const sesi of data.sesi) {
    if (sesi.batal || tanggal < sesi.mulai || tanggal > sesi.akhir) continue
    const projek = data.projek.find((p) => p.id === sesi.projek_id)
    if (projek) hasil.push({ sesi, projek, pola: pola(projek.id) })
  }
  return hasil.sort((a, b) => a.projek.nama.localeCompare(b.projek.nama, 'id'))
}

/** Jumlah deadline task aktif pada tanggal itu (G-02). */
export function deadlinePadaTanggal(data: DataLengkap, tanggal: Tanggal): Task[] {
  return data.task.filter((t) => taskAktif(t) && t.deadline_tanggal === tanggal)
}

export function hariMinggu(t: Tanggal): Tanggal[] {
  const senin = awalMinggu(t)
  return Array.from({ length: 7 }, (_, i) => tambahHari(senin, i))
}

/** 6 minggu (42 sel) yang memuat bulan dari tanggal `t`. */
export function selBulan(t: Tanggal): Tanggal[] {
  const awal = awalMinggu(`${t.slice(0, 7)}-01`)
  return Array.from({ length: 42 }, (_, i) => tambahHari(awal, i))
}

export type ItemHari =
  | { jenis: 'jadwal'; id: string; jadwalId: string; nama: string; mulai: Menit; selesai: Menit }
  | { jenis: 'blok'; id: string; blok: BlokJam; task: Task; warna: string | null; mulai: Menit; selesai: Menit }

/** Isi garis waktu satu hari: Jadwal versi saat itu dan blok (G-03, G-05). */
export function itemHari(data: DataLengkap, tanggal: Tanggal): ItemHari[] {
  const jadwal: ItemHari[] = jadwalPadaTanggal(data.jadwalData, tanggal).map((k) => ({
    jenis: 'jadwal',
    id: `${k.jadwal.id}-${tanggal}`,
    jadwalId: k.jadwal.id,
    nama: k.jadwal.nama,
    mulai: k.mulai,
    selesai: k.selesai,
  }))
  const blok: ItemHari[] = []
  for (const b of data.blok) {
    if (b.tanggal !== tanggal) continue
    const entri = data.entri.find((e) => e.id === b.entri_id)
    const task = entri && data.task.find((t) => t.id === entri.task_id)
    if (!task) continue
    const info = infoLabel(data, task)
    blok.push({ jenis: 'blok', id: b.id, blok: b, task, warna: info?.jenis === 'projek' ? info.projek.warna : null, mulai: b.mulai_menit, selesai: b.selesai_menit })
  }
  return [...jadwal, ...blok].sort((a, b) => a.mulai - b.mulai)
}

export function jamKosongHari(data: DataLengkap, tanggal: Tanggal): number {
  return jamKosong(data, tanggal).total
}

