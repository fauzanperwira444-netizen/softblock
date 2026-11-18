import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useBolehUbah } from '../../../data/DataProvider'
import { useDataProjek } from '../../../data/pilih'
import { useWaktu } from '../../../data/useWaktu'
import { LABEL_STATUS_PROJEK, projekTertutup, type StatusProjek } from '../../../domain/status'
import { cx } from '../../cx'
import { Button } from '../../kit/Button'
import { Badge, EmptyState } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import { formatTanggal } from '../../format'
import { DUR, EASE_OUT, riseChild, SPRING_SOFT, staggerParent } from '../../motion'
import { Page } from '../../shell/Page'
import { usePageTitle } from '../../usePageTitle'
import { FormProjek } from './FormProjek'
import { BADGE_STATUS, bandingkanProjek, ringkas, type RingkasanProjek } from './tampilan'

type Filter = 'semua' | StatusProjek

const FILTER: Array<{ value: Filter; label: string }> = [
  { value: 'semua', label: 'Semua' },
  { value: 'berjalan', label: 'Berjalan' },
  { value: 'jeda', label: 'Jeda' },
  { value: 'belum_mulai', label: 'Belum mulai' },
  { value: 'belum_dijadwalkan', label: 'Belum dijadwalkan' },
  { value: 'melewati_jadwal', label: 'Melewati jadwal' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Batal' },
]

function KartuProjek({ r, tertutup }: { r: RingkasanProjek; tertutup: boolean }) {
  const telat = r.status === 'melewati_jadwal'
  const badge = BADGE_STATUS[r.status]
  return (
    <motion.div whileHover={tertutup ? {} : { y: -2 }} transition={{ duration: DUR.fast, ease: EASE_OUT }}>
      <Link
        to={`/projek/${r.projek.id}`}
        className={cx(
          'flex flex-wrap items-center gap-x-6 gap-y-4 rounded-tile px-6 py-5 transition-shadow',
          tertutup ? 'bg-well text-ink-muted' : 'bg-card tactile-convex',
          telat && 'shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--sb-danger)_30%,transparent),var(--sb-shadow-convex)]',
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            'inline-flex size-13 shrink-0 items-center justify-center rounded-full',
            telat ? 'bg-danger-soft text-on-danger-soft' : r.status === 'berjalan' ? 'bg-mist text-primary' : 'bg-high text-ink-muted',
          )}
        >
          <Icon name={tertutup ? (r.status === 'batal' ? 'block' : 'check_circle') : 'folder'} />
        </span>
        <div className="min-w-0 flex-[1_1_300px]">
          <div className="flex items-center gap-2">
            <b className={cx('truncate text-[1.1875rem] leading-[1.625rem]', tertutup ? 'line-through' : 'text-ink')}>{r.projek.nama}</b>
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: r.projek.warna }} />
          </div>
          {r.projek.deskripsi && <p className="mt-0.5 line-clamp-1 text-body-md text-ink-muted">{r.projek.deskripsi}</p>}
          <p className={cx('mt-1.5 flex items-center gap-1.5 text-body-sm font-medium', telat ? 'text-danger' : 'text-ink-muted')}>
            <Icon name={telat ? 'warning' : r.status === 'jeda' ? 'pause' : 'event'} size={14} />
            {r.meta}
          </p>
        </div>
        <div className="min-w-[220px] flex-[0_1_300px]">
          <div className="flex justify-between gap-2 font-mono text-body-sm text-ink-muted">
            <span>{r.awal ? formatTanggal(r.awal) : 'Belum ditetapkan'}</span>
            <span className={cx('font-bold', telat ? 'text-danger' : 'text-primary')}>{r.tengah}</span>
            <span>{r.akhir ? formatTanggal(r.akhir) : '-'}</span>
          </div>
          <div className="my-1.5 rounded-full bg-well p-1 tactile-inset" aria-hidden="true">
            <motion.div
              className={cx('h-2 origin-left rounded-full', telat ? 'bg-danger' : tertutup ? 'bg-line' : 'bg-primary')}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: r.persen / 100 }}
              transition={SPRING_SOFT}
            />
          </div>
          <div className="flex justify-between gap-2 text-body-sm">
            <span className="text-ink-muted">{r.sisa}</span>
            <b className={cx('font-mono', telat ? 'text-danger' : 'text-primary')}>{r.m === 0 ? '-' : `${r.persen}%`}</b>
          </div>
        </div>
        <Badge kind={badge.kind} icon={badge.icon}>
          {LABEL_STATUS_PROJEK[r.status]}
        </Badge>
        <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-full bg-card tactile-button">
          <Icon name="chevron_right" size={18} />
        </span>
      </Link>
    </motion.div>
  )
}

export function ProjekPage() {
  usePageTitle('Projek')
  const data = useDataProjek()
  const waktu = useWaktu()
  const { boleh, alasan } = useBolehUbah()
  const [params, setParams] = useSearchParams()
  const [formBuka, setFormBuka] = useState(false)
  const [tertutupBuka, setTertutupBuka] = useState(true)

  // Filter di alamat agar tombol kembali memulihkannya; membuka dari menu utama mereset ke Semua (J-05).
  const filter = (params.get('status') as Filter | null) ?? 'semua'
  const pilihFilter = (f: Filter) => setParams(f === 'semua' ? {} : { status: f }, { replace: true })

  const semua = useMemo(
    () => (data && waktu ? data.projek.map((p) => ringkas(data, p, waktu.hariIni)).sort(bandingkanProjek) : []),
    [data, waktu],
  )
  if (!data || !waktu) return null

  const cocok = (r: RingkasanProjek) => filter === 'semua' || r.status === filter
  const terbuka = semua.filter((r) => !projekTertutup(r.status) && cocok(r))
  const tertutup = semua.filter((r) => projekTertutup(r.status) && cocok(r))
  const jumlah = (f: Filter) => (f === 'semua' ? semua.length : semua.filter((r) => r.status === f).length)
  const berjalan = jumlah('berjalan')
  const terlambat = jumlah('melewati_jadwal')

  return (
    <Page
      title="Projek"
      subtitle="Kelola sesi kerja dan sebaran task tiap projek."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {semua.length > 0 && (
            <p className="flex items-center gap-4 rounded-full bg-well px-4 py-2 text-body-sm text-ink-muted tactile-inset">
              <span className="font-mono font-bold text-ink">{semua.length} total</span>
              <span className="flex items-center gap-1.5">
                <i aria-hidden="true" className="size-2 rounded-full bg-primary" />
                {berjalan} berjalan
              </span>
              {terlambat > 0 && (
                <span className="flex items-center gap-1.5 text-danger">
                  <i aria-hidden="true" className="size-2 rounded-full bg-danger" />
                  {terlambat} melewati jadwal
                </span>
              )}
            </p>
          )}
          <Button icon="add" onClick={() => setFormBuka(true)} disabled={!boleh} title={alasan ?? undefined}>
            Buat projek
          </Button>
        </div>
      }
    >
      {semua.length === 0 ? (
        <EmptyState
          icon="create_new_folder"
          title="Belum ada projek"
          action={
            <Button icon="add" onClick={() => setFormBuka(true)} disabled={!boleh}>
              Buat projek
            </Button>
          }
        >
          Projek mewadahi sesi bertanggal dan task di dalamnya.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter status">
            <span className="lbl mr-1">Status</span>
            {FILTER.map((f) => {
              const aktif = filter === f.value
              const n = jumlah(f.value)
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => pilihFilter(f.value)}
                  className={cx(
                    'relative inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-body-md font-semibold transition-colors',
                    aktif ? 'text-ink' : 'text-ink-muted hover:text-ink',
                    f.value === 'melewati_jadwal' && n > 0 && !aktif && 'text-danger',
                  )}
                >
                  {aktif && (
                    <motion.span layoutId="filter-projek" transition={SPRING_SOFT} className="absolute inset-0 rounded-full bg-card tactile-button" aria-hidden="true" />
                  )}
                  <span className="relative">{f.label}</span>
                  <span className="relative rounded-full bg-well px-1.5 font-mono text-body-sm">{n}</span>
                </button>
              )
            })}
          </div>

          {terbuka.length === 0 && tertutup.length === 0 ? (
            <EmptyState icon="folder_off" title="Tidak ada projek dengan status ini">
              Ganti filter atau buat projek baru.
            </EmptyState>
          ) : (
            terbuka.length > 0 && (
              <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {terbuka.map((r) => (
                    <motion.li key={r.projek.id} layout variants={riseChild} exit={{ opacity: 0, transition: { duration: DUR.fast } }}>
                      <KartuProjek r={r} tertutup={false} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )
          )}

          {tertutup.length > 0 && (
            <section className="flex flex-col gap-4">
              <button
                type="button"
                aria-expanded={tertutupBuka}
                onClick={() => setTertutupBuka((b) => !b)}
                className="flex min-h-11 items-center justify-between border-t border-ink/8 pt-3 text-left"
              >
                <span className="flex items-center gap-2 text-headline-md">
                  <motion.span animate={{ rotate: tertutupBuka ? 0 : -90 }} transition={{ duration: DUR.fast }} className="inline-flex">
                    <Icon name="keyboard_arrow_down" />
                  </motion.span>
                  Tertutup ({tertutup.length})
                </span>
                <span className="lbl">Selesai dan batal</span>
              </button>
              <AnimatePresence initial={false}>
                {tertutupBuka && (
                  <motion.ul
                    variants={staggerParent}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                    className="flex flex-col gap-4"
                  >
                    {tertutup.map((r) => (
                      <motion.li key={r.projek.id} variants={riseChild}>
                        <KartuProjek r={r} tertutup />
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      )}
      <FormProjek open={formBuka} onClose={() => setFormBuka(false)} />
    </Page>
  )
}
