import { motion } from 'motion/react'
import { useState } from 'react'
import type { DataLengkap } from '../../data/pilih'
import { hariIso } from '../../domain/tanggal'
import type { Menit, Tanggal } from '../../domain/tipe'
import { cx } from '../cx'
import { formatDurasi } from '../../domain/jamKosong'
import { SPRING_SOFT } from '../motion'
import { NAMA_HARI } from '../todo/FormBlok'
import { hariMinggu, jamKosongHari } from './dataKalender'
import { KolomHari, LabelJam } from './GarisWaktu'
import type { ItemHari } from './dataKalender'

type Props = {
  data: DataLengkap
  minggu: Tanggal
  hariIni: Tanggal
  menit: Menit
  onPilihHari: (t: Tanggal) => void
  onItem: (tanggal: Tanggal, item: ItemHari) => void
}

/**
 * G-02: tampilan minggu 7 kolom di laptop. Di HP (N-53): strip 7 hari dan grid satu hari.
 */
export function TampilanMinggu({ data, minggu, hariIni, menit, onPilihHari, onItem }: Props) {
  const hari = hariMinggu(minggu)
  const [hariHp, setHariHp] = useState<Tanggal>(hari.includes(hariIni) ? hariIni : (hari[0] ?? minggu))
  const hariHpTampil = hari.includes(hariHp) ? hariHp : (hari[0] ?? minggu)

  const kepala = (t: Tanggal, onClick: () => void, aktif: boolean, idLayout: string) => (
    <button
      key={t}
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      aria-label={`${NAMA_HARI[hariIso(t)]} ${Number(t.slice(8))}${t === hariIni ? ', hari ini' : ''}`}
      className={cx('relative flex min-h-14 flex-col items-center justify-center rounded-field py-1.5', t === hariIni ? 'text-primary' : 'text-ink')}
    >
      {aktif && <motion.span layoutId={idLayout} transition={SPRING_SOFT} className="absolute inset-0 rounded-field bg-mist" />}
      <span className="lbl relative">{NAMA_HARI[hariIso(t)]?.slice(0, 3)}</span>
      <b className="relative font-mono text-numeric-md">{Number(t.slice(8))}</b>
      {t >= hariIni && <span className="relative font-mono text-[0.6875rem] text-ink-muted">{formatDurasi(jamKosongHari(data, t))}</span>}
    </button>
  )

  return (
    <section aria-label="Kalender minggu" className="rounded-card bg-card p-3 tactile-convex sm:p-4">
      <div className="hidden md:block">
        <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-x-2">
          <span />
          {hari.map((t) => kepala(t, () => onPilihHari(t), t === hariIni, 'minggu-hari-ini'))}
          <div className="col-span-full h-2" />
          <LabelJam />
          {hari.map((t) => (
            <div key={t} className={cx('rounded-field', t === hariIni && 'shadow-[inset_0_0_0_1.5px_var(--sb-sage-light)]')}>
              <KolomHari data={data} tanggal={t} hariIni={hariIni} menitSekarang={menit} onItem={(it) => onItem(t, it)} onSlot={() => onPilihHari(t)} ringkas />
            </div>
          ))}
        </div>
      </div>
      <div className="md:hidden">
        <div className="grid grid-cols-7 gap-1">{hari.map((t) => kepala(t, () => setHariHp(t), t === hariHpTampil, 'minggu-hari-hp'))}</div>
        <div className="mt-3 grid grid-cols-[44px_minmax(0,1fr)] gap-2">
          <LabelJam />
          <KolomHari data={data} tanggal={hariHpTampil} hariIni={hariIni} menitSekarang={menit} onItem={(it) => onItem(hariHpTampil, it)} onSlot={() => onPilihHari(hariHpTampil)} />
        </div>
      </div>
    </section>
  )
}
