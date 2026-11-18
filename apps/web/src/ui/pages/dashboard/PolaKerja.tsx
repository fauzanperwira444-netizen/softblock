import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { polaKerjaApi } from '../../../api/polaKerja'
import { useData } from '../../../data/DataProvider'
import { rentangPilihan, type HasilPolaKerja, type PilihanRentang } from '../../../domain/polaKerja'
import type { Tanggal } from '../../../domain/tipe'
import { Button } from '../../kit/Button'
import { Alert, Card, CardTitle, Spinner } from '../../kit/display'
import { SelectField, TextField } from '../../kit/fields'
import { formatTanggal } from '../../format'
import { galatForm } from '../../formGalat'
import { EASE_OUT, STAGGER } from '../../motion'

const PILIHAN: Array<{ value: PilihanRentang; label: string }> = [
  { value: 'minggu_ini', label: 'Minggu ini' },
  { value: 'empat_minggu', label: '4 minggu terakhir' },
  { value: 'bulan_ini', label: 'Bulan ini' },
  { value: 'tiga_bulan', label: '3 bulan terakhir' },
  { value: 'tahun_ini', label: 'Tahun ini' },
  { value: 'semua', label: 'Semua' },
  { value: 'kustom', label: 'Rentang kustom' },
]

const JUDUL_SERI = { hari: 'Task selesai per hari', minggu: 'Task selesai per minggu', bulan: 'Task selesai per bulan' } as const

type Muatan = { kunci: string; hasil: HasilPolaKerja | null; galat: string | null }

/** D-11, D-12: dimuat setelah bagian lain dan gagal sendiri tanpa mengganggu Dashboard. */
export function PolaKerja({ hariIni, awalData }: { hariIni: Tanggal; awalData: Tanggal }) {
  const { koneksi, snapshot } = useData()
  const [pilihan, setPilihan] = useState<PilihanRentang>('empat_minggu')
  const [kustom, setKustom] = useState({ dari: hariIni, sampai: hariIni })
  const [ulang, setUlang] = useState(0)
  const [muatan, setMuatan] = useState<Muatan>({ kunci: '', hasil: null, galat: null })

  const rentang = pilihan === 'kustom' ? kustom : rentangPilihan(pilihan, hariIni, awalData)
  const kustomSalah = pilihan === 'kustom' && (!kustom.dari || !kustom.sampai || kustom.dari > kustom.sampai || kustom.sampai > hariIni)
  const offline = koneksi === 'offline' || koneksi === 'galat'
  const kunci = `${rentang.dari}|${rentang.sampai}|${snapshot?.revisi ?? 0}|${ulang}`
  const memuat = !offline && !kustomSalah && muatan.kunci !== kunci

  useEffect(() => {
    if (offline || kustomSalah) return
    let batal = false
    polaKerjaApi.ambil(rentang.dari, rentang.sampai).then(
      (hasil) => !batal && setMuatan({ kunci, hasil, galat: null }),
      (e: unknown) => !batal && setMuatan({ kunci, hasil: null, galat: galatForm(e).umum ?? 'Pola kerja gagal dimuat.' }),
    )
    return () => {
      batal = true
    }
  }, [kunci, offline, kustomSalah, rentang.dari, rentang.sampai])

  const hasil = muatan.kunci === kunci ? muatan.hasil : null
  const galat = muatan.kunci === kunci ? muatan.galat : null

  return (
    <Card className="flex flex-col gap-5" aria-labelledby="dash-pola" aria-busy={memuat}>
      <CardTitle icon="monitoring" id="dash-pola">
        Pola kerja
      </CardTitle>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-end">
        <SelectField label="Rentang" value={pilihan} onChange={(e) => setPilihan(e.target.value as PilihanRentang)}>
          {PILIHAN.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </SelectField>
        {pilihan === 'kustom' ? (
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Dari" type="date" max={hariIni} value={kustom.dari} onChange={(e) => setKustom((k) => ({ ...k, dari: e.target.value }))} />
            <TextField
              label="Sampai"
              type="date"
              max={hariIni}
              value={kustom.sampai}
              onChange={(e) => setKustom((k) => ({ ...k, sampai: e.target.value }))}
              {...(kustomSalah ? { error: 'Tanggal akhir harus setelah tanggal awal dan tidak melewati hari ini.' } : {})}
            />
          </div>
        ) : (
          <p className="pb-3 font-mono text-body-sm text-ink-muted">
            {formatTanggal(rentang.dari)} – {formatTanggal(rentang.sampai)}
          </p>
        )}
      </div>

      {offline ? (
        <Alert tone="info" icon="cloud_off">
          Pola kerja dihitung di server dan butuh koneksi. Bagian lain Dashboard tetap memakai data di perangkat.
        </Alert>
      ) : kustomSalah ? null : memuat && !hasil ? (
        <Spinner label="Memuat pola kerja…" />
      ) : galat ? (
        <Alert
          tone="error"
          title="Pola kerja gagal dimuat"
          action={
            <Button size="sm" variant="outline" icon="refresh" onClick={() => setUlang((n) => n + 1)}>
              Coba lagi
            </Button>
          }
        >
          {galat}
        </Alert>
      ) : hasil ? (
        <IsiPola hasil={hasil} />
      ) : null}
    </Card>
  )
}

function IsiPola({ hasil }: { hasil: HasilPolaKerja }) {
  const kosong = hasil.selesai === 0 && hasil.dibuat === 0 && hasil.batal === 0 && hasil.dikerjakan === 0 && hasil.tidak_dikerjakan === 0
  if (kosong) {
    return <p className="rounded-field bg-well px-4 py-6 text-center text-ink-muted tactile-inset">Tidak ada data di rentang ini.</p>
  }
  const puncak = Math.max(1, ...hasil.seri.map((s) => s.selesai))
  const totalRasio = hasil.dikerjakan + hasil.tidak_dikerjakan
  const rasio = totalRasio === 0 ? null : Math.round((hasil.dikerjakan / totalRasio) * 100)
  const judul = JUDUL_SERI[hasil.granularitas]
  // Label sumbu dijarangkan bila batang banyak agar tidak bertumpuk.
  const jarak = Math.ceil(hasil.seri.length / 8)

  return (
    <div className="flex flex-col gap-5">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-body-sm font-semibold text-ink-muted">{judul}</figcaption>
        <div
          role="img"
          aria-label={`${judul}: ${hasil.seri.map((s) => `${s.label} ${s.selesai}`).join(', ')}`}
          className="flex h-40 items-end gap-1 rounded-field bg-well px-3 pt-4 pb-2 tactile-inset"
        >
          {hasil.seri.map((s, i) => (
            <div key={s.mulai} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              {s.selesai > 0 && <span className="font-mono text-[0.6875rem] font-bold">{s.selesai}</span>}
              <motion.i
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: Math.min(i, 12) * STAGGER }}
                className={s.selesai > 0 ? 'w-full max-w-8 origin-bottom rounded-t-md bg-primary' : 'h-1 w-full max-w-8 rounded-full bg-high'}
                style={s.selesai > 0 ? { height: `${(s.selesai / puncak) * 100}%` } : {}}
              />
              <span className={i % jarak === 0 ? 'truncate font-mono text-[0.625rem] text-ink-muted' : 'invisible text-[0.625rem]'}>{s.label}</span>
            </div>
          ))}
        </div>
        <details className="text-body-sm">
          <summary className="min-h-11 cursor-pointer content-center font-semibold text-primary">Tabel nilai</summary>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-ink-muted">
                <th scope="col" className="py-1 font-semibold">
                  Periode
                </th>
                <th scope="col" className="py-1 text-right font-semibold">
                  Selesai
                </th>
              </tr>
            </thead>
            <tbody>
              {hasil.seri.map((s) => (
                <tr key={s.mulai} className="border-t border-ink/7">
                  <td className="py-1">{s.mulai === s.akhir ? formatTanggal(s.mulai) : `${formatTanggal(s.mulai)} – ${formatTanggal(s.akhir)}`}</td>
                  <td className="py-1 text-right font-mono">{s.selesai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-field bg-well px-4 py-3 tactile-inset">
          <dt className="lbl">Status task di rentang ini</dt>
          <dd className="mt-1 font-semibold">
            Dibuat <span className="font-mono">{hasil.dibuat}</span> · Selesai <span className="font-mono">{hasil.selesai}</span> · Batal{' '}
            <span className="font-mono">{hasil.batal}</span>
          </dd>
        </div>
        <div className="rounded-field bg-well px-4 py-3 tactile-inset">
          <dt className="lbl">Entri to-do hari lewat</dt>
          <dd className="mt-1 font-semibold">
            {rasio === null ? (
              <span className="font-normal text-ink-muted">Tidak ada data</span>
            ) : (
              <>
                <span className="font-mono">{rasio}%</span> dikerjakan{' '}
                <span className="text-body-sm font-normal text-ink-muted">
                  ({hasil.dikerjakan} dikerjakan, {hasil.tidak_dikerjakan} tidak)
                </span>
              </>
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}
