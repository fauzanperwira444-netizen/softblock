import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useData } from '../../data/DataProvider'
import { useWaktu } from '../../data/useWaktu'
import type { Koneksi } from '../../data/sinkron'
import { cx } from '../cx'
import { Button } from '../kit/Button'
import { Icon } from '../kit/Icon'
import type { IconName } from '../kit/icons'
import { formatDataPer } from '../format'
import { DUR, EASE_IN, EASE_OUT } from '../motion'

type Tampilan = {
  icon: IconName
  putar?: boolean
  gaya: string
  ikonGaya: string
  judul: ReactNode
  rincian?: string
  aksi?: { label: string; icon: IconName; jalankan: () => void }
}

const gayaWarn = 'bg-warn-soft text-on-warn-soft shadow-[inset_0_0_0_1.5px_var(--sb-warn-line)]'
const gayaNetral = 'bg-well text-ink shadow-[inset_0_0_0_1.5px_var(--sb-line)]'

/*
  Bilah status tunggal, tidak bisa ditutup (N-11): Menyambungkan, Offline, Tersambung kembali,
  galat, dan versi baru. Tampilan mengikuti layar L01–L04 prototipe; tanpa toast.
*/
export function StatusBar() {
  const { koneksi, snapshot, segarkan } = useData()
  const waktu = useWaktu()
  const dataPer = snapshot && waktu ? formatDataPer(snapshot.disinkron_pada, snapshot.zona_waktu, waktu.hariIni) : null
  const tampil = isiBilah(koneksi, dataPer, segarkan)

  return (
    <AnimatePresence mode="wait" initial={false}>
      {tampil && (
        <motion.div
          key={koneksi}
          role={koneksi === 'galat' ? 'alert' : 'status'}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: DUR.fast, ease: EASE_IN } }}
          className={cx('mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-field px-4 py-3 md:mx-8 md:px-5', tampil.gaya)}
        >
          <span
            aria-hidden="true"
            className={cx('inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-card', tampil.ikonGaya)}
          >
            <Icon name={tampil.icon} className={tampil.putar ? 'animate-spin' : undefined} />
          </span>
          <div className="min-w-0 flex-[1_1_260px]">
            <p className="text-body-md font-semibold">{tampil.judul}</p>
            {tampil.rincian && <p className="text-body-sm opacity-85">{tampil.rincian}</p>}
          </div>
          {tampil.aksi && (
            <Button variant="tactile" size="sm" icon={tampil.aksi.icon} onClick={tampil.aksi.jalankan}>
              {tampil.aksi.label}
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono">{children}</span>
}

function isiBilah(koneksi: Koneksi, dataPer: string | null, segarkan: () => void): Tampilan | null {
  const coba = { label: 'Coba lagi', icon: 'refresh' as const, jalankan: segarkan }
  switch (koneksi) {
    case 'online':
      return null
    case 'menyambungkan':
    case 'lambat':
      return {
        icon: 'sync',
        putar: true,
        gaya: gayaWarn,
        ikonGaya: 'text-warn',
        judul: dataPer ? (
          <>
            Menyambungkan… Data per <Mono>{dataPer}</Mono> tampil dulu.
          </>
        ) : (
          'Menyambungkan…'
        ),
        rincian:
          koneksi === 'lambat'
            ? 'Server sedang bangun, bisa sampai 1 menit.'
            : 'Tombol ubah aktif setelah tersambung.',
      }
    case 'offline':
      return {
        icon: 'cloud_off',
        gaya: gayaNetral,
        ikonGaya: 'text-ink-muted',
        judul: dataPer ? (
          <>
            Kamu sedang offline. Data per <Mono>{dataPer}</Mono> hanya bisa dibaca.
          </>
        ) : (
          'Kamu sedang offline.'
        ),
        rincian: 'Perubahan dinonaktifkan sampai koneksi pulih.',
        aksi: coba,
      }
    case 'tersambung_kembali':
      return {
        icon: 'sync',
        putar: true,
        gaya: 'bg-mist text-on-mist',
        ikonGaya: 'text-primary',
        judul: 'Tersambung kembali. Memperbarui data…',
        ...(dataPer ? { rincian: `Data per ${dataPer} tampil sampai pembaruan selesai.` } : {}),
      }
    case 'galat':
      return {
        icon: 'sync_problem',
        gaya: 'bg-danger-soft text-on-danger-soft',
        ikonGaya: 'text-danger',
        judul: 'Gagal memperbarui. Server tidak menjawab.',
        ...(dataPer ? { rincian: `Data per ${dataPer} tampil dulu.` } : {}),
        aksi: coba,
      }
    case 'usang':
      return {
        icon: 'update',
        gaya: 'bg-mint text-on-mint',
        ikonGaya: 'text-on-mint',
        judul: 'Ada versi baru aplikasi.',
        rincian: 'Muat ulang untuk melanjutkan. Isian yang belum disimpan akan hilang.',
        aksi: { label: 'Muat ulang', icon: 'refresh', jalankan: () => window.location.reload() },
      }
  }
}
