import { hitungStatusProjek, sesiProjek, taskProjek, type DataProjek } from '../../../domain/projek'
import { nDariM, statusSesi, taskAktif, type StatusProjek } from '../../../domain/status'
import { selisihHari } from '../../../domain/tanggal'
import type { Projek, Sesi, Tanggal } from '../../../domain/tipe'
import type { BadgeKind } from '../../kit/display'
import type { IconName } from '../../kit/icons'
import { formatTanggal } from '../../format'

export const BADGE_STATUS: Record<StatusProjek, { kind: BadgeKind; icon: IconName }> = {
  belum_dijadwalkan: { kind: 'netral-garis', icon: 'event_busy' },
  belum_mulai: { kind: 'netral-garis', icon: 'schedule' },
  berjalan: { kind: 'info', icon: 'sync' },
  jeda: { kind: 'netral', icon: 'schedule' },
  melewati_jadwal: { kind: 'telat', icon: 'warning' },
  selesai: { kind: 'redup', icon: 'check' },
  batal: { kind: 'redup', icon: 'close' },
}

export type RingkasanProjek = {
  projek: Projek
  status: StatusProjek
  n: number
  m: number
  persen: number
  sesiAktif: Sesi[]
  sesiKini: Sesi | null
  sesiBerikut: Sesi | null
  awal: Tanggal | null
  akhir: Tanggal | null
  meta: string
  tengah: string
  sisa: string
  /** Kunci urutan A-08. */
  peringkat: number
  kunciTanggal: Tanggal
}

const singkat = (t: Tanggal) => formatTanggal(t).replace(/ \d{4}$/, '')

export function ringkas(data: DataProjek, projek: Projek, hariIni: Tanggal): RingkasanProjek {
  const status = hitungStatusProjek(data, projek, hariIni)
  const sesiAktif = sesiProjek(data, projek.id)
    .filter((s) => !s.batal)
    .sort((a, b) => (a.mulai < b.mulai ? -1 : 1))
  const tasks = taskProjek(data, projek.id)
  const { n, m } = nDariM(tasks)
  const persen = m === 0 ? 0 : Math.round((n / m) * 100)
  const sesiKini = sesiAktif.find((s) => statusSesi(s, hariIni) === 'berjalan') ?? null
  const sesiBerikut = sesiAktif.find((s) => s.mulai > hariIni) ?? null
  const terakhir = sesiAktif.at(-1) ?? null
  const awal = sesiAktif[0]?.mulai ?? null
  const akhir = terakhir?.akhir ?? null
  const aktifTersisa = tasks.filter(taskAktif).length

  let meta = 'Belum ada sesi'
  let tengah = ''
  let sisa = 'Tambahkan sesi untuk menjadwalkan'
  let peringkat = 3
  let kunciTanggal = '9999-12-31'

  switch (status) {
    case 'berjalan':
      if (sesiKini) {
        meta = `${sesiKini.nama} · sampai ${formatTanggal(sesiKini.akhir)} · ${n} dari ${m} task selesai`
        tengah = `Hari ini ${singkat(hariIni)}`
        const hari = selisihHari(hariIni, sesiKini.akhir)
        sisa = hari === 0 ? 'Sesi berakhir hari ini' : `${hari} hari tersisa di sesi ini`
        peringkat = 0
        kunciTanggal = sesiKini.akhir
      }
      break
    case 'belum_mulai':
      if (sesiBerikut) {
        meta = `${sesiBerikut.nama} mulai ${formatTanggal(sesiBerikut.mulai)}`
        tengah = `Mulai ${singkat(sesiBerikut.mulai)}`
        sisa = `${selisihHari(hariIni, sesiBerikut.mulai)} hari lagi`
        peringkat = 1
        kunciTanggal = sesiBerikut.akhir
      }
      break
    case 'jeda':
      meta = sesiBerikut ? `Sesi berikutnya mulai ${formatTanggal(sesiBerikut.mulai)}` : 'Di antara dua sesi'
      tengah = 'Jeda'
      sisa = `${n} dari ${m} task selesai`
      peringkat = 2
      break
    case 'belum_dijadwalkan':
      peringkat = 3
      break
    case 'melewati_jadwal':
      if (terakhir) {
        meta = `Berakhir ${formatTanggal(terakhir.akhir)} · ${aktifTersisa} task belum selesai`
        tengah = `Terlewat ${selisihHari(terakhir.akhir, hariIni)} hari`
        sisa = 'Selesaikan atau pindahkan task yang tersisa'
      }
      peringkat = 4
      break
    case 'selesai':
      meta = `${sesiAktif.length} sesi · semua task selesai`
      tengah = 'Tuntas'
      sisa = `${n} dari ${m} task selesai`
      peringkat = 5
      break
    case 'batal':
      meta = 'Dibatalkan'
      tengah = 'Dihentikan'
      sisa = `${n} dari ${m} task selesai`
      peringkat = 5
      break
  }

  return { projek, status, n, m, persen, sesiAktif, sesiKini, sesiBerikut, awal, akhir, meta, tengah, sisa, peringkat, kunciTanggal }
}

const pembanding = new Intl.Collator('id', { sensitivity: 'base', numeric: true })

/** A-08: berjalan (akhir sesi terdekat), belum mulai, jeda, tanpa sesi, melewati jadwal, tertutup; lalu abjad. */
export function bandingkanProjek(a: RingkasanProjek, b: RingkasanProjek): number {
  if (a.peringkat !== b.peringkat) return a.peringkat - b.peringkat
  if (a.kunciTanggal !== b.kunciTanggal) return a.kunciTanggal < b.kunciTanggal ? -1 : 1
  return pembanding.compare(a.projek.nama, b.projek.nama)
}
