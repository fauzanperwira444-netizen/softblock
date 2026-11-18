import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useBolehUbah } from '../../../data/DataProvider'
import { useDataProjek, type DataLengkap } from '../../../data/pilih'
import { useWaktu } from '../../../data/useWaktu'
import { formatDurasi, jamKosong } from '../../../domain/jamKosong'
import { bandingkanTaskAktif, LABEL_STATUS_PROJEK, projekTertutup, taskAktif, taskTelat } from '../../../domain/status'
import { taskProjek } from '../../../domain/projek'
import { tambahHari } from '../../../domain/tanggal'
import { belumSelesai, statusEntri } from '../../../domain/todo'
import type { Menit, Tanggal } from '../../../domain/tipe'
import { cx } from '../../cx'
import { Button } from '../../kit/Button'
import { Badge, Card, CardTitle } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import type { IconName } from '../../kit/icons'
import { formatJam, formatTanggal } from '../../format'
import { riseChild, staggerParent } from '../../motion'
import { BarisTask } from '../../task/BarisTask'
import { useLayananTask } from '../../task/LayananTask'
import { usePageTitle } from '../../usePageTitle'
import { BADGE_STATUS, bandingkanProjek, ringkas } from '../projek/tampilan'
import { KalenderMini } from './KalenderMini'
import { PolaKerja } from './PolaKerja'

const MAKS_TELAT = 5
const MAKS_PROJEK = 5

/**
 * S-10 (D-01): laptop = kolom utama Telat lalu 7 hari, kolom samping to-do, jam kosong, kalender mini;
 * di bawahnya Projek lalu Pola kerja. Di HP kolom dilebur (`contents`) dan urutan N-54 memakai `order`.
 */
export function DashboardPage() {
  usePageTitle('Dashboard')
  const data = useDataProjek()
  const waktu = useWaktu()
  const layanan = useLayananTask()
  const { boleh, alasan } = useBolehUbah()
  if (!data || !waktu) return null
  const { hariIni, menit } = waktu

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-8">
      <motion.div variants={riseChild} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-xl-mobile md:text-headline-xl">Dashboard</h1>
          <p className="mt-1 text-[0.9375rem] leading-[1.375rem] text-ink-muted">Hari ini {formatTanggal(hariIni)}.</p>
        </div>
        <Button icon="add" disabled={!boleh} title={alasan ?? undefined} onClick={() => layanan.bukaFormTask({ mode: 'buat' })}>
          Tambah task
        </Button>
      </motion.div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <Bagian className="order-1 lg:order-none">
            <Telat data={data} hariIni={hariIni} menit={menit} />
          </Bagian>
          <Bagian className="order-4 lg:order-none">
            <TujuhHari data={data} hariIni={hariIni} menit={menit} />
          </Bagian>
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <Bagian className="order-3 lg:order-none">
            <RingkasanTodo data={data} hariIni={hariIni} />
          </Bagian>
          <Bagian className="order-2 lg:order-none">
            <JamKosongHariIni data={data} hariIni={hariIni} menit={menit} />
          </Bagian>
          <Bagian className="order-5 lg:order-none">
            <KalenderMini data={data} hariIni={hariIni} />
          </Bagian>
        </div>
        <Bagian className="order-6 lg:order-none lg:col-span-2">
          <DaftarProjek data={data} hariIni={hariIni} menit={menit} />
        </Bagian>
        <Bagian className="order-7 lg:order-none lg:col-span-2">
          <PolaKerja hariIni={hariIni} awalData={data.task.reduce((min, t) => (t.dibuat_tanggal_lokal < min ? t.dibuat_tanggal_lokal : min), hariIni)} />
        </Bagian>
      </div>
    </motion.div>
  )
}

function Bagian({ className, children }: { className: string; children: ReactNode }) {
  return (
    <motion.div variants={riseChild} className={className}>
      {children}
    </motion.div>
  )
}

function KepalaBagian({ id, icon, judul, ujung }: { id: string; icon: IconName; judul: ReactNode; ujung?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id={id} className="flex items-center gap-2.5 text-headline-md">
        <Icon name={icon} className="text-primary" />
        {judul}
      </h2>
      {ujung}
    </div>
  )
}

function TautanSemua({ to, children = 'Lihat semua' }: { to: string; children?: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1 text-body-sm font-semibold text-primary underline-offset-4 hover:underline">
      {children}
      <Icon name="arrow_forward" size={16} />
    </Link>
  )
}

function Kosong({ icon, children, aksi }: { icon: IconName; children: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-tile bg-well px-5 py-4 text-ink-muted tactile-inset">
      <Icon name={icon} className="text-primary" />
      <p className="min-w-0 flex-1">{children}</p>
      {aksi}
    </div>
  )
}

type PropsBagian = { data: DataLengkap; hariIni: Tanggal; menit: Menit }

/** D-02: maks 5, paling lama telat dulu (deadline paling awal), lalu kesulitan, lalu abjad. */
function Telat({ data, hariIni, menit }: PropsBagian) {
  const semua = data.task.filter((t) => taskTelat(t, hariIni, menit)).sort(bandingkanTaskAktif)
  return (
    <section aria-labelledby="dash-telat" className="flex flex-col gap-4">
      <KepalaBagian
        id="dash-telat"
        icon="warning"
        judul={
          <>
            Telat
            {semua.length > 0 && <Badge kind="telat">{`${semua.length} task`}</Badge>}
          </>
        }
        ujung={semua.length > MAKS_TELAT && <TautanSemua to="/task?status=telat" />}
      />
      {semua.length === 0 ? (
        <Kosong icon="task_alt">Tidak ada task telat.</Kosong>
      ) : (
        <ul className="flex flex-col gap-3">
          {semua.slice(0, MAKS_TELAT).map((t) => (
            <li key={t.id}>
              <BarisTask task={t} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** D-03, D-05: aktif, belum telat, deadline hari ini sampai 7 hari ke depan; tanpa deadline tidak tampil. */
function TujuhHari({ data, hariIni, menit }: PropsBagian) {
  const layanan = useLayananTask()
  const { boleh } = useBolehUbah()
  const batas = tambahHari(hariIni, 7)
  const daftar = data.task
    .filter((t) => taskAktif(t) && !taskTelat(t, hariIni, menit) && t.deadline_tanggal && t.deadline_tanggal >= hariIni && t.deadline_tanggal <= batas)
    .sort(bandingkanTaskAktif)
  return (
    <section aria-labelledby="dash-tujuh" className="flex flex-col gap-4">
      <KepalaBagian
        id="dash-tujuh"
        icon="event"
        judul="Hari ini dan 7 hari ke depan"
        ujung={daftar.length > 0 && <span className="font-mono text-body-sm text-ink-muted">{daftar.length} task</span>}
      />
      {daftar.length === 0 ? (
        <Kosong
          icon="event"
          aksi={
            <Button size="sm" variant="tactile" icon="add" disabled={!boleh} onClick={() => layanan.bukaFormTask({ mode: 'buat' })}>
              Tambah task
            </Button>
          }
        >
          Tidak ada deadline sampai {formatTanggal(batas)}.
        </Kosong>
      ) : (
        <ul className="flex flex-col gap-3">
          {daftar.map((t) => (
            <li key={t.id}>
              <BarisTask task={t} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** D-06: entri hari ini, yang dikerjakan atau selesai, dan jumlah "Belum selesai" (E-09). */
function RingkasanTodo({ data, hariIni }: { data: DataLengkap; hariIni: Tanggal }) {
  const entri = data.entri.filter((e) => e.tanggal === hariIni)
  let dikerjakan = 0
  for (const e of entri) {
    const t = data.task.find((x) => x.id === e.task_id)
    if (!t) continue
    const s = statusEntri(e, t, data.riwayat)
    if (s === 'dikerjakan' || s === 'selesai') dikerjakan++
  }
  const belum = belumSelesai(data, hariIni).length
  const persen = entri.length === 0 ? 0 : (dikerjakan / entri.length) * 100

  return (
    <Card className="flex flex-col gap-4" aria-labelledby="dash-todo">
      <CardTitle icon="checklist" id="dash-todo" end={<TautanSemua to="/todo">Buka To-do</TautanSemua>}>
        To-do hari ini
      </CardTitle>
      {entri.length === 0 ? (
        <p className="text-ink-muted">Belum ada entri untuk hari ini. Tambahkan task dari Daftar Task atau halaman To-do.</p>
      ) : (
        <>
          <p>
            <b className="font-mono">{entri.length}</b> entri hari ini, <b className="font-mono">{dikerjakan}</b> dikerjakan.
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-high" aria-hidden="true">
            <motion.div initial={{ width: 0 }} animate={{ width: `${persen}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-primary" />
          </div>
        </>
      )}
      {belum > 0 && (
        <Link to="/todo" className="inline-flex min-h-11 items-center gap-2 rounded-field bg-danger-soft px-4 text-body-sm font-semibold text-on-danger-soft hover:underline">
          <Icon name="history" size={16} className="text-danger" />
          {belum} belum selesai dari 7 hari terakhir
        </Link>
      )}
    </Card>
  )
}

/** D-09: dipotong di "sekarang" lebih dulu, slot di bawah 30 menit tidak dihitung. */
function JamKosongHariIni({ data, hariIni, menit }: PropsBagian) {
  const hasil = jamKosong(data, hariIni, menit)
  const t = hasil.terpanjang
  return (
    <Card className="flex flex-col gap-3" aria-labelledby="dash-kosong">
      <CardTitle icon="hourglass_empty" id="dash-kosong">
        Jam kosong hari ini
      </CardTitle>
      {hasil.total === 0 || !t ? (
        <p className="text-ink-muted">Tidak ada jam kosong tersisa sampai 24.00.</p>
      ) : (
        <>
          <p>
            Sisa <b className="font-mono">{formatDurasi(hasil.total)}</b> sampai 24.00. Slot terpanjang <b className="font-mono">{formatDurasi(t.selesai - t.mulai)}</b> (
            <span className="font-mono">
              {formatJam(t.mulai)}–{formatJam(t.selesai)}
            </span>
            ).
          </p>
          <PitaSlot slot={hasil.slot} terpanjang={t} sejak={Math.max(menit, 6 * 60)} />
        </>
      )}
    </Card>
  )
}

function PitaSlot({ slot, terpanjang, sejak }: { slot: Array<{ mulai: Menit; selesai: Menit }>; terpanjang: { mulai: Menit }; sejak: Menit }) {
  const akhir = 24 * 60
  const lebar = Math.max(1, akhir - sejak)
  return (
    <div className="rounded-field bg-well px-3 py-2.5 tactile-inset" aria-hidden="true">
      <div className="relative h-3 overflow-hidden rounded-full bg-high">
        {slot.map((s) => (
          <motion.i
            key={s.mulai}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cx('absolute inset-y-0 origin-left rounded-full', s.mulai === terpanjang.mulai ? 'bg-primary' : 'bg-mist')}
            style={{ left: `${((s.mulai - sejak) / lebar) * 100}%`, width: `${((s.selesai - s.mulai) / lebar) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[0.625rem] text-ink-muted">
        <span>{formatJam(sejak)}</span>
        <span>24.00</span>
      </div>
    </div>
  )
}

/** D-07: maks 5 projek belum tertutup dengan urutan A-08. */
function DaftarProjek({ data, hariIni, menit }: PropsBagian) {
  const semua = data.projek
    .map((p) => ringkas(data, p, hariIni))
    .filter((r) => !projekTertutup(r.status))
    .sort(bandingkanProjek)

  return (
    <section aria-labelledby="dash-projek" className="flex flex-col gap-4">
      <KepalaBagian id="dash-projek" icon="folder" judul="Projek" ujung={data.projek.length > 0 && <TautanSemua to="/projek" />} />
      {semua.length === 0 ? (
        <Kosong
          icon="create_new_folder"
          aksi={
            <Link to="/projek" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">
              Buka Projek
            </Link>
          }
        >
          {data.projek.length === 0 ? 'Belum ada projek.' : 'Semua projek sudah tertutup.'}
        </Kosong>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {semua.slice(0, MAKS_PROJEK).map((r) => {
            const telat = taskProjek(data, r.projek.id).filter((t) => taskTelat(t, hariIni, menit)).length
            const badge = BADGE_STATUS[r.status]
            const sesi = r.sesiKini
              ? `${r.sesiKini.nama} · sampai ${formatTanggal(r.sesiKini.akhir)}`
              : r.sesiBerikut
                ? `Sesi berikutnya mulai ${formatTanggal(r.sesiBerikut.mulai)}`
                : r.meta
            return (
              <motion.li key={r.projek.id} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
                <Link
                  to={`/projek/${r.projek.id}`}
                  className="flex h-full flex-col gap-3 rounded-card bg-card p-5 tactile-convex"
                  style={{ boxShadow: `inset 4px 0 0 ${r.projek.warna}` }}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge kind={badge.kind} icon={badge.icon}>
                      {LABEL_STATUS_PROJEK[r.status]}
                    </Badge>
                    {telat > 0 && <Badge kind="telat">{`${telat} telat`}</Badge>}
                  </span>
                  <span className="flex items-center gap-2 text-headline-md">
                    <span aria-hidden="true" className="size-3 shrink-0 rounded-[4px]" style={{ backgroundColor: r.projek.warna }} />
                    <span className="truncate">{r.projek.nama}</span>
                  </span>
                  <span className="text-body-sm text-ink-muted">{sesi}</span>
                  <span className="mt-auto flex flex-col gap-1.5">
                    <span className="h-2 overflow-hidden rounded-full bg-high" aria-hidden="true">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${r.persen}%` }} />
                    </span>
                    <span className="flex justify-between text-body-sm">
                      <span className="text-ink-muted">
                        {r.n} dari {r.m} task selesai
                      </span>
                      <b className="font-mono">{r.persen}%</b>
                    </span>
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
