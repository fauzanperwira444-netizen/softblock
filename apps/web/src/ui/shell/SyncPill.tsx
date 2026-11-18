import { motion, useReducedMotion } from 'motion/react'
import { useData } from '../../data/DataProvider'
import { useWaktu } from '../../data/useWaktu'
import { cx } from '../cx'
import { formatDataPer } from '../format'

/** Pil status sinkron di pojok halaman (prototipe: baris breadcrumb). */
export function SyncPill() {
  const { koneksi, snapshot } = useData()
  const waktu = useWaktu()
  const reduce = useReducedMotion()
  const dataPer = snapshot && waktu ? formatDataPer(snapshot.disinkron_pada, snapshot.zona_waktu, waktu.hariIni) : null

  const online = koneksi === 'online'
  const offline = koneksi === 'offline' || koneksi === 'galat'
  const teks = online ? 'Tersinkronisasi' : offline ? `Offline · Data per ${dataPer ?? '-'}` : 'Menyambungkan…'

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-body-sm font-semibold',
        online && 'bg-mist text-on-avatar',
        offline && 'bg-high text-ink-muted',
        !online && !offline && 'bg-warn-soft text-on-warn-soft',
      )}
    >
      <motion.i
        key={koneksi}
        aria-hidden="true"
        className={cx('size-[7px] rounded-full', online ? 'bg-primary' : offline ? 'bg-line-strong' : 'bg-warn')}
        // Denyut tiga kali lalu diam; gerak berulang lebih dari 5 detik butuh tombol jeda.
        animate={
          reduce || offline
            ? {}
            : {
                boxShadow: [
                  '0 0 0 0 color-mix(in srgb, currentColor 45%, transparent)',
                  '0 0 0 6px color-mix(in srgb, currentColor 0%, transparent)',
                ],
              }
        }
        transition={{ duration: 1.2, repeat: 2, ease: 'easeOut' }}
      />
      {teks}
    </span>
  )
}
