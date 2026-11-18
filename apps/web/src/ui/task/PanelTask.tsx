import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useBolehUbah } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { PROGRESS_SELESAI, taskAktif, taskDiLuarPeriode, taskSelesai, taskTelat } from '../../domain/status'
import { hariIso } from '../../domain/tanggal'
import { infoLabel, syaratBukaKembaliTask, taskTerkunci } from '../../domain/task'
import type { Task } from '../../domain/tipe'
import { cx } from '../cx'
import { Button, IconButton } from '../kit/Button'
import { Badge } from '../kit/display'
import { Icon } from '../kit/Icon'
import type { IconName } from '../kit/icons'
import { formatJam, formatRentang, formatTanggal } from '../format'
import { galatForm } from '../formGalat'
import { DUR, EASE_OUT, riseChild, SPRING_SNAPPY, staggerParent } from '../motion'
import { Dialog } from '../overlay/Dialog'
import { useLayananTask } from './LayananTask'

const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

function BarisInfo({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink/6 py-3 last:border-b-0">
      <dt className="flex items-center gap-1.5 text-body-md text-ink-muted">
        <Icon name={icon} size={16} />
        {label}
      </dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}

/** P-01: panel detail task. Panel samping di laptop, layar penuh di HP; tercermin di alamat (J-04). */
export function PanelTask({ task, open, onClose }: { task: Task | undefined; open: boolean; onClose: () => void }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const layanan = useLayananTask()
  const { boleh, alasan } = useBolehUbah()
  const [galat, setGalat] = useState<string>()

  // Panel tetap terpasang agar animasi keluar berjalan; isi memakai task terakhir yang dibuka.
  const [terakhir, setTerakhir] = useState<Task | undefined>(task)
  if (task && task !== terakhir) setTerakhir(task)
  const t = task ?? terakhir

  if (!data || !waktu || !t) return <Dialog open={false} onClose={onClose} title="Detail task" kind="panel" />

  const info = infoLabel(data, t)
  const aktif = taskAktif(t)
  const selesai = taskSelesai(t)
  const telat = taskTelat(t, waktu.hariIni, waktu.menit)
  const kunci = taskTerkunci(data, t, waktu.hariIni)
  const alasanUbah = alasan ?? kunci
  const bisaBuka = selesai && !syaratBukaKembaliTask(data, t, waktu.hariIni)
  const riwayat = data.riwayat
    .filter((r) => r.task_id === t.id)
    .sort((a, b) => (a.tanggal_lokal + String(a.menit_lokal).padStart(4, '0') < b.tanggal_lokal + String(b.menit_lokal).padStart(4, '0') ? 1 : -1))
  const hariRencana = data.entri.filter((e) => e.task_id === t.id).sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))

  async function jalankan(aksi: () => Promise<void>) {
    setGalat(undefined)
    try {
      await aksi()
    } catch (e) {
      setGalat(galatForm(e).umum ?? 'Perubahan tidak tersimpan.')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Detail task" kind="panel">
      <motion.div key={t.id} variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-5">
        <motion.div variants={riseChild} className="flex flex-wrap gap-2">
          {aktif && (
            <>
              <Button variant="tactile" size="sm" icon="edit" disabled={!!alasanUbah} title={alasanUbah ?? undefined} onClick={() => layanan.bukaFormTask({ mode: 'ubah', task: t })}>
                Ubah
              </Button>
              <Button variant="tactile" size="sm" icon="sync" disabled={!!alasanUbah} title={alasanUbah ?? undefined} onClick={() => layanan.bukaFormPindah(t)}>
                Pindahkan
              </Button>
            </>
          )}
        </motion.div>

        <motion.div variants={riseChild} className="flex flex-col gap-2.5 rounded-field bg-card p-4 tactile-convex-sm">
          <div className="flex flex-wrap items-center gap-2">
            {info?.jenis === 'projek' ? (
              <Link to={`/projek/${info.projek.id}`} className="inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-body-sm font-medium text-on-mist">
                <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ backgroundColor: info.projek.warna }} />
                {info.projek.nama}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-raised px-3 py-1 text-body-sm text-ink-muted">
                <Icon name="sell" size={14} />
                {info?.jenis === 'mandiri' ? info.label.nama : 'Mandiri'}
              </span>
            )}
            {telat && <Badge kind="telat" icon="event_busy">Telat</Badge>}
            {info?.jenis === 'projek' && taskDiLuarPeriode(t, info.sesi) && <Badge kind="konteks">Di luar periode</Badge>}
            {selesai && <Badge>Selesai</Badge>}
            {t.batal && <Badge kind="netral-garis">Batal</Badge>}
          </div>
          <p className="text-[1.375rem] leading-[1.875rem] font-semibold">{t.nama}</p>
        </motion.div>

        <motion.dl variants={riseChild} className="rounded-field bg-well px-4 tactile-inset">
          <BarisInfo icon="event" label="Deadline">
            {t.deadline_tanggal ? `${formatTanggal(t.deadline_tanggal)}${t.deadline_menit !== null ? ` · ${formatJam(t.deadline_menit)}` : ''}` : 'Tanpa deadline'}
          </BarisInfo>
          <BarisInfo icon="speed" label="Kesulitan">
            {t.kesulitan} <span className="font-normal text-ink-muted">(dari 5)</span>
          </BarisInfo>
          {info?.jenis === 'projek' && (
            <BarisInfo icon="calendar_today" label="Sesi">
              {info.sesi.nama} <span className="block font-normal text-ink-muted">{formatRentang(info.sesi.mulai, info.sesi.akhir)}</span>
            </BarisInfo>
          )}
        </motion.dl>

        {t.deskripsi && (
          <motion.div variants={riseChild}>
            <p className="lbl">Deskripsi</p>
            {/* Deskripsi tampil sebagai teks biasa (N-43). */}
            <p className="mt-1.5 text-body-md whitespace-pre-line">{t.deskripsi}</p>
          </motion.div>
        )}

        <motion.section variants={riseChild} aria-label="Progress task" className="flex flex-col gap-3 rounded-tile bg-card p-4 tactile-convex">
          <div className="flex items-center justify-between">
            <span className="lbl">Progress task</span>
            <motion.b key={t.progress} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={SPRING_SNAPPY} className="font-mono text-numeric-lg text-primary">
              {t.progress}/10
            </motion.b>
          </div>
          <div className="grid grid-cols-10 gap-1.5 rounded-field bg-well p-2.5 tactile-inset" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <motion.i
                key={i}
                initial={false}
                animate={{ scaleY: i < t.progress ? 1 : 0.82 }}
                transition={SPRING_SNAPPY}
                className={cx('h-5 rounded-md transition-colors', i < t.progress ? (selesai ? 'bg-primary' : 'bg-sage') : 'bg-high')}
              />
            ))}
          </div>
          {aktif && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                <IconButton
                  icon="remove"
                  label={`Kurangi progress ${t.nama}`}
                  size="sm"
                  disabled={!!alasanUbah || t.progress <= 0}
                  onClick={() => void jalankan(() => layanan.ubahProgress(t, t.progress - 1))}
                />
                <IconButton
                  icon="add"
                  label={`Tambah progress ${t.nama}`}
                  size="sm"
                  disabled={!!alasanUbah}
                  onClick={() => void jalankan(() => layanan.ubahProgress(t, t.progress + 1))}
                />
              </div>
              <Button variant="outline" size="sm" disabled={!!alasanUbah} onClick={() => layanan.bukaFormProgress(t)}>
                Perbarui
              </Button>
              <Button size="sm" icon="check" disabled={!!alasanUbah} onClick={() => void jalankan(() => layanan.ubahProgress(t, PROGRESS_SELESAI))}>
                Selesai
              </Button>
            </div>
          )}
          {bisaBuka && (
            <Button variant="tactile" size="sm" icon="restart_alt" disabled={!boleh} onClick={() => void jalankan(() => layanan.bukaKembali(t))}>
              Buka kembali
            </Button>
          )}
          {alasanUbah && aktif && (
            <p className="flex items-center gap-1.5 text-body-sm text-ink-muted">
              <Icon name="lock" size={14} />
              {alasanUbah}
            </p>
          )}
          <AnimatePresence>
            {galat && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } }}
                exit={{ opacity: 0 }}
                className="rounded-field bg-danger-soft px-3 py-2 text-body-sm text-on-danger-soft"
              >
                {galat}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.section variants={riseChild} aria-labelledby="hari-terencana" className="flex flex-col gap-2.5">
          <h3 id="hari-terencana" className="lbl flex items-center gap-1.5">
            <Icon name="calendar_today" size={14} />
            Hari terencana
          </h3>
          {hariRencana.length === 0 ? (
            <p className="text-body-sm text-ink-muted">Belum direncanakan di to-do mana pun.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {hariRencana.map((e) => (
                <li key={e.id}>
                  <Link
                    to="/todo"
                    className={cx(
                      'flex items-center justify-between gap-3 rounded-field bg-card px-4 py-3 tactile-convex-sm hover:text-primary',
                      e.tanggal === waktu.hariIni && 'shadow-[inset_3px_0_0_var(--sb-primary),var(--sb-shadow-convex-sm)]',
                    )}
                  >
                    <span className="font-semibold">
                      {HARI[hariIso(e.tanggal)]}, {formatTanggal(e.tanggal)}
                    </span>
                    <span className="flex items-center gap-2">
                      {e.tanggal === waktu.hariIni && <Badge kind="info">hari ini</Badge>}
                      {e.ceklis && <Icon name="check_circle" size={16} className="text-primary" />}
                      <Icon name="chevron_right" size={16} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section variants={riseChild} aria-labelledby="riwayat-progress" className="flex flex-col gap-2.5">
          <h3 id="riwayat-progress" className="lbl flex items-center gap-1.5">
            <Icon name="history" size={14} />
            Riwayat progress
          </h3>
          {riwayat.length === 0 ? (
            <p className="text-body-sm text-ink-muted">Belum ada perubahan progress.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {riwayat.map((r) => (
                <li key={r.id} className="flex items-start gap-3">
                  <span className="shrink-0 rounded-full bg-mint px-2 py-0.5 font-mono text-body-sm font-bold text-on-mint">
                    {r.sebelum}→{r.sesudah}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold">
                      {formatTanggal(r.tanggal_lokal)} · {formatJam(r.menit_lokal)}
                      {r.penanda === 'selesai' && <span className="ml-2 text-primary">Selesai</span>}
                      {r.penanda === 'buka_kembali' && <span className="ml-2 text-ink-muted">Dibuka kembali</span>}
                    </p>
                    {r.deskripsi && <p className="text-body-sm whitespace-pre-line text-ink-muted">{r.deskripsi}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </motion.section>

        {aktif && (
          <motion.div variants={riseChild} className="border-t border-ink/7 pt-4">
            <Button
              variant="tactile"
              size="sm"
              icon="cancel"
              disabled={!!alasanUbah}
              onClick={() => layanan.mintaBatal(t)}
              className="text-danger shadow-[inset_0_0_0_1px_var(--sb-danger),var(--sb-shadow-button)] hover:text-danger"
            >
              Batalkan task
            </Button>
          </motion.div>
        )}
      </motion.div>
    </Dialog>
  )
}
