import { AnimatePresence, motion } from 'motion/react'
import { useDataProjek } from '../../data/pilih'
import { dikerjakan, statusEntri } from '../../domain/todo'
import type { Tanggal } from '../../domain/tipe'
import { DUR, riseChild, staggerParent } from '../motion'
import { BarisEntri } from './BarisEntri'

/**
 * Daftar entri satu hari, dipakai halaman To-do dan panel hari Kalender (E-11).
 * Entri berblok diurut jam blok pertama; entri tanpa blok dikelompokkan "Belum diberi jam".
 */
export function DaftarEntriHari({ tanggal }: { tanggal: Tanggal }) {
  const data = useDataProjek()
  if (!data) return null

  const entri = data.entri.filter((e) => e.tanggal === tanggal)
  const mulaiPertama = (id: string) => Math.min(...data.blok.filter((b) => b.entri_id === id).map((b) => b.mulai_menit))
  const berblok = entri.filter((e) => data.blok.some((b) => b.entri_id === e.id)).sort((a, b) => mulaiPertama(a.id) - mulaiPertama(b.id))
  const tanpaBlok = entri.filter((e) => !data.blok.some((b) => b.entri_id === e.id))

  const daftar = (isi: typeof entri) => (
    <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-2.5">
      <AnimatePresence mode="popLayout" initial={false}>
        {isi.map((e) => (
          <motion.li key={e.id} variants={riseChild} exit={{ opacity: 0, x: 28, transition: { duration: DUR.base } }}>
            <BarisEntri entri={e} />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  )

  if (entri.length === 0) {
    return <p className="rounded-field bg-well px-4 py-3 text-body-md text-ink-muted tactile-inset">Belum ada task di hari ini.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {berblok.length > 0 && daftar(berblok)}
      {tanpaBlok.length > 0 && (
        <section className="flex flex-col gap-2.5" aria-label={`Belum diberi jam (${tanpaBlok.length})`}>
          <div className="flex items-center gap-3">
            <span className="lbl">Belum diberi jam ({tanpaBlok.length})</span>
            <span aria-hidden="true" className="h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--sb-line)_0_4px,transparent_4px_8px)]" />
          </div>
          {daftar(tanpaBlok)}
        </section>
      )}
    </div>
  )
}

/** "N dari M dikerjakan" untuk satu hari. */
export function ringkasanHari(data: NonNullable<ReturnType<typeof useDataProjek>>, tanggal: Tanggal): { n: number; m: number } {
  const entri = data.entri.filter((e) => e.tanggal === tanggal)
  const n = entri.filter((e) => {
    const t = data.task.find((x) => x.id === e.task_id)
    return t ? dikerjakan(statusEntri(e, t, data.riwayat)) : false
  }).length
  return { n, m: entri.length }
}
