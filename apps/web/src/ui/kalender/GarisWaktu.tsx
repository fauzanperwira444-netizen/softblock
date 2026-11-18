import { motion } from 'motion/react'
import type { DataLengkap } from '../../data/pilih'
import { JAM_AKHIR, JAM_AWAL } from '../../domain/jadwal'
import { slotKosong, rentangTerpakai } from '../../domain/jamKosong'
import type { Menit, Tanggal } from '../../domain/tipe'
import { cx } from '../cx'
import { formatJam } from '../format'
import { SPRING_SOFT } from '../motion'
import { itemHari, type ItemHari } from './dataKalender'

const RENTANG = JAM_AKHIR - JAM_AWAL
export const TINGGI_JAM = 44
const persen = (m: Menit) => `${((m - JAM_AWAL) / RENTANG) * 100}%`
const tinggi = (a: Menit, b: Menit) => `${((b - a) / RENTANG) * 100}%`

type Props = {
  data: DataLengkap
  tanggal: Tanggal
  hariIni: Tanggal
  menitSekarang: Menit
  /** Slot kosong bisa diklik untuk hari ini dan mendatang (G-04). */
  onSlot?: (mulai: Menit) => void
  onItem?: (item: ItemHari) => void
  /** Deadline berjam (06.00 ke atas) digambar sebagai garis (G-04). */
  deadline?: Array<{ id: string; nama: string; menit: Menit }>
  ringkas?: boolean
}

/** Kolom garis waktu satu hari, 06.00–24.00 dengan garis tiap 30 menit (G-04). */
export function KolomHari({ data, tanggal, hariIni, menitSekarang, onSlot, onItem, deadline = [], ringkas = false }: Props) {
  const item = itemHari(data, tanggal)
  const kosong = slotKosong(rentangTerpakai(data, tanggal)).slot
  const bolehSlot = !!onSlot && tanggal >= hariIni
  const lampau = tanggal < hariIni

  return (
    <div
      className="relative rounded-field bg-[repeating-linear-gradient(180deg,transparent_0_21px,rgb(30_35_34/0.05)_21px_22px)]"
      style={{ height: (RENTANG / 60) * TINGGI_JAM }}
    >
      {bolehSlot &&
        kosong.map((s) => (
          <button
            key={`kosong-${s.mulai}`}
            type="button"
            onClick={() => onSlot?.(s.mulai)}
            aria-label={`Slot kosong ${formatJam(s.mulai)}–${formatJam(s.selesai)}`}
            className="absolute inset-x-1 rounded-lg border border-dashed border-transparent text-body-sm text-ink-muted opacity-0 transition-opacity hover:border-line hover:opacity-100 focus-visible:opacity-100"
            style={{ top: persen(s.mulai), height: tinggi(s.mulai, s.selesai) }}
          >
            + {formatJam(s.mulai)}
          </button>
        ))}
      {item.map((it, i) => {
        const jadwal = it.jenis === 'jadwal'
        const warna = it.jenis === 'blok' ? it.warna : null
        return (
          <motion.button
            key={it.id}
            type="button"
            disabled={!onItem || (it.jenis === 'blok' && lampau)}
            onClick={() => onItem?.(it)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_SOFT, delay: Math.min(i, 6) * 0.045 }}
            className={cx(
              'absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 text-left text-body-sm disabled:cursor-default',
              jadwal ? 'bg-[repeating-linear-gradient(45deg,var(--sb-high)_0_3px,var(--sb-raised)_3px_8px)] text-ink-muted' : 'text-ink',
              !jadwal && !warna && 'bg-card shadow-[inset_0_0_0_1.5px_var(--sb-line-strong)]',
            )}
            style={{
              top: persen(it.mulai),
              height: tinggi(it.mulai, it.selesai),
              ...(warna ? { backgroundColor: `color-mix(in srgb, ${warna} 22%, var(--sb-card))`, boxShadow: `inset 3px 0 0 ${warna}` } : {}),
            }}
            aria-label={`${jadwal ? 'Jadwal' : 'Blok'} ${it.jenis === 'jadwal' ? it.nama : it.task.nama}, ${formatJam(it.mulai)}–${formatJam(it.selesai)}`}
          >
            <b className="block truncate font-semibold">{it.jenis === 'jadwal' ? it.nama : it.task.nama}</b>
            {!ringkas && (
              <span className="block font-mono text-[0.6875rem]">
                {formatJam(it.mulai)}–{formatJam(it.selesai)}
              </span>
            )}
          </motion.button>
        )
      })}
      {deadline.map((d) => (
        <div key={d.id} className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-danger" style={{ top: persen(d.menit) }}>
          <span className="absolute right-1 -top-5 rounded-full bg-danger px-2 text-[0.6875rem] font-semibold text-on-danger">
            {formatJam(d.menit)} · {d.nama}
          </span>
        </div>
      ))}
      {tanggal === hariIni && menitSekarang >= JAM_AWAL && menitSekarang <= JAM_AKHIR && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-0.5 bg-danger" style={{ top: persen(menitSekarang) }}>
          <i className="absolute -top-[3px] -left-1 size-2 rounded-full bg-danger" />
        </div>
      )}
    </div>
  )
}

export function LabelJam() {
  const jam = Array.from({ length: RENTANG / 60 }, (_, i) => JAM_AWAL + i * 60)
  return (
    <div aria-hidden="true" className="flex flex-col">
      {jam.map((m) => (
        <span key={m} className="font-mono text-[0.6875rem] text-ink-muted" style={{ height: TINGGI_JAM }}>
          {formatJam(m)}
        </span>
      ))}
    </div>
  )
}
