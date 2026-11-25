import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { projekApi } from '../../../api/projek'
import { useBolehUbah, useMutasi } from '../../../data/DataProvider'
import { useDataProjek } from '../../../data/pilih'
import { useWaktu } from '../../../data/useWaktu'
import {
  dampakBatalProjek,
  dampakBatalSesi,
  dampakHapusSesi,
  dampakSelesaiDini,
  DOKUMEN_MAX,
  hitungStatusProjek,
  perluDialogBerat,
  sesiProjek,
  syaratBatalProjek,
  syaratBatalSesi,
  syaratBukaKembali,
  syaratHapusProjek,
  syaratHapusSesi,
  syaratSelesaiDini,
  taskProjek,
  type Dampak,
  type DataProjek,
} from '../../../domain/projek'
import {
  bandingkanTaskAktif,
  LABEL_STATUS_PROJEK,
  LABEL_STATUS_SESI,
  nDariM,
  projekTertutup,
  statusSesi,
  taskAktif,
  taskSelesai,
} from '../../../domain/status'
import type { Dokumen, Projek, Sesi, Task } from '../../../domain/tipe'
import { cx } from '../../cx'
import { Button, LinkButton } from '../../kit/Button'
import { Badge, EmptyState } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import type { IconName } from '../../kit/icons'
import { formatRentang } from '../../format'
import { galatForm } from '../../formGalat'
import { DUR, riseChild, SPRING_SOFT, staggerParent } from '../../motion'
import { HeavyConfirmDialog, LightConfirmDialog } from '../../overlay/ConfirmDialog'
import { usePageTitle } from '../../usePageTitle'
import { usePengenalanHalaman } from '../../pengenalan/Pengenalan'
import { BarisTask } from '../../task/BarisTask'
import { useLayananTask } from '../../task/LayananTask'
import { FormDokumen } from './FormDokumen'
import { FormProjek } from './FormProjek'
import { FormSesi, type ModeSesi } from './FormSesi'
import { BADGE_STATUS } from './tampilan'
import { uraianDampak, type AksiDampak } from './uraianDampak'

type Aksi = { jenis: AksiDampak; sesiId?: string } | { jenis: 'hapus_projek' } | null

const TETAP_TERTUTUP = 'Projek tertutup terkunci. Buka kembali untuk mengubahnya.'

function TombolAksi({
  icon,
  children,
  onClick,
  alasan,
  bahaya = false,
}: {
  icon: IconName
  children: ReactNode
  onClick: () => void
  alasan: string | null
  bahaya?: boolean
}) {
  return (
    <Button
      variant="tactile"
      size="sm"
      icon={icon}
      onClick={onClick}
      disabled={!!alasan}
      title={alasan ?? undefined}
      className={cx('justify-center', bahaya && 'text-danger shadow-[inset_0_0_0_1px_var(--sb-danger),var(--sb-shadow-button)] hover:text-danger')}
    >
      {children}
    </Button>
  )
}

export function DetailProjekPage() {
  const { id } = useParams()
  const data = useDataProjek()
  const waktu = useWaktu()
  const projek = data?.projek.find((p) => p.id === id)
  usePageTitle(projek?.nama ?? 'Detail projek')
  usePengenalanHalaman('detail-projek')

  if (!data || !waktu) return null
  if (!projek) {
    return (
      <EmptyState icon="folder_off" title="Projek tidak ditemukan" action={<LinkButton to="/projek">Ke daftar projek</LinkButton>}>
        Projek ini sudah dihapus atau tidak ada di akunmu.
      </EmptyState>
    )
  }
  return <IsiDetail data={data} projek={projek} hariIni={waktu.hariIni} />
}

function IsiDetail({
  data,
  projek,
  hariIni,
}: {
  data: DataProjek & { dokumen: Dokumen[] }
  projek: Projek
  hariIni: string
}) {
  const navigate = useNavigate()
  const mutasi = useMutasi()
  const layanan = useLayananTask()
  const { boleh, alasan: alasanOffline } = useBolehUbah()

  const [formProjek, setFormProjek] = useState(false)
  const [formSesi, setFormSesi] = useState<{ mode: ModeSesi; sesi?: Sesi } | null>(null)
  const [formDokumen, setFormDokumen] = useState<{ dokumen?: Dokumen } | null>(null)
  const [aksi, setAksi] = useState<Aksi>(null)
  const [proses, setProses] = useState(false)
  const [galatAksi, setGalatAksi] = useState<string>()
  const [arsipBuka, setArsipBuka] = useState<string | null>(null)

  const st = hitungStatusProjek(data, projek, hariIni)
  const tertutup = projekTertutup(st)
  const sesi = sesiProjek(data, projek.id).sort((a, b) => (a.mulai < b.mulai ? -1 : 1))
  const tasks = taskProjek(data, projek.id)
  const { n, m } = nDariM(tasks)
  const persen = m === 0 ? 0 : Math.round((n / m) * 100)
  const dokumen = data.dokumen.filter((d) => d.projek_id === projek.id)
  const sesiDepan = sesi.filter((s) => !s.batal && s.akhir >= hariIni)
  const sesiArsip = sesi.filter((s) => s.batal || s.akhir < hariIni).reverse()

  // Alasan nonaktif: offline lebih dulu, lalu prasyarat aksi (A-04..A-07).
  const kunci = (syarat: string | null) => alasanOffline ?? syarat
  const kunciTerbuka = (syarat: string | null = null) => kunci(tertutup ? TETAP_TERTUTUP : syarat)

  // Dampak dihitung dari data terkini pada setiap render; setelah 409 dampak_berubah dialog ikut diperbarui.
  const sesiAksi = aksi && 'sesiId' in aksi ? sesi.find((s) => s.id === aksi.sesiId) : undefined
  let dampak: Dampak | null = null
  if (aksi?.jenis === 'selesai_dini') dampak = dampakSelesaiDini(data, projek, hariIni)
  if (aksi?.jenis === 'batal_projek') dampak = dampakBatalProjek(data, projek, hariIni)
  if (aksi?.jenis === 'batal_sesi' && sesiAksi) dampak = dampakBatalSesi(data, projek, sesiAksi, hariIni)
  if (aksi?.jenis === 'hapus_sesi' && sesiAksi) dampak = dampakHapusSesi(data, projek, sesiAksi, hariIni)
  const berat = !!dampak && (aksi?.jenis !== 'hapus_sesi' || perluDialogBerat(st, dampak))
  const uraian = dampak && aksi && aksi.jenis !== 'hapus_projek' ? uraianDampak(aksi.jenis, dampak, data) : null

  function buka(a: Aksi) {
    setGalatAksi(undefined)
    setAksi(a)
  }

  async function jalankan() {
    if (!aksi) return
    setProses(true)
    setGalatAksi(undefined)
    try {
      if (aksi.jenis === 'hapus_projek') await mutasi((v) => projekApi.hapus(v, projek.id))
      else if (dampak) {
        const d = dampak
        if (aksi.jenis === 'selesai_dini') await mutasi((v) => projekApi.selesaiDini(v, projek.id, d))
        if (aksi.jenis === 'batal_projek') await mutasi((v) => projekApi.batal(v, projek.id, d))
        if (aksi.jenis === 'batal_sesi' && sesiAksi) await mutasi((v) => projekApi.batalSesi(v, sesiAksi.id, d))
        if (aksi.jenis === 'hapus_sesi' && sesiAksi) await mutasi((v) => projekApi.hapusSesi(v, sesiAksi.id, d))
      }
      const terhapus = aksi.jenis === 'hapus_projek' || dampak?.projek_menjadi === 'dihapus'
      setAksi(null)
      if (terhapus) navigate('/projek', { replace: true })
    } catch (e) {
      setGalatAksi(galatForm(e).umum ?? 'Aksi gagal. Coba lagi.')
    } finally {
      setProses(false)
    }
  }

  async function hapusDokumen(d: Dokumen) {
    try {
      await mutasi((v) => projekApi.hapusDokumen(v, d.id))
    } catch (e) {
      setGalatAksi(galatForm(e).umum)
    }
  }

  const JUDUL_AKSI: Record<string, { judul: string; tombol: string; icon: IconName }> = {
    selesai_dini: { judul: `Selesaikan “${projek.nama}” lebih awal?`, tombol: 'Ya, selesaikan projek', icon: 'flag' },
    batal_projek: { judul: `Batalkan projek “${projek.nama}”?`, tombol: 'Ya, batalkan projek', icon: 'cancel' },
    batal_sesi: { judul: `Batalkan “${sesiAksi?.nama ?? 'sesi'}”?`, tombol: 'Ya, batalkan sesi', icon: 'cancel' },
    hapus_sesi: { judul: `Hapus “${sesiAksi?.nama ?? 'sesi'}”?`, tombol: 'Hapus sesi', icon: 'delete' },
  }
  const info = aksi && aksi.jenis !== 'hapus_projek' ? JUDUL_AKSI[aksi.jenis] : undefined

  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-8">
      <motion.div variants={riseChild}>
        <Link to="/projek" className="inline-flex min-h-11 items-center gap-1.5 rounded-full pr-3 text-body-md font-semibold text-ink-muted hover:text-ink">
          <Icon name="arrow_back" size={18} />
          Projek
        </Link>
      </motion.div>

      <motion.section variants={riseChild} className="relative flex flex-wrap gap-8 overflow-hidden rounded-card bg-card p-5 tactile-convex sm:p-6 md:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -top-44 -right-28 size-90 rounded-full bg-[radial-gradient(circle,var(--sb-glow)_0%,transparent_70%)]" />
        <div className="relative flex min-w-0 flex-[1_1_420px] flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lbl flex items-center gap-1.5 text-primary">
              <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ backgroundColor: projek.warna }} />
              Projek
            </span>
            <Badge kind={BADGE_STATUS[st].kind} icon={BADGE_STATUS[st].icon}>
              {LABEL_STATUS_PROJEK[st]}
            </Badge>
          </div>
          <h1 className="text-auth">{projek.nama}</h1>
          {projek.deskripsi && <p className="text-body-md text-ink-muted">{projek.deskripsi}</p>}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="lbl">Progres keseluruhan</span>
            <span className="font-mono font-bold text-primary">
              {n} dari {m} task selesai{m > 0 && ` (${persen}%)`}
            </span>
          </div>
          <div className="rounded-full bg-well p-1 tactile-inset" aria-hidden="true">
            <motion.div className="h-2.5 origin-left rounded-full bg-primary" initial={{ scaleX: 0 }} animate={{ scaleX: persen / 100 }} transition={SPRING_SOFT} />
          </div>
        </div>
        <div data-pengenalan="detail-aksi" className="relative flex flex-[0_1_300px] flex-col gap-2.5">
          <span className="lbl">Aksi kelola projek</span>
          {tertutup ? (
            <Button icon="restart_alt" onClick={() => setFormSesi({ mode: 'buka' })} disabled={!!kunci(syaratBukaKembali(data, projek, hariIni))}>
              Buka kembali
            </Button>
          ) : (
            <Button data-pengenalan="detail-tambah-sesi" icon="add_circle" onClick={() => setFormSesi({ mode: 'tambah' })} disabled={!boleh}>
              Tambah sesi
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <TombolAksi icon="edit" onClick={() => setFormProjek(true)} alasan={kunciTerbuka()}>
              Ubah projek
            </TombolAksi>
            <TombolAksi icon="flag" onClick={() => buka({ jenis: 'selesai_dini' })} alasan={kunci(syaratSelesaiDini(data, projek, hariIni))}>
              Selesai dini
            </TombolAksi>
            <TombolAksi icon="cancel" bahaya onClick={() => buka({ jenis: 'batal_projek' })} alasan={kunci(syaratBatalProjek(data, projek, hariIni))}>
              Batal projek
            </TombolAksi>
            <TombolAksi icon="delete" bahaya onClick={() => buka({ jenis: 'hapus_projek' })} alasan={kunci(syaratHapusProjek(data, projek))}>
              Hapus projek
            </TombolAksi>
          </div>
          <p className="text-body-sm text-ink-muted">
            {alasanOffline ?? (tertutup ? TETAP_TERTUTUP : 'Arahkan kursor ke tombol nonaktif untuk melihat alasannya.')}
          </p>
        </div>
      </motion.section>

      {galatAksi && !aksi && (
        <motion.div variants={riseChild}>
          <p role="alert" className="flex items-center gap-2 rounded-field bg-danger-soft px-4 py-3 text-body-md text-on-danger-soft">
            <Icon name="error" size={18} />
            {galatAksi}
          </p>
        </motion.div>
      )}

      <motion.section variants={riseChild} data-pengenalan="detail-dokumen" aria-labelledby="judul-dokumen" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="judul-dokumen" className="flex items-center gap-2 text-headline-md">
            <Icon name="description" className="text-primary" />
            Dokumen ({dokumen.length} dari {DOKUMEN_MAX})
          </h2>
          <Button
            variant="tactile"
            size="sm"
            icon="note_add"
            onClick={() => setFormDokumen({})}
            disabled={!!kunciTerbuka(dokumen.length >= DOKUMEN_MAX ? `Maksimal ${DOKUMEN_MAX} dokumen.` : null)}
            title={kunciTerbuka(dokumen.length >= DOKUMEN_MAX ? `Maksimal ${DOKUMEN_MAX} dokumen.` : null) ?? undefined}
          >
            Tambah dokumen
          </Button>
        </div>
        {dokumen.length === 0 ? (
          <p className="rounded-field bg-well px-4 py-3 text-body-md text-ink-muted tactile-inset">Belum ada dokumen. Tautkan berkas yang sering dibuka untuk projek ini.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dokumen.map((d) => (
              <li key={d.id} className="flex flex-col gap-3 rounded-tile bg-card p-4 tactile-convex">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-card tactile-button">
                    <Icon name="description" size={18} />
                  </span>
                  <div className="min-w-0">
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-ink hover:text-primary">
                      <span className="truncate">{d.nama}</span>
                      <Icon name="open_in_new" size={14} />
                      <span className="sr-only">(tab baru)</span>
                    </a>
                    <span className="block truncate text-body-sm text-ink-muted">{d.url.replace(/^https?:\/\//, '')}</span>
                  </div>
                </div>
                {!tertutup && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setFormDokumen({ dokumen: d })} disabled={!boleh}>
                      Ubah
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => void hapusDokumen(d)} disabled={!boleh}>
                      Hapus
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      {sesiDepan.length === 0 && !tertutup && (
        <motion.div variants={riseChild}>
          <EmptyState
            icon="calendar_today"
            title="Belum ada sesi berjalan atau mendatang"
            action={
              <Button icon="add_circle" onClick={() => setFormSesi({ mode: 'tambah' })} disabled={!boleh}>
                Tambah sesi
              </Button>
            }
          >
            Sesi adalah rentang tanggal tempat task projek ini dikerjakan.
          </EmptyState>
        </motion.div>
      )}

      {sesiDepan.map((s) => {
        const isi = tasks.filter((t) => t.sesi_id === s.id).sort(urutTask)
        const r = nDariM(isi)
        const sst = statusSesi(s, hariIni)
        return (
          <motion.section key={s.id} variants={riseChild} data-pengenalan="detail-sesi" aria-labelledby={`sesi-${s.id}`} className="flex flex-col gap-4 rounded-card bg-card p-4 tactile-convex sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={`sesi-${s.id}`} className="text-headline-lg">
                    {s.nama}
                  </h2>
                  <Badge kind={sst === 'berjalan' ? 'info' : 'netral-garis'}>{LABEL_STATUS_SESI[sst]}</Badge>
                </div>
                <p className="text-body-sm text-ink-muted">
                  {formatRentang(s.mulai, s.akhir)} · <b className="text-ink">{r.n} dari {r.m} task selesai</b>
                </p>
                {s.deskripsi && <p className="mt-1 text-body-md text-ink-muted">{s.deskripsi}</p>}
              </div>
            </div>
            {isi.length === 0 ? (
              <p className="rounded-field bg-well px-4 py-3 text-body-md text-ink-muted tactile-inset">Sesi ini belum punya task.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {isi.map((t) => (
                  <li key={t.id}>
                    <BarisTask task={t} />
                  </li>
                ))}
              </ul>
            )}
            {!tertutup && (
              <div className="flex flex-wrap items-center gap-2 border-t border-ink/7 pt-4">
                <Button variant="tactile" size="sm" icon="add_circle" className="mr-auto" disabled={!boleh} title={alasanOffline ?? undefined} onClick={() => layanan.bukaFormTask({ mode: 'buat', sesiId: s.id })}>
                  Tambah task
                </Button>
                <TombolAksi icon="edit" onClick={() => setFormSesi({ mode: 'ubah', sesi: s })} alasan={kunciTerbuka()}>
                  Ubah sesi
                </TombolAksi>
                <TombolAksi icon="cancel" bahaya onClick={() => buka({ jenis: 'batal_sesi', sesiId: s.id })} alasan={kunci(syaratBatalSesi(s, hariIni))}>
                  Batal sesi
                </TombolAksi>
                <TombolAksi icon="delete" onClick={() => buka({ jenis: 'hapus_sesi', sesiId: s.id })} alasan={kunci(syaratHapusSesi(data, s, hariIni))}>
                  Hapus sesi
                </TombolAksi>
              </div>
            )}
          </motion.section>
        )
      })}

      {sesiArsip.length > 0 && (
        <motion.section variants={riseChild} aria-labelledby="judul-arsip" className="flex flex-col gap-3">
          <h2 id="judul-arsip" className="lbl">
            Sesi selesai dan batal
          </h2>
          {sesiArsip.map((s) => {
            const isi = tasks.filter((t) => t.sesi_id === s.id).sort(urutTask)
            const r = nDariM(isi)
            const sisa = isi.filter(taskAktif).length
            const terbuka = arsipBuka === s.id
            return (
              <div key={s.id} className={cx('flex flex-wrap items-center gap-4 rounded-tile px-6 py-4', s.batal ? 'shadow-[inset_0_0_0_1.5px_rgb(30_35_34/0.12)]' : 'bg-well')}>
                <Icon name={s.batal ? 'block' : 'history'} className="text-ink-muted" />
                <div className="min-w-0 flex-[1_1_280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{s.nama}</b>
                    {sisa > 0 && !s.batal && <Badge kind="redup">{sisa} task belum selesai</Badge>}
                    <Badge kind={s.batal ? 'netral-garis' : 'info'}>{s.batal ? 'Batal' : 'Selesai'}</Badge>
                  </div>
                  <span className="text-body-sm text-ink-muted">
                    {formatRentang(s.mulai, s.akhir)} · {isi.length === 0 ? 'tanpa task' : `${r.n} dari ${r.m} task selesai`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isi.length > 0 && (
                    <Button variant="tactile" size="sm" aria-expanded={terbuka} onClick={() => setArsipBuka(terbuka ? null : s.id)}>
                      {terbuka ? 'Tutup' : 'Lihat task'}
                      <motion.span animate={{ rotate: terbuka ? 180 : 0 }} transition={{ duration: DUR.fast }} className="inline-flex">
                        <Icon name="keyboard_arrow_down" size={18} />
                      </motion.span>
                    </Button>
                  )}
                  {!tertutup && s.batal && (
                    <TombolAksi icon="delete" onClick={() => buka({ jenis: 'hapus_sesi', sesiId: s.id })} alasan={kunci(syaratHapusSesi(data, s, hariIni))}>
                      Hapus sesi
                    </TombolAksi>
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {terbuka && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                      className="flex basis-full flex-col gap-2"
                    >
                      {isi.map((t) => (
                        <li key={t.id}>
                          <BarisTask task={t} />
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </motion.section>
      )}

      <FormProjek open={formProjek} onClose={() => setFormProjek(false)} projek={projek} />
      <FormSesi open={!!formSesi} onClose={() => setFormSesi(null)} projek={projek} sesi={formSesi?.sesi} mode={formSesi?.mode ?? 'tambah'} />
      <FormDokumen open={!!formDokumen} onClose={() => setFormDokumen(null)} projekId={projek.id} dokumen={formDokumen?.dokumen} />

      <HeavyConfirmDialog
        open={!!aksi && aksi.jenis !== 'hapus_projek' && berat}
        onClose={() => setAksi(null)}
        onConfirm={() => void jalankan()}
        title={info?.judul ?? ''}
        icon={info?.icon ?? 'warning'}
        confirmLabel={info?.tombol ?? 'Lanjutkan'}
        akanTerjadi={uraian?.akanTerjadi ?? []}
        tetapAda={uraian?.tetapAda ?? []}
        takBisaDiurungkan
        busy={proses}
        error={galatAksi}
      />
      <LightConfirmDialog
        open={aksi?.jenis === 'hapus_projek' || (aksi?.jenis === 'hapus_sesi' && !berat)}
        onClose={() => setAksi(null)}
        onConfirm={() => void jalankan()}
        title={aksi?.jenis === 'hapus_projek' ? `Hapus projek “${projek.nama}”?` : (info?.judul ?? '')}
        icon="delete"
        confirmLabel={aksi?.jenis === 'hapus_projek' ? 'Hapus projek' : 'Hapus sesi'}
        busy={proses}
        error={galatAksi}
      >
        {aksi?.jenis === 'hapus_projek'
          ? 'Projek dan dokumennya dihapus permanen.'
          : 'Sesi kosong ini dihapus permanen.'}
      </LightConfirmDialog>
    </motion.div>
  )
}

/** Task aktif dulu (urutan D-04), lalu selesai, lalu batal. */
function urutTask(a: Task, b: Task): number {
  const kelas = (t: Task) => (t.batal ? 2 : taskSelesai(t) ? 1 : 0)
  if (kelas(a) !== kelas(b)) return kelas(a) - kelas(b)
  return bandingkanTaskAktif(a, b)
}
