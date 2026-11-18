import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type DragEvent, type PointerEvent } from 'react'
import { todoApi } from '../../api/todo'
import { useBolehUbah, useMutasi } from '../../data/DataProvider'
import { useDataProjek, type DataLengkap } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { JAM_AKHIR, JAM_AWAL, jadwalPadaTanggal } from '../../domain/jadwal'
import { bandingkanTaskAktif, taskAktif } from '../../domain/status'
import { hariIso, tambahHari } from '../../domain/tanggal'
import { infoLabel, namaLabel, taskTerkunci } from '../../domain/task'
import { setelahDeadline, validasiBlok } from '../../domain/todo'
import type { EntriTodo, Menit, Tanggal, Task } from '../../domain/tipe'
import { cx } from '../cx'
import { Button, IconButton } from '../kit/Button'
import { Alert, Badge } from '../kit/display'
import { Icon } from '../kit/Icon'
import { formatJam, formatTanggal } from '../format'
import { galatForm } from '../formGalat'
import { KolomHari, LabelJam, TINGGI_JAM } from '../kalender/GarisWaktu'
import { dropIn, SPRING_SNAPPY } from '../motion'
import { Dialog } from '../overlay/Dialog'
import { NAMA_HARI } from './FormBlok'
import { useAksiTodo } from './useAksiTodo'

export type AwalSusun = { tanggal: Tanggal; taskId?: string }

const RENTANG = JAM_AKHIR - JAM_AWAL
const TINGGI = (RENTANG / 60) * TINGGI_JAM
const DURASI_AWAL = 60
const PILIHAN_JAM = Array.from({ length: (JAM_AKHIR - JAM_AWAL) / 15 }, (_, i) => JAM_AWAL + i * 15)
const JENIS_SERET = 'application/x-softblock-entri'

type Pesan = { tone: 'success' | 'error' | 'info'; teks: string }

/** Jam mulai dibulatkan ke 15 menit; selesai dipendekkan agar tidak menabrak kegiatan berikutnya. */
function usulBlok(data: DataLengkap, tanggal: Tanggal, mulai: Menit): { mulai: Menit; selesai: Menit } {
  const m = Math.min(JAM_AKHIR - 15, Math.max(JAM_AWAL, Math.round(mulai / 15) * 15))
  const awalBerikut = [
    ...jadwalPadaTanggal(data.jadwalData, tanggal).map((k) => k.mulai),
    ...data.blok.filter((b) => b.tanggal === tanggal).map((b) => b.mulai_menit),
  ].filter((x) => x > m)
  const selesai = Math.min(m + DURASI_AWAL, JAM_AKHIR, ...awalBerikut)
  return { mulai: m, selesai: selesai - m >= 15 ? selesai : Math.min(m + DURASI_AWAL, JAM_AKHIR) }
}

/** P-03 (E-02, E-03): pilih banyak task untuk satu hari, lalu seret atau klik ke grid jam untuk menaruh blok. */
export function PanelSusun({ awal, onClose }: { awal: AwalSusun | null; onClose: () => void }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const { boleh, alasan } = useBolehUbah()
  const aksi = useAksiTodo()
  const mutasi = useMutasi()

  const [tanggal, setTanggal] = useState<Tanggal>(awal?.tanggal ?? '')
  const [awalStrip, setAwalStrip] = useState<Tanggal>(awal?.tanggal ?? '')
  const [dipilih, setDipilih] = useState<Set<string>>(new Set())
  const [aktif, setAktif] = useState<string | null>(null)
  const [jamKeyboard, setJamKeyboard] = useState<Menit>(9 * 60)
  const [hantu, setHantu] = useState<Menit | null>(null)
  const [pesan, setPesan] = useState<Pesan | null>(null)
  const [proses, setProses] = useState(false)
  const grid = useRef<HTMLDivElement>(null)

  const [sebelumnya, setSebelumnya] = useState(awal)
  if (awal !== sebelumnya) {
    setSebelumnya(awal)
    if (awal) {
      setTanggal(awal.tanggal)
      setAwalStrip(awal.tanggal)
      setDipilih(new Set(awal.taskId ? [awal.taskId] : []))
      setAktif(null)
      setPesan(null)
    }
  }

  // Isi panel berat (semua task aktif dan grid jam), jadi hanya dirender saat panel terbuka.
  if (!data || !waktu || !awal) return <Dialog open={false} onClose={onClose} title="Susun to-do" kind="penuh" />
  const { hariIni } = waktu

  const entriHari = data.entri.filter((e) => e.tanggal === tanggal)
  const adaDiHari = new Set(entriHari.map((e) => e.task_id))
  const calon = data.task
    .filter((t) => taskAktif(t) && !adaDiHari.has(t.id) && !taskTerkunci(data, t, hariIni))
    .sort(bandingkanTaskAktif)
  const sudah = entriHari
    .map((e) => ({ entri: e, task: data.task.find((t) => t.id === e.task_id) }))
    .filter((x): x is { entri: EntriTodo; task: Task } => !!x.task)
    .sort((a, b) => bandingkanTaskAktif(a.task, b.task))
  const entriAktif = sudah.find((x) => x.entri.id === aktif) ?? null
  const namaHari = tanggal ? `${NAMA_HARI[hariIso(tanggal)]}, ${formatTanggal(tanggal)}` : ''
  const hariStrip = awalStrip ? Array.from({ length: 7 }, (_, i) => tambahHari(awalStrip, i)) : []
  const jumlahDipilih = [...dipilih].filter((id) => calon.some((t) => t.id === id)).length

  function gantiHari(t: Tanggal) {
    setTanggal(t)
    setDipilih(new Set())
    setAktif(null)
    setPesan(null)
  }

  function pilih(id: string) {
    setDipilih((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function tambahkan() {
    if (!data) return
    const daftar = calon.filter((t) => dipilih.has(t.id))
    setProses(true)
    setPesan(null)
    let gagal = 0
    for (const t of daftar) {
      try {
        await aksi.tambahEntri(t, tanggal)
      } catch {
        gagal++
      }
    }
    setProses(false)
    setDipilih(new Set())
    setPesan(
      gagal === 0
        ? { tone: 'success', teks: `${daftar.length} task ditambahkan ke ${namaHari}. Seret ke grid jam untuk memberi blok.` }
        : { tone: 'error', teks: `${gagal} dari ${daftar.length} task gagal ditambahkan. Coba lagi.` },
    )
  }

  async function taruh(entri: EntriTodo, mulaiKasar: Menit) {
    if (!data) return
    const task = data.task.find((t) => t.id === entri.task_id)
    if (!task) return
    const isian = usulBlok(data, tanggal, mulaiKasar)
    const hasil = validasiBlok(isian, { tanggal, hariIni, task, blokLain: data.blok, jadwal: data.jadwalData, kecualiBlokId: null, formatJam })
    if (hasil.galat) {
      setPesan({ tone: 'error', teks: hasil.galat })
      return
    }
    setProses(true)
    try {
      await mutasi((v) => todoApi.tambahBlok(v, entri.id, { mulai_menit: isian.mulai, selesai_menit: isian.selesai }))
      setPesan({
        tone: hasil.peringatan ? 'info' : 'success',
        teks: `Blok ${formatJam(isian.mulai)}–${formatJam(isian.selesai)} untuk “${task.nama}” ditambahkan.${hasil.peringatan ? ` ${hasil.peringatan}` : ''}`,
      })
    } catch (e) {
      setPesan({ tone: 'error', teks: galatForm(e).umum ?? 'Blok tidak tersimpan.' })
    } finally {
      setProses(false)
    }
  }

  function menitDariY(clientY: number): Menit | null {
    const el = grid.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const rasio = (clientY - r.top) / r.height
    if (rasio < 0 || rasio > 1) return null
    return JAM_AWAL + rasio * RENTANG
  }

  function arahkan(e: PointerEvent | DragEvent) {
    const m = menitDariY(e.clientY)
    setHantu(m === null || !data ? null : usulBlok(data, tanggal, m).mulai)
  }

  function lepas(e: DragEvent) {
    e.preventDefault()
    const id = e.dataTransfer.getData(JENIS_SERET)
    const m = menitDariY(e.clientY)
    setHantu(null)
    const x = sudah.find((s) => s.entri.id === id)
    if (x && m !== null) void taruh(x.entri, m)
  }

  const bisaTaruh = boleh && !proses && tanggal >= hariIni
  const hantuBlok = hantu !== null && data ? usulBlok(data, tanggal, hantu) : null

  return (
    <Dialog open onClose={onClose} kind="penuh" title="Susun to-do" description="Pilih task untuk satu hari, lalu seret ke jam untuk memberi blok.">
      <nav aria-label="Pilih hari" className="flex items-center gap-2">
        <IconButton
          icon="chevron_left"
          label="Minggu sebelumnya"
          size="sm"
          disabled={awalStrip <= hariIni}
          onClick={() => setAwalStrip((a) => (tambahHari(a, -7) < hariIni ? hariIni : tambahHari(a, -7)))}
        />
        <ol className="grid flex-1 grid-cols-7 gap-1.5">
          {hariStrip.map((t) => {
            const n = data.entri.filter((e) => e.tanggal === t).length
            const ini = t === tanggal
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => gantiHari(t)}
                  aria-pressed={ini}
                  aria-label={`${NAMA_HARI[hariIso(t)]} ${formatTanggal(t)}, ${n} entri`}
                  className={cx(
                    'relative flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-tile px-1 py-2 transition-colors',
                    ini ? 'text-on-primary' : 'bg-well tactile-inset hover:bg-mist',
                  )}
                >
                  {ini && <motion.span layoutId="susun-hari" transition={SPRING_SNAPPY} className="absolute inset-0 rounded-tile bg-primary" />}
                  <span className="relative text-[0.6875rem] font-semibold uppercase">{t === hariIni ? 'Hari ini' : NAMA_HARI[hariIso(t)]?.slice(0, 3)}</span>
                  <span className="relative font-mono text-[1.0625rem] font-bold">{Number(t.slice(8))}</span>
                  <span className={cx('relative font-mono text-[0.625rem]', ini ? 'text-on-primary/80' : 'text-ink-muted')}>{n} entri</span>
                </button>
              </li>
            )
          })}
        </ol>
        <IconButton icon="chevron_right" label="Minggu berikutnya" size="sm" onClick={() => setAwalStrip((a) => tambahHari(a, 7))} />
      </nav>

      <AnimatePresence mode="wait">
        {pesan && (
          <motion.div key={pesan.teks} variants={dropIn} initial="hidden" animate="show" exit="exit" aria-live="polite">
            <Alert tone={pesan.tone} {...(pesan.tone === 'info' ? { icon: 'warning' as const } : {})}>
              {pesan.teks}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      {alasan && <Alert tone="info">{alasan}</Alert>}

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="susun-belum" className="flex flex-col gap-3">
            <h3 id="susun-belum" className="text-headline-md">
              Belum ada di {namaHari}
            </h3>
            {calon.length === 0 ? (
              <p className="rounded-tile bg-well px-5 py-4 text-ink-muted tactile-inset">Semua task aktif sudah ada di hari ini.</p>
            ) : (
              <ul className="flex max-h-[40dvh] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-none">
                {calon.map((t) => {
                  const on = dipilih.has(t.id)
                  const info = infoLabel(data, t)
                  return (
                    <li key={t.id}>
                      <label
                        className={cx(
                          'flex min-h-14 cursor-pointer items-center gap-3 rounded-tile px-4 py-2.5 transition-colors',
                          on ? 'bg-mist shadow-[inset_0_0_0_1.5px_var(--sb-primary)]' : 'bg-card tactile-convex hover:bg-raised',
                        )}
                      >
                        <input type="checkbox" checked={on} onChange={() => pilih(t.id)} className="size-5 accent-[var(--sb-primary)]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{t.nama}</span>
                          <span className="flex flex-wrap items-center gap-1.5 text-body-sm text-ink-muted">
                            {info?.jenis === 'projek' && <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ backgroundColor: info.projek.warna }} />}
                            {namaLabel(info)}
                            {t.deadline_tanggal && <span className="font-mono">· {formatTanggal(t.deadline_tanggal)}</span>}
                          </span>
                        </span>
                        {setelahDeadline(tanggal, t) && <Badge kind="konteks">Setelah deadline</Badge>}
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
            <Button icon="playlist_add" disabled={!boleh || jumlahDipilih === 0 || tanggal < hariIni} busy={proses && jumlahDipilih > 0} onClick={() => void tambahkan()}>
              {jumlahDipilih === 0 ? 'Pilih task untuk ditambahkan' : `Tambahkan ${jumlahDipilih} task ke ${NAMA_HARI[hariIso(tanggal)]}`}
            </Button>
          </section>

          <section aria-labelledby="susun-sudah" className="flex flex-col gap-3">
            <h3 id="susun-sudah" className="text-headline-md">
              Sudah ada ({sudah.length})
            </h3>
            {sudah.length === 0 ? (
              <p className="text-ink-muted">Belum ada entri di hari ini.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {sudah.map(({ entri, task }) => {
                  const blok = data.blok.filter((b) => b.entri_id === entri.id).sort((a, b) => a.mulai_menit - b.mulai_menit)
                  const on = aktif === entri.id
                  return (
                    <li
                      key={entri.id}
                      draggable={bisaTaruh}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(JENIS_SERET, entri.id)
                        e.dataTransfer.effectAllowed = 'copy'
                        setAktif(entri.id)
                      }}
                      onDragEnd={() => setHantu(null)}
                      className={cx(
                        'flex flex-wrap items-center gap-3 rounded-tile px-4 py-3',
                        on ? 'bg-mist shadow-[inset_0_0_0_1.5px_var(--sb-primary)]' : 'bg-card tactile-convex',
                        bisaTaruh && 'cursor-grab active:cursor-grabbing',
                      )}
                    >
                      <Icon name="schedule" className="text-ink-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{task.nama}</span>
                        <span className="font-mono text-body-sm text-ink-muted">
                          {blok.length === 0 ? 'Belum diberi jam' : blok.map((b) => `${formatJam(b.mulai_menit)}–${formatJam(b.selesai_menit)}`).join(', ')}
                        </span>
                      </span>
                      <Button size="sm" variant={on ? 'primary' : 'tactile'} icon="schedule" disabled={!bisaTaruh} aria-pressed={on} onClick={() => setAktif(on ? null : entri.id)}>
                        {on ? 'Klik jam di grid' : blok.length === 0 ? 'Beri jam' : 'Tambah blok'}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
            {entriAktif && (
              <motion.div variants={dropIn} initial="hidden" animate="show" className="flex flex-wrap items-end gap-2 rounded-field bg-well p-3 tactile-inset">
                <label className="flex flex-col gap-1">
                  <span className="lbl">Mulai blok {entriAktif.task.nama}</span>
                  <select
                    value={jamKeyboard}
                    onChange={(e) => setJamKeyboard(Number(e.target.value))}
                    className="min-h-11 rounded-field bg-card px-3 font-mono font-bold tactile-convex"
                  >
                    {PILIHAN_JAM.map((m) => (
                      <option key={m} value={m}>
                        {formatJam(m)}
                      </option>
                    ))}
                  </select>
                </label>
                <Button size="sm" icon="add" disabled={!bisaTaruh} onClick={() => void taruh(entriAktif.entri, jamKeyboard)}>
                  Taruh blok
                </Button>
              </motion.div>
            )}
          </section>
        </div>

        <section aria-labelledby="susun-grid" className="flex min-h-0 flex-col gap-2">
          <h3 id="susun-grid" className="flex items-center justify-between gap-2 text-headline-md">
            Jam {namaHari}
          </h3>
          <p className="text-body-sm text-ink-muted">Arsir: Jadwal. Seret entri ke sini, atau pilih entri lalu klik jam.</p>
          <div className="overflow-y-auto rounded-field bg-well p-3 tactile-inset lg:max-h-[calc(100dvh-16rem)]">
            <div className="grid grid-cols-[3rem_1fr] gap-2">
              <LabelJam />
              <div className="relative" style={{ height: TINGGI }}>
                <KolomHari data={data} tanggal={tanggal} hariIni={hariIni} menitSekarang={waktu.menit} />
                <div
                  ref={grid}
                  aria-hidden="true"
                  className={cx('absolute inset-0', entriAktif && bisaTaruh ? 'cursor-copy' : 'pointer-events-none')}
                  onPointerMove={arahkan}
                  onPointerLeave={() => setHantu(null)}
                  onClick={(e) => {
                    const m = menitDariY(e.clientY)
                    if (entriAktif && m !== null) void taruh(entriAktif.entri, m)
                  }}
                  onDragOver={(e) => {
                    if (!bisaTaruh || !e.dataTransfer.types.includes(JENIS_SERET)) return
                    e.preventDefault()
                    arahkan(e)
                  }}
                  onDragLeave={() => setHantu(null)}
                  onDrop={lepas}
                >
                  {hantuBlok && (
                    <motion.div
                      layout
                      transition={SPRING_SNAPPY}
                      className="pointer-events-none absolute inset-x-1 rounded-lg border-2 border-dashed border-primary bg-primary/10 px-2 py-1 font-mono text-body-sm font-bold text-primary"
                      style={{ top: `${((hantuBlok.mulai - JAM_AWAL) / RENTANG) * 100}%`, height: `${((hantuBlok.selesai - hantuBlok.mulai) / RENTANG) * 100}%` }}
                    >
                      {formatJam(hantuBlok.mulai)}–{formatJam(hantuBlok.selesai)}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Dialog>
  )
}
