import { motion } from 'motion/react'
import { useState } from 'react'
import { useBolehUbah } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { JAM_AWAL } from '../../domain/jadwal'
import { formatDurasi, jamKosong } from '../../domain/jamKosong'
import { hariIso } from '../../domain/tanggal'
import type { Menit, Tanggal } from '../../domain/tipe'
import { Button } from '../kit/Button'
import { SegmentedControl } from '../kit/controls'
import { Badge } from '../kit/display'
import { Icon } from '../kit/Icon'
import { formatJam, formatTanggal } from '../format'
import { riseChild, staggerParent } from '../motion'
import { Dialog } from '../overlay/Dialog'
import { useLayananTask } from '../task/LayananTask'
import { NAMA_HARI } from '../todo/FormBlok'
import { DaftarEntriHari, ringkasanHari } from '../todo/DaftarEntriHari'
import { deadlinePadaTanggal, itemHari, type ItemHari } from './dataKalender'
import { KolomHari, LabelJam } from './GarisWaktu'

type Props = {
  tanggal: Tanggal | null
  onClose: () => void
  onSlot: (tanggal: Tanggal, mulai: Menit) => void
  onItem: (tanggal: Tanggal, item: ItemHari) => void
  onJadwalBaru: (tanggal: Tanggal) => void
}

/**
 * P-02: panel hari. Garis waktu 06.00–24.00 dan daftar setara teks (N-52), to-do hari itu,
 * dan task "belum punya jam". Hari lewat hanya-baca (G-05).
 */
export function PanelHari({ tanggal, onClose, onSlot, onItem, onJadwalBaru }: Props) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const layanan = useLayananTask()
  const { boleh } = useBolehUbah()
  const [tampilan, setTampilan] = useState<'grid' | 'daftar'>('grid')
  const [terakhir, setTerakhir] = useState(tanggal)
  if (tanggal && tanggal !== terakhir) setTerakhir(tanggal)
  const t = tanggal ?? terakhir

  if (!data || !waktu || !t) return <Dialog open={false} onClose={onClose} title="Panel hari" kind="panel" />

  const lewat = t < waktu.hariIni
  const { n, m } = ringkasanHari(data, t)
  const kosong = lewat ? null : jamKosong(data, t, t === waktu.hariIni ? waktu.menit : undefined)
  const dl = deadlinePadaTanggal(data, t)
  const dlBerjam = dl.filter((x) => x.deadline_menit !== null && x.deadline_menit >= JAM_AWAL)
  const dlTanpaJam = dl.filter((x) => x.deadline_menit === null)
  const dlPagi = dl.filter((x) => x.deadline_menit !== null && x.deadline_menit < JAM_AWAL)
  const item = itemHari(data, t)

  return (
    <Dialog
      open={!!tanggal}
      onClose={onClose}
      title={`${NAMA_HARI[hariIso(t)]}, ${formatTanggal(t)}`}
      description={t === waktu.hariIni ? 'Hari ini' : lewat ? 'Hari lewat, hanya-baca' : 'Rancangan hari mendatang'}
      kind="panel"
    >
      <motion.div key={t} variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-5">
        <motion.div variants={riseChild} className="grid grid-cols-3 gap-2.5">
          {[
            ['Entri', String(m)],
            ['Dikerjakan', String(n)],
            ['Kosong', kosong ? formatDurasi(kosong.total) : '-'],
          ].map(([l, v]) => (
            <div key={l} className="flex flex-col gap-1 rounded-tile bg-well p-3 tactile-inset">
              <span className="lbl">{l}</span>
              <b className="font-mono text-numeric-md">{v}</b>
            </div>
          ))}
        </motion.div>

        {(dlTanpaJam.length > 0 || dlPagi.length > 0) && (
          <motion.div variants={riseChild} className="flex flex-col gap-1.5">
            {dlPagi.map((x) => (
              <p key={x.id} className="flex items-center gap-2 rounded-full bg-danger-soft px-3 py-1 text-body-sm text-on-danger-soft">
                <Icon name="event_busy" size={14} />
                Sebelum 06.00 ({formatJam(x.deadline_menit ?? 0)}) · {x.nama}
              </p>
            ))}
            {dlTanpaJam.map((x) => (
              <p key={x.id} className="flex items-center gap-2 rounded-full bg-danger-soft px-3 py-1 text-body-sm text-on-danger-soft">
                <Icon name="event" size={14} />
                Deadline hari ini · {x.nama}
              </p>
            ))}
          </motion.div>
        )}

        <motion.div variants={riseChild}>
          <SegmentedControl
            label="Tampilan"
            value={tampilan}
            onChange={setTampilan}
            options={[
              { value: 'grid', label: 'Garis waktu' },
              { value: 'daftar', label: 'Daftar' },
            ]}
          />
        </motion.div>

        {tampilan === 'grid' ? (
          <motion.div variants={riseChild} className="grid grid-cols-[44px_minmax(0,1fr)] gap-2">
            <LabelJam />
            <KolomHari
              data={data}
              tanggal={t}
              hariIni={waktu.hariIni}
              menitSekarang={waktu.menit}
              deadline={dlBerjam.map((x) => ({ id: x.id, nama: x.nama, menit: x.deadline_menit ?? 0 }))}
              {...(boleh && !lewat ? { onSlot: (mulai: Menit) => onSlot(t, mulai) } : {})}
              onItem={(it) => onItem(t, it)}
            />
          </motion.div>
        ) : (
          <motion.ol variants={riseChild} className="flex flex-col gap-2" aria-label="Urutan kegiatan hari ini">
            {item.length === 0 && dlBerjam.length === 0 && <li className="text-body-sm text-ink-muted">Belum ada Jadwal atau blok di hari ini.</li>}
            {[...item.map((it) => ({ menit: it.mulai, kunci: it.id, isi: it })), ...dlBerjam.map((x) => ({ menit: x.deadline_menit ?? 0, kunci: `dl-${x.id}`, isi: x }))]
              .sort((a, b) => a.menit - b.menit)
              .map(({ kunci, isi }) => (
                <li key={kunci} className="flex items-start gap-3 rounded-field bg-card px-4 py-2.5 tactile-convex-sm">
                  {'jenis' in isi ? (
                    <>
                      <span className="font-mono text-body-sm font-bold">
                        {formatJam(isi.mulai)}–{formatJam(isi.selesai)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate">{isi.jenis === 'jadwal' ? isi.nama : isi.task.nama}</b>
                        <span className="text-body-sm text-ink-muted">{isi.jenis === 'jadwal' ? 'Jadwal' : 'Blok to-do'}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-body-sm font-bold text-danger">{formatJam(isi.deadline_menit ?? 0)}</span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate">{isi.nama}</b>
                        <Badge kind="telat">Deadline</Badge>
                      </span>
                    </>
                  )}
                </li>
              ))}
          </motion.ol>
        )}

        <motion.section variants={riseChild} aria-labelledby="todo-hari" className="flex flex-col gap-3">
          <h3 id="todo-hari" className="lbl">
            To-do hari ini
          </h3>
          <DaftarEntriHari tanggal={t} />
        </motion.section>

        {!lewat && (
          <motion.div variants={riseChild} className="flex flex-wrap gap-2 border-t border-ink/7 pt-4">
            <Button variant="tactile" icon="add" disabled={!boleh} onClick={() => onJadwalBaru(t)}>
              Jadwal sekali jalan
            </Button>
            <Button variant="tactile" icon="checklist" disabled={!boleh} onClick={() => layanan.bukaFormTask({ mode: 'buat' })}>
              Tambah task
            </Button>
          </motion.div>
        )}
      </motion.div>
    </Dialog>
  )
}
