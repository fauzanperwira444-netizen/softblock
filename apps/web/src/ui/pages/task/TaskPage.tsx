import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useBolehUbah } from '../../../data/DataProvider'
import { useDataProjek } from '../../../data/pilih'
import { useWaktu } from '../../../data/useWaktu'
import { taskAktif } from '../../../domain/status'
import { FILTER_AWAL, saringTask, type FilterTask, type StatusFilter } from '../../../domain/task'
import { cx } from '../../cx'
import { Button } from '../../kit/Button'
import { EmptyState } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import { SelectField } from '../../kit/fields'
import { formatRentang } from '../../format'
import { DUR, riseChild, SPRING_SOFT, staggerParent } from '../../motion'
import { Page } from '../../shell/Page'
import { BarisTask } from '../../task/BarisTask'
import { DialogLabel } from '../../task/DialogLabel'
import { useLayananTask } from '../../task/LayananTask'
import { usePageTitle } from '../../usePageTitle'

const STATUS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'telat', label: 'Telat' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Batal' },
  { value: 'luar', label: 'Di luar periode' },
  { value: 'tanpa_deadline', label: 'Tanpa deadline' },
  { value: 'semua', label: 'Semua' },
]

/**
 * Filter disimpan di alamat: tombol kembali memulihkannya, sedangkan membuka Task dari menu utama
 * (alamat tanpa parameter) kembali ke Aktif (H-03, J-05).
 */
function bacaFilter(p: URLSearchParams): FilterTask {
  const status = p.get('status') as StatusFilter | null
  return {
    projek: p.get('projek') ?? '',
    sesi: p.get('sesi') ?? '',
    label: p.get('label') ?? '',
    status: status ?? FILTER_AWAL.status,
    statusEksplisit: !!status,
    cari: p.get('cari') ?? '',
  }
}

export function TaskPage() {
  usePageTitle('Task')
  const data = useDataProjek()
  const waktu = useWaktu()
  const layanan = useLayananTask()
  const { boleh, alasan } = useBolehUbah()
  const [params, setParams] = useSearchParams()
  const [labelBuka, setLabelBuka] = useState(false)
  const filter = useMemo(() => bacaFilter(params), [params])

  function setFilter(ubah: Partial<Record<'projek' | 'sesi' | 'label' | 'status' | 'cari', string>>) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(ubah)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    if (ubah.projek !== undefined) p.delete('sesi')
    setParams(p, { replace: true })
  }

  const hasil = useMemo(() => (data && waktu ? saringTask(data, filter, waktu.hariIni, waktu.menit) : []), [data, waktu, filter])
  if (!data || !waktu) return null

  const jumlahAktif = data.task.filter(taskAktif).length
  const projekUrut = [...data.projek].sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
  const sesiPilihan = filter.projek && filter.projek !== 'mandiri' ? data.sesi.filter((s) => s.projek_id === filter.projek) : []
  const adaFilter = filter.projek || filter.sesi || filter.label || filter.statusEksplisit || filter.cari
  const statusTampil = filter.cari && !filter.statusEksplisit ? 'semua' : filter.status
  const tanpaDeadline = statusTampil === 'aktif' ? hasil.filter((t) => !t.deadline_tanggal) : []
  const utama = statusTampil === 'aktif' ? hasil.filter((t) => t.deadline_tanggal) : hasil

  const daftar = (tasks: typeof hasil) => (
    <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {tasks.map((t) => (
          <motion.li key={t.id} variants={riseChild} exit={{ opacity: 0, x: 28, scale: 0.97, transition: { duration: DUR.base } }}>
            <BarisTask task={t} onPilihLabel={(id) => setFilter({ label: id, projek: '' })} />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  )

  return (
    <Page
      title="Daftar task"
      subtitle="Kelola prioritas pengerjaan dan pantau progres."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-well px-3 py-1.5 text-body-sm font-medium tactile-inset">
            <Icon name="checklist" size={16} />
            <span className="font-mono font-bold">{jumlahAktif}</span> task aktif
          </span>
          <Button variant="tactile" icon="sell" onClick={() => setLabelBuka(true)}>
            Kelola label
          </Button>
          <Button icon="add" disabled={!boleh} title={alasan ?? undefined} onClick={() => layanan.bukaFormTask({ mode: 'buat' })}>
            Tambah task
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 rounded-card bg-well p-4 tactile-inset">
        <div className="relative">
          <label htmlFor="cari-task" className="sr-only">
            Cari task, projek, atau label
          </label>
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted">
            <Icon name="search" size={18} />
          </span>
          <input
            id="cari-task"
            type="search"
            value={filter.cari}
            onChange={(e) => setFilter({ cari: e.target.value })}
            placeholder="Cari nama task, projek, atau label…"
            className="min-h-12 w-full rounded-full bg-card pr-4 pl-11 text-body-md tactile-button outline-none focus-visible:shadow-[var(--sb-shadow-button),0_0_0_2px_var(--sb-primary)]"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField label="Projek" value={filter.projek} onChange={(e) => setFilter({ projek: e.target.value })}>
            <option value="">Semua</option>
            <option value="mandiri">Mandiri</option>
            {projekUrut.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </SelectField>
          <SelectField label="Sesi" value={filter.sesi} onChange={(e) => setFilter({ sesi: e.target.value })} disabled={sesiPilihan.length === 0}>
            <option value="">{sesiPilihan.length === 0 ? 'Pilih projek dulu' : 'Semua sesi'}</option>
            {sesiPilihan.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({formatRentang(s.mulai, s.akhir)})
              </option>
            ))}
          </SelectField>
          <SelectField label="Label" value={filter.label} onChange={(e) => setFilter({ label: e.target.value })}>
            <option value="">Semua label</option>
            {data.label.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nama}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter status">
          <span className="lbl mr-1">Status</span>
          {STATUS.map((s) => {
            const aktif = statusTampil === s.value
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={aktif}
                onClick={() => setFilter({ status: s.value })}
                className={cx('relative inline-flex min-h-11 items-center rounded-full px-4 text-body-md font-semibold', aktif ? 'text-ink' : 'text-ink-muted hover:text-ink')}
              >
                {aktif && <motion.span layoutId="filter-status-task" transition={SPRING_SOFT} className="absolute inset-0 rounded-full bg-card tactile-button" />}
                <span className="relative">{s.label}</span>
              </button>
            )
          })}
          {adaFilter && (
            <button type="button" onClick={() => setParams({}, { replace: true })} className="ml-auto min-h-11 px-2 text-body-md font-semibold text-primary underline-offset-4 hover:underline">
              Reset
            </button>
          )}
        </div>
        {filter.cari && !filter.statusEksplisit && <p className="text-body-sm text-ink-muted">Pencarian menampilkan semua status: aktif, selesai, lalu batal.</p>}
      </div>

      {hasil.length === 0 ? (
        <EmptyState
          icon="inbox"
          title={data.task.length === 0 ? 'Belum ada task' : 'Tidak ada task yang cocok'}
          action={
            <Button icon="add" disabled={!boleh} onClick={() => layanan.bukaFormTask({ mode: 'buat' })}>
              Tambah task
            </Button>
          }
        >
          {data.task.length === 0 ? 'Task yang kamu buat akan muncul di sini.' : 'Ganti filter atau kata kunci, atau buat task baru.'}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {utama.length > 0 && daftar(utama)}
          {tanpaDeadline.length > 0 && (
            <section aria-labelledby="judul-tanpa-deadline" className="flex flex-col gap-3">
              <h2 id="judul-tanpa-deadline" className="lbl">
                Tanpa deadline ({tanpaDeadline.length})
              </h2>
              {daftar(tanpaDeadline)}
            </section>
          )}
        </div>
      )}
      <DialogLabel open={labelBuka} onClose={() => setLabelBuka(false)} />
    </Page>
  )
}
