import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { DataLengkap } from '../../../data/pilih'
import { formatDurasi } from '../../../domain/jamKosong'
import { hariIso, tambahHari } from '../../../domain/tanggal'
import type { Tanggal } from '../../../domain/tipe'
import { cx } from '../../cx'
import { GarisSesi } from '../../kalender/GarisSesi'
import { deadlinePadaTanggal, garisPadaTanggal, hariMinggu, jamKosongHari, usePolaProjek } from '../../kalender/dataKalender'
import { IconButton } from '../../kit/Button'
import { Card } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import { formatRentang } from '../../format'
import { EASE_OUT, DUR } from '../../motion'
import { useLayananTask } from '../../task/LayananTask'
import { NAMA_HARI } from '../../todo/FormBlok'

const AMBANG_GESER = 60

/** D-08: minggu berjalan dengan garis sesi, deadline, dan jam kosong; klik hari membuka panel hari. */
export function KalenderMini({ data, hariIni }: { data: DataLengkap; hariIni: Tanggal }) {
  const layanan = useLayananTask()
  const pola = usePolaProjek(data)
  const [acuan, setAcuan] = useState(hariIni)
  const [arah, setArah] = useState(0)
  const hari = hariMinggu(acuan)
  const mingguIni = hari.includes(hariIni)

  function geser(n: number) {
    setArah(n)
    setAcuan((a) => tambahHari(a, n * 7))
  }

  function selesaiGeser(_: unknown, info: PanInfo) {
    if (info.offset.x < -AMBANG_GESER) geser(1)
    else if (info.offset.x > AMBANG_GESER) geser(-1)
  }

  return (
    <Card className="flex flex-col gap-4" aria-labelledby="dash-kalender">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="dash-kalender" className="flex items-center gap-2.5 text-headline-md">
            <Icon name="calendar_today" className="text-primary" />
            {mingguIni ? 'Minggu ini' : 'Minggu lain'}
          </h2>
          <p className="mt-0.5 font-mono text-body-sm text-ink-muted" aria-live="polite">
            {formatRentang(hari[0] ?? acuan, hari[6] ?? acuan)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!mingguIni && (
            <button type="button" onClick={() => {
                setArah(acuan < hariIni ? 1 : -1)
                setAcuan(hariIni)
              }} className="min-h-11 px-2 text-body-sm font-semibold text-primary underline-offset-4 hover:underline">
              Hari ini
            </button>
          )}
          <IconButton icon="chevron_left" label="Minggu sebelumnya" size="sm" onClick={() => geser(-1)} />
          <IconButton icon="chevron_right" label="Minggu berikutnya" size="sm" onClick={() => geser(1)} />
        </div>
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={arah}>
          <motion.ol
            key={hari[0]}
            custom={arah}
            variants={{
              masuk: (a: number) => ({ x: a * 48, opacity: 0 }),
              diam: { x: 0, opacity: 1 },
              keluar: (a: number) => ({ x: a * -48, opacity: 0 }),
            }}
            initial="masuk"
            animate="diam"
            exit="keluar"
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={selesaiGeser}
            className="grid touch-pan-y grid-cols-7 gap-1.5"
          >
            {hari.map((t) => {
              const garis = garisPadaTanggal(data, t, pola)
              const mendatang = t >= hariIni
              const deadline = mendatang ? deadlinePadaTanggal(data, t).length : 0
              const kosong = mendatang ? jamKosongHari(data, t) : 0
              const ini = t === hariIni
              const urai = [
                `${NAMA_HARI[hariIso(t)]} ${Number(t.slice(8))}`,
                garis.length > 0 ? `sesi ${garis.map((g) => g.projek.nama).join(', ')}` : null,
                deadline > 0 ? `${deadline} deadline` : null,
                mendatang ? `jam kosong ${formatDurasi(kosong)}` : null,
              ].filter(Boolean)
              return (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => layanan.bukaHari(t)}
                    aria-label={urai.join(', ')}
                    aria-current={ini ? 'date' : undefined}
                    className={cx(
                      'flex min-h-24 w-full flex-col items-stretch gap-1 rounded-tile px-1 py-2 text-center transition-colors',
                      ini ? 'bg-primary text-on-primary' : 'bg-well tactile-inset hover:bg-mist',
                      !mendatang && !ini && 'opacity-70',
                    )}
                  >
                    <span className={cx('text-[0.6875rem] font-semibold uppercase', ini ? 'text-on-primary/80' : 'text-ink-muted')}>
                      {NAMA_HARI[hariIso(t)]?.slice(0, 3)}
                    </span>
                    <span className="font-mono text-[1.0625rem] font-bold">{Number(t.slice(8))}</span>
                    <span className="flex flex-col gap-0.5 px-0.5">
                      {garis.slice(0, 3).map((g) => (
                        <GarisSesi key={g.sesi.id} warna={g.projek.warna} pola={g.pola} ringkas />
                      ))}
                    </span>
                    <span className="mt-auto flex flex-col items-center gap-0.5">
                      {deadline > 0 && (
                        <span className={cx('inline-flex items-center gap-0.5 font-mono text-[0.6875rem] font-bold', ini ? 'text-on-primary' : 'text-danger')}>
                          <Icon name="flag" size={12} />
                          {deadline}
                        </span>
                      )}
                      {mendatang && <span className={cx('font-mono text-[0.625rem]', ini ? 'text-on-primary/80' : 'text-ink-muted')}>{formatDurasi(kosong)}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </motion.ol>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm text-ink-muted">
        <span className="inline-flex items-center gap-1">
          <Icon name="flag" size={14} className="text-danger" /> deadline · angka bawah: jam kosong
        </span>
        <Link to="/kalender" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">
          Buka Kalender
          <Icon name="arrow_forward" size={16} />
        </Link>
      </div>
    </Card>
  )
}
