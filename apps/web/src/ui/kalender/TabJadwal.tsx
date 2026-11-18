import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { jadwalApi } from '../../api/jadwal'
import { useBolehUbah, useMutasi } from '../../data/DataProvider'
import type { DataLengkap } from '../../data/pilih'
import { jadwalBerakhir, pernahBerlaku, versiTerakhir } from '../../domain/jadwal'
import type { Jadwal, Pengecualian, Tanggal } from '../../domain/tipe'
import { cx } from '../cx'
import { Button, IconButton } from '../kit/Button'
import { Alert, EmptyState } from '../kit/display'
import { TextField } from '../kit/fields'
import { formatJam, formatRentang, formatTanggal } from '../format'
import { galatForm } from '../formGalat'
import { DUR, riseChild, SPRING_SOFT, staggerParent } from '../motion'
import { LightConfirmDialog } from '../overlay/ConfirmDialog'
import { useLayananTask } from '../task/LayananTask'
import { FormPengecualian } from './FormPengecualian'

type Sub = 'aktif' | 'berakhir' | 'pengecualian'
const HARI = ['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

/** Tab Jadwal di Kalender dengan sub-tab Aktif, Berakhir, dan Pengecualian (F-06, J-03). */
export function TabJadwal({ data, hariIni }: { data: DataLengkap; hariIni: Tanggal }) {
  const layanan = useLayananTask()
  const mutasi = useMutasi()
  const { boleh, alasan } = useBolehUbah()
  const [sub, setSub] = useState<Sub>('aktif')
  const [formPengecualian, setFormPengecualian] = useState(false)
  const [akhiri, setAkhiri] = useState<{ jadwal: Jadwal; tanggal: string } | null>(null)
  const [hapus, setHapus] = useState<Jadwal | null>(null)
  const [proses, setProses] = useState(false)
  const [galat, setGalat] = useState<string>()

  const { jadwal, versi, pengecualian } = data.jadwalData
  const aktif = jadwal.filter((j) => !jadwalBerakhir(versi, j.id, hariIni))
  const berakhir = jadwal.filter((j) => jadwalBerakhir(versi, j.id, hariIni))
  const daftar = (sub === 'aktif' ? aktif : berakhir).sort((a, b) => (versiTerakhir(versi, a.id)?.mulai_menit ?? 0) - (versiTerakhir(versi, b.id)?.mulai_menit ?? 0))

  async function jalankan(kerja: () => Promise<unknown>, selesai: () => void) {
    setProses(true)
    setGalat(undefined)
    try {
      await kerja()
      selesai()
    } catch (e) {
      setGalat(galatForm(e).umum ?? 'Aksi gagal.')
    } finally {
      setProses(false)
    }
  }

  async function hapusLangsung(j: Jadwal) {
    // F-09: Jadwal sekali jalan hari ini atau mendatang dihapus tanpa konfirmasi.
    await jalankan(() => mutasi((v) => jadwalApi.hapus(v, j.id)), () => undefined)
  }

  async function hapusPengecualian(p: Pengecualian) {
    // F-04: pengecualian dihapus tanpa konfirmasi.
    await jalankan(() => mutasi((v) => jadwalApi.hapusPengecualian(v, p.id)), () => undefined)
  }

  const SUB: Array<{ value: Sub; label: string; n: number }> = [
    { value: 'aktif', label: 'Aktif', n: aktif.length },
    { value: 'berakhir', label: 'Berakhir', n: berakhir.length },
    { value: 'pengecualian', label: 'Pengecualian', n: pengecualian.length },
  ]

  return (
    <section aria-label="Jadwal" className="flex flex-col gap-4 rounded-card bg-card p-5 tactile-convex sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sub-tab Jadwal">
          {SUB.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={sub === s.value}
              onClick={() => setSub(s.value)}
              className={cx('relative inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-body-md font-semibold', sub === s.value ? 'text-ink' : 'text-ink-muted hover:text-ink')}
            >
              {sub === s.value && <motion.span layoutId="sub-jadwal" transition={SPRING_SOFT} className="absolute inset-0 rounded-full bg-well tactile-inset" />}
              <span className="relative">{s.label}</span>
              <span className="relative rounded-full bg-card px-1.5 font-mono text-body-sm">{s.n}</span>
            </button>
          ))}
        </div>
        {sub === 'pengecualian' ? (
          <Button icon="add" disabled={!boleh} title={alasan ?? undefined} onClick={() => setFormPengecualian(true)}>
            Tambah pengecualian
          </Button>
        ) : (
          <Button icon="add" disabled={!boleh} title={alasan ?? undefined} onClick={() => layanan.bukaFormJadwal({ mode: 'buat' })}>
            Tambah Jadwal
          </Button>
        )}
      </div>
      {galat && <Alert tone="error">{galat}</Alert>}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={sub} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }}>
          {sub === 'pengecualian' ? (
            pengecualian.length === 0 ? (
              <EmptyState icon="event_busy" title="Belum ada pengecualian">
                Tiadakan Jadwal pada rentang tanggal tertentu, misalnya saat libur.
              </EmptyState>
            ) : (
              <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-2.5">
                {[...pengecualian]
                  .sort((a, b) => (a.mulai < b.mulai ? -1 : 1))
                  .map((p) => (
                    <motion.li key={p.id} variants={riseChild} className="flex items-start justify-between gap-3 rounded-field bg-well p-4 tactile-inset">
                      <div>
                        <b className="block">{formatRentang(p.mulai, p.akhir)}</b>
                        {p.keterangan && <span className="text-body-sm text-ink-muted">{p.keterangan}</span>}
                        <span className="mt-1.5 inline-block rounded-full bg-card px-2.5 py-0.5 text-body-sm">
                          {p.jadwal_id ? (jadwal.find((j) => j.id === p.jadwal_id)?.nama ?? 'Jadwal') : 'Semua Jadwal'}
                        </span>
                      </div>
                      <IconButton icon="delete" label={`Hapus pengecualian ${formatRentang(p.mulai, p.akhir)}`} size="sm" disabled={!boleh} onClick={() => void hapusPengecualian(p)} />
                    </motion.li>
                  ))}
              </motion.ul>
            )
          ) : daftar.length === 0 ? (
            <EmptyState icon="calendar_today" title={sub === 'aktif' ? 'Belum ada Jadwal aktif' : 'Belum ada Jadwal yang berakhir'}>
              {sub === 'aktif' ? 'Catat kegiatan tetap seperti kuliah atau rapat agar jam kosong terhitung tepat.' : 'Jadwal yang sudah diakhiri akan tampil di sini.'}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-field">
              <table className="w-full min-w-[640px] border-collapse text-body-md">
                <thead>
                  <tr className="text-left">
                    {['Jadwal', 'Jam', 'Pola', 'Periode', 'Aksi'].map((h) => (
                      <th key={h} scope="col" className="lbl px-2 py-2.5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <motion.tbody variants={staggerParent} initial="hidden" animate="show">
                  {daftar.map((j) => {
                    const v = versiTerakhir(versi, j.id)
                    if (!v) return null
                    const pernah = pernahBerlaku(versi, j.id, hariIni)
                    return (
                      <motion.tr key={j.id} variants={riseChild} className="border-t border-ink/6 align-top">
                        <td className="px-2 py-3.5 font-semibold">{j.nama}</td>
                        <td className="px-2 py-3.5 font-mono">
                          {formatJam(v.mulai_menit)}–{formatJam(v.selesai_menit)}
                        </td>
                        <td className="px-2 py-3.5">
                          <span className="rounded-full bg-well px-2.5 py-0.5 text-body-sm tactile-inset">
                            {v.sekali_jalan ? `Sekali · ${formatTanggal(v.berlaku_mulai)}` : v.hari.map((h) => HARI[h]).join(', ')}
                          </span>
                        </td>
                        <td className="px-2 py-3.5">
                          {v.sekali_jalan ? '-' : `${formatTanggal(v.berlaku_mulai)} – ${v.berlaku_akhir ? formatTanggal(v.berlaku_akhir) : 'tanpa batas'}`}
                          {pernah && !v.sekali_jalan && <span className="block text-body-sm text-ink-muted">Pernah berlaku; hanya bisa diakhiri.</span>}
                        </td>
                        <td className="px-2 py-3.5">
                          {sub === 'aktif' && (
                            <div className="flex flex-wrap gap-1.5">
                              <Button variant="tactile" size="sm" disabled={!boleh} onClick={() => layanan.bukaFormJadwal({ mode: 'ubah', jadwalId: j.id })}>
                                Ubah
                              </Button>
                              {!v.sekali_jalan && pernah && (
                                <Button variant="tactile" size="sm" disabled={!boleh} onClick={() => setAkhiri({ jadwal: j, tanggal: hariIni })}>
                                  Akhiri
                                </Button>
                              )}
                              {!pernah && (
                                <IconButton
                                  icon="delete"
                                  label={`Hapus ${j.nama}`}
                                  size="sm"
                                  disabled={!boleh}
                                  onClick={() => (v.sekali_jalan ? void hapusLangsung(j) : setHapus(j))}
                                />
                              )}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <FormPengecualian open={formPengecualian} onClose={() => setFormPengecualian(false)} />
      <LightConfirmDialog
        open={!!akhiri}
        onClose={() => setAkhiri(null)}
        onConfirm={() => akhiri && void jalankan(() => mutasi((v) => jadwalApi.akhiri(v, akhiri.jadwal.id, akhiri.tanggal)), () => setAkhiri(null))}
        title={`Akhiri “${akhiri?.jadwal.nama ?? ''}”?`}
        icon="event_busy"
        confirmLabel="Akhiri Jadwal"
        busy={proses}
        error={galat}
      >
        <div className="flex flex-col gap-3">
          <p>Jadwal tidak berlaku lagi setelah tanggal berakhir. Hari yang sudah lewat tetap tercatat.</p>
          <TextField
            label="Tanggal berakhir (inklusif)"
            type="date"
            min={hariIni}
            value={akhiri?.tanggal ?? hariIni}
            onChange={(e) => akhiri && setAkhiri({ ...akhiri, tanggal: e.target.value })}
          />
        </div>
      </LightConfirmDialog>
      <LightConfirmDialog
        open={!!hapus}
        onClose={() => setHapus(null)}
        onConfirm={() => hapus && void jalankan(() => mutasi((v) => jadwalApi.hapus(v, hapus.id)), () => setHapus(null))}
        title={`Hapus “${hapus?.nama ?? ''}”?`}
        icon="delete"
        confirmLabel="Hapus Jadwal"
        busy={proses}
        error={galat}
      >
        Jadwal ini belum pernah berlaku dan akan dihapus permanen.
      </LightConfirmDialog>
    </section>
  )
}
