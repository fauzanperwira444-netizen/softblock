import { motion } from 'motion/react'
import { Link } from 'react-router'
import type { DataLengkap } from '../../data/pilih'
import { formatDurasi } from '../../domain/jamKosong'
import type { Tanggal } from '../../domain/tipe'
import { cx } from '../cx'
import { formatTanggal } from '../format'
import { DUR, SPRING_SNAPPY } from '../motion'
import { deadlinePadaTanggal, garisPadaTanggal, jamKosongHari, selBulan, usePolaProjek } from './dataKalender'
import { ContohPola, GarisSesi, NAMA_POLA } from './GarisSesi'

const NAMA_HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const MAKS_GARIS = 3

type Props = { data: DataLengkap; bulan: Tanggal; hariIni: Tanggal; onPilihHari: (t: Tanggal) => void }

/** G-01, G-02: tampilan bulan. Hari lampau hanya menampilkan garis sesi. */
export function TampilanBulan({ data, bulan, hariIni, onPilihHari }: Props) {
  const pola = usePolaProjek(data)
  const sel = selBulan(bulan)
  const kodeBulan = bulan.slice(0, 7)
  const projekTampil = new Map<string, { nama: string; warna: string; pola: ReturnType<typeof pola> }>()

  return (
    <section aria-label={`Kalender bulan ${formatTanggal(`${kodeBulan}-01`).replace(/^1 /, '')}`} className="flex flex-col gap-3 rounded-card bg-card p-3 tactile-convex sm:p-5">
      <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2.5" aria-hidden="true">
        {NAMA_HARI_PENDEK.map((h) => (
          <span key={h} className="lbl">
            {h}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {sel.map((t, i) => {
          const diBulan = t.slice(0, 7) === kodeBulan
          const lampau = t < hariIni
          const garis = garisPadaTanggal(data, t, pola)
          for (const g of garis) projekTampil.set(g.projek.id, { nama: g.projek.nama, warna: g.projek.warna, pola: g.pola })
          const dl = lampau ? 0 : deadlinePadaTanggal(data, t).length
          const kosong = lampau ? null : jamKosongHari(data, t)
          const label = `${formatTanggal(t)}${t === hariIni ? ', hari ini' : ''}${garis.length ? `, ${garis.length} sesi` : ''}${dl ? `, ${dl} deadline` : ''}${kosong !== null ? `, ${formatDurasi(kosong)} kosong` : ''}`
          return (
            <motion.button
              key={t}
              type="button"
              aria-label={label}
              onClick={() => onPilihHari(t)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: DUR.slow, delay: Math.min(i, 13) * 0.012 } }}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SNAPPY}
              className={cx(
                'flex min-h-20 flex-col gap-1 rounded-tile p-1.5 text-left sm:min-h-28 sm:p-2.5',
                diBulan ? 'bg-well tactile-inset' : 'bg-transparent opacity-50',
                t === hariIni && 'shadow-[inset_0_0_0_2px_var(--sb-primary),var(--sb-shadow-inset)]',
              )}
            >
              <span className="flex w-full items-center justify-between gap-1">
                <b className={cx('font-mono text-body-md', t === hariIni && 'text-primary')}>{Number(t.slice(8))}</b>
                {dl > 0 && (
                  <span className="rounded-full bg-danger px-1.5 font-mono text-[0.6875rem] font-bold text-on-danger" aria-hidden="true">
                    {dl} dl
                  </span>
                )}
              </span>
              {garis.slice(0, MAKS_GARIS).map((g) => (
                <span key={g.sesi.id} className="w-full">
                  <GarisSesi warna={g.projek.warna} pola={g.pola} className="hidden sm:block">
                    {g.projek.nama} · {g.sesi.nama}
                  </GarisSesi>
                  <GarisSesi warna={g.projek.warna} pola={g.pola} ringkas className="sm:hidden" />
                </span>
              ))}
              {garis.length > MAKS_GARIS && <span className="text-body-sm text-ink-muted">+{garis.length - MAKS_GARIS}</span>}
              {kosong !== null && diBulan && (
                <span className="mt-auto hidden font-mono text-[0.6875rem] text-ink-muted sm:block" aria-hidden="true">
                  {formatDurasi(kosong)} kosong
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
      {projekTampil.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/6 pt-3 text-body-sm">
          <span className="lbl">Legenda projek</span>
          {[...projekTampil.entries()].map(([id, p]) => (
            <Link key={id} to={`/projek/${id}`} className="inline-flex min-h-11 items-center gap-1.5 hover:text-primary sm:min-h-0">
              <ContohPola warna={p.warna} pola={p.pola} />
              {p.nama} <span className="text-ink-muted">({NAMA_POLA[p.pola]})</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
