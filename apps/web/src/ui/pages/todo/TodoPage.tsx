import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useBolehUbah } from '../../../data/DataProvider'
import { useDataProjek } from '../../../data/pilih'
import { useWaktu } from '../../../data/useWaktu'
import { hariIso, tambahHari } from '../../../domain/tanggal'
import { infoLabel, namaLabel } from '../../../domain/task'
import { belumSelesai } from '../../../domain/todo'
import type { Task } from '../../../domain/tipe'
import { cx } from '../../cx'
import { Button } from '../../kit/Button'
import { Alert, Badge } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import { formatTanggal } from '../../format'
import { galatForm } from '../../formGalat'
import { DUR, riseChild, staggerParent } from '../../motion'
import { Page } from '../../shell/Page'
import { NAMA_HARI } from '../../todo/FormBlok'
import { DaftarEntriHari, ringkasanHari } from '../../todo/DaftarEntriHari'
import { useAksiTodo } from '../../todo/useAksiTodo'
import { useLayananTask } from '../../task/LayananTask'
import { usePageTitle } from '../../usePageTitle'

/** S-14: hari ini dan hari mendatang yang punya entri, plus "Belum selesai" (E-09, E-11). */
export function TodoPage() {
  usePageTitle('To-do')
  const data = useDataProjek()
  const waktu = useWaktu()
  const layanan = useLayananTask()
  const { tambahEntri } = useAksiTodo()
  const { boleh, alasan } = useBolehUbah()
  const [galat, setGalat] = useState<{ taskId: string; pesan: string } | null>(null)

  if (!data || !waktu) return null
  const hariIni = waktu.hariIni
  const besok = tambahHari(hariIni, 1)
  const mendatang = [...new Set(data.entri.filter((e) => e.tanggal > hariIni).map((e) => e.tanggal))].sort()
  const tertunda = belumSelesai(data, hariIni)

  async function keHariIni(task: Task) {
    setGalat(null)
    try {
      await tambahEntri(task, hariIni)
    } catch (e) {
      setGalat({ taskId: task.id, pesan: galatForm(e).umum ?? 'Gagal menambahkan. Coba lagi.' })
    }
  }

  const judulHari = (t: string) => {
    const awalan = t === hariIni ? 'Hari ini' : t === besok ? 'Besok' : NAMA_HARI[hariIso(t)]
    return `${awalan} · ${t === hariIni || t === besok ? `${NAMA_HARI[hariIso(t)]}, ` : ''}${formatTanggal(t)}`
  }

  const seksiHari = (t: string) => {
    const { n, m } = ringkasanHari(data, t)
    return (
      <section key={t} aria-labelledby={`hari-${t}`} className="flex flex-col gap-4 rounded-card bg-card p-6 tactile-convex">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/7 pb-4">
          <h2 id={`hari-${t}`} className="flex items-center gap-2.5 text-headline-md">
            <span aria-hidden="true" className={cx('size-2.5 rounded-full', t === hariIni ? 'bg-primary' : 'bg-line-strong')} />
            {judulHari(t)}
          </h2>
          {m > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-well px-3 py-1 text-body-sm tactile-inset">
              <Icon name="task_alt" size={14} />
              Ringkasan: <b className="font-mono">{n}</b> dari <b className="font-mono">{m}</b> dikerjakan
            </span>
          )}
        </div>
        <DaftarEntriHari tanggal={t} />
      </section>
    )
  }

  return (
    <Page
      title="To-do"
      subtitle="Pilih task untuk tiap hari, lalu beri blok jam di antara Jadwal tetapmu."
      actions={
        <Button icon="add" disabled={!boleh} title={alasan ?? undefined} onClick={() => layanan.bukaFormTask({ mode: 'buat' })}>
          Tambah task
        </Button>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-6">
          <motion.div variants={riseChild}>{seksiHari(hariIni)}</motion.div>
          {mendatang.map((t) => (
            <motion.div key={t} variants={riseChild}>
              {seksiHari(t)}
            </motion.div>
          ))}
          {mendatang.length === 0 && (
            <motion.p variants={riseChild} className="text-body-md text-ink-muted">
              Belum ada task di hari mendatang. Tambahkan lewat tombol “+ To-do” di halaman Task.
            </motion.p>
          )}
        </motion.div>

        <aside aria-labelledby="judul-tertunda" className="flex flex-col gap-4 rounded-card bg-card p-6 tactile-convex lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-2">
            <h2 id="judul-tertunda" className="flex items-center gap-2 text-headline-md">
              <Icon name="history" className="text-danger" />
              Belum selesai
            </h2>
            {tertunda.length > 0 && <Badge kind="telat">{String(tertunda.length)}</Badge>}
          </div>
          <p className="rounded-field bg-well px-4 py-3 text-[0.8125rem] leading-[1.1875rem] text-ink-muted tactile-inset">
            Entri yang tidak dikerjakan dalam 7 hari terakhir. Satu ketukan menambahkannya ke hari ini, tanpa blok jam.
          </p>
          {tertunda.length === 0 ? (
            <p className="flex items-center gap-2 text-body-md text-ink-muted">
              <Icon name="task_alt" className="text-primary" />
              Semua sudah ditangani.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {tertunda.map(({ entri, task }) => (
                  <motion.li
                    key={task.id}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, transition: { duration: DUR.base } }}
                    className="flex flex-col gap-2.5 rounded-field bg-well p-4 tactile-inset"
                  >
                    <div>
                      <b className="block">{task.nama}</b>
                      <span className="text-body-sm text-ink-muted">
                        {namaLabel(infoLabel(data, task))} · direncanakan {formatTanggal(entri.tanggal)}
                      </span>
                    </div>
                    <Button variant="tactile" size="sm" icon="add_circle" disabled={!boleh} onClick={() => void keHariIni(task)}>
                      Tambah ke hari ini
                    </Button>
                    {galat?.taskId === task.id && <Alert tone="error">{galat.pesan}</Alert>}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </aside>
      </div>
    </Page>
  )
}
