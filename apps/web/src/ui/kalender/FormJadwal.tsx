import { motion } from 'motion/react'
import { useId, useState, type FormEvent } from 'react'
import { jadwalApi } from '../../api/jadwal'
import { useMutasi } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import {
  bentrokJadwalLain,
  jadwalPadaTanggal,
  JAM_AKHIR,
  JAM_AWAL,
  jamBertumpuk,
  jatuhDalamPengecualian,
  NAMA_JADWAL_MAX,
  pernahBerlaku,
  validasiJadwal,
  versiTerakhir,
  type IsianJadwal,
} from '../../domain/jadwal'
import { hariIso } from '../../domain/tanggal'
import { cx } from '../cx'
import { SegmentedControl } from '../kit/controls'
import { Alert } from '../kit/display'
import { SelectField, TextField } from '../kit/fields'
import { formatJam, formatTanggal } from '../format'
import { TANPA_GALAT } from '../formGalat'
import { KakiForm, useKirimForm } from '../formUmum'
import { riseChild, staggerParent } from '../motion'
import { Dialog } from '../overlay/Dialog'

export type AwalFormJadwal = { mode: 'buat'; sekaliJalan?: boolean; tanggal?: string; mulai?: number } | { mode: 'ubah'; jadwalId: string }

const HARI = [
  [1, 'Sen'],
  [2, 'Sel'],
  [3, 'Rab'],
  [4, 'Kam'],
  [5, 'Jum'],
  [6, 'Sab'],
  [7, 'Min'],
] as const
const PILIHAN_JAM = Array.from({ length: (JAM_AKHIR - JAM_AWAL) / 5 + 1 }, (_, i) => JAM_AWAL + i * 5)

/** F-16: Jadwal mingguan atau sekali jalan. Bentrok hanya diperingatkan (F-05, F-08). */
export function FormJadwal({ awal, onClose }: { awal: AwalFormJadwal | null; onClose: () => void }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const mutasi = useMutasi()
  const formId = useId()
  const { galat, setGalat, konflik, setKonflik, proses, kirim } = useKirimForm()
  const hariIni = waktu?.hariIni ?? ''

  const jadwalUbah = awal?.mode === 'ubah' && data ? data.jadwalData.jadwal.find((j) => j.id === awal.jadwalId) : undefined
  const versiUbah = jadwalUbah && data ? versiTerakhir(data.jadwalData.versi, jadwalUbah.id) : undefined
  const pernah = jadwalUbah && data ? pernahBerlaku(data.jadwalData.versi, jadwalUbah.id, hariIni) : false

  const isianAwal = (): IsianJadwal => {
    if (jadwalUbah && versiUbah) {
      return {
        nama: jadwalUbah.nama,
        mulai: versiUbah.mulai_menit,
        selesai: versiUbah.selesai_menit,
        sekaliJalan: versiUbah.sekali_jalan,
        hari: versiUbah.hari,
        // Edit jadwal yang pernah berlaku mulai hari ini; versi lama berakhir kemarin (F-03).
        tanggal: pernah ? hariIni : versiUbah.berlaku_mulai < hariIni ? hariIni : versiUbah.berlaku_mulai,
        berakhir: versiUbah.sekali_jalan ? null : versiUbah.berlaku_akhir,
      }
    }
    const b = awal?.mode === 'buat' ? awal : undefined
    const mulai = b?.mulai ?? 9 * 60
    const tanggal = b?.tanggal ?? hariIni
    return {
      nama: '',
      mulai,
      selesai: Math.min(JAM_AKHIR, mulai + 60),
      sekaliJalan: b?.sekaliJalan ?? false,
      hari: tanggal ? [hariIso(tanggal)] : [],
      tanggal,
      berakhir: null,
    }
  }

  const [isian, setIsian] = useState<IsianJadwal>(isianAwal)
  const [sebelumnya, setSebelumnya] = useState(awal)
  if (awal !== sebelumnya) {
    setSebelumnya(awal)
    if (awal) {
      setIsian(isianAwal())
      setGalat(TANPA_GALAT)
      setKonflik(false)
    }
  }

  const ganti = <K extends keyof IsianJadwal>(k: K, v: IsianJadwal[K]) => setIsian((s) => ({ ...s, [k]: v }))
  const jadwalId = jadwalUbah?.id ?? null
  const bentrok = data && isian.tanggal ? bentrokJadwalLain(data.jadwalData, isian, jadwalId) : []
  const pengecualian = data && isian.tanggal ? jatuhDalamPengecualian(data.jadwalData.pengecualian, isian, jadwalId) : undefined

  // F-08: blok hari ini dan mendatang yang akan tertimpa; diizinkan dan ditandai "bentrok".
  const blokTertimpa =
    data && isian.tanggal && isian.mulai < isian.selesai
      ? data.blok.filter((b) => {
          if (b.tanggal < hariIni || b.tanggal < isian.tanggal) return false
          if (isian.sekaliJalan ? b.tanggal !== isian.tanggal : !isian.hari.includes(hariIso(b.tanggal)) || (isian.berakhir !== null && b.tanggal > isian.berakhir)) return false
          const sudah = jadwalPadaTanggal(data.jadwalData, b.tanggal).some((k) => k.jadwal.id === jadwalId && jamBertumpuk(k, { mulai: b.mulai_menit, selesai: b.selesai_menit }))
          return !sudah && jamBertumpuk(isian, { mulai: b.mulai_menit, selesai: b.selesai_menit })
        })
      : []
  const namaTaskTertimpa = blokTertimpa
    .map((b) => data?.task.find((t) => t.id === data.entri.find((e) => e.id === b.entri_id)?.task_id)?.nama)
    .filter(Boolean)

  async function simpan(e: FormEvent) {
    e.preventDefault()
    const g = validasiJadwal(isian, hariIni)
    if (Object.keys(g).length > 0) {
      setGalat({ kolom: g as Record<string, string> })
      return
    }
    const isi = { ...isian, nama: isian.nama.trim() }
    const ok = await kirim(() => mutasi((v) => (jadwalUbah ? jadwalApi.ubah(v, jadwalUbah.id, isi) : jadwalApi.buat(v, isi))))
    if (ok) onClose()
  }

  return (
    <Dialog
      open={!!awal}
      onClose={onClose}
      title={jadwalUbah ? 'Ubah Jadwal' : isian.sekaliJalan ? 'Jadwal sekali jalan' : 'Tambah Jadwal'}
      description={jadwalUbah && pernah ? 'Perubahan berlaku mulai tanggal yang dipilih. Hari yang sudah lewat tidak berubah.' : 'Kegiatan tetap yang mengisi jam di hari tertentu.'}
      glyph={{ icon: 'calendar_today' }}
      footer={<KakiForm formId={formId} label="Simpan Jadwal" proses={proses} konflik={konflik} onBatal={onClose} />}
    >
      <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
        {konflik && <Alert tone="error">Data berubah di perangkat lain. Tutup lalu buka lagi formulir ini.</Alert>}
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        {!jadwalUbah && (
          <SegmentedControl
            label="Pola"
            value={isian.sekaliJalan ? 'sekali' : 'mingguan'}
            onChange={(v) => ganti('sekaliJalan', v === 'sekali')}
            options={[
              { value: 'mingguan', label: 'Mingguan' },
              { value: 'sekali', label: 'Sekali jalan' },
            ]}
          />
        )}
        <TextField label="Nama Jadwal" required maxLength={NAMA_JADWAL_MAX} value={isian.nama} onChange={(e) => ganti('nama', e.target.value)} error={galat.kolom.nama} data-autofocus />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Mulai" icon="schedule" value={isian.mulai} onChange={(e) => ganti('mulai', Number(e.target.value))} className="font-mono font-bold" error={galat.kolom.jam}>
            {PILIHAN_JAM.slice(0, -1).map((m) => (
              <option key={m} value={m}>
                {formatJam(m)}
              </option>
            ))}
          </SelectField>
          <SelectField label="Selesai" icon="schedule" value={isian.selesai} onChange={(e) => ganti('selesai', Number(e.target.value))} className="font-mono font-bold">
            {PILIHAN_JAM.slice(1).map((m) => (
              <option key={m} value={m}>
                {formatJam(m)}
              </option>
            ))}
          </SelectField>
        </div>
        {!isian.sekaliJalan && (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="lbl">Hari berulang</legend>
            <div className="grid grid-cols-7 gap-1.5">
              {HARI.map(([n, nama]) => {
                const aktif = isian.hari.includes(n)
                return (
                  <motion.button
                    key={n}
                    type="button"
                    aria-pressed={aktif}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => ganti('hari', aktif ? isian.hari.filter((h) => h !== n) : [...isian.hari, n])}
                    className={cx('min-h-11 rounded-full text-body-sm font-semibold', aktif ? 'bg-primary text-on-primary' : 'bg-well text-ink-muted tactile-inset hover:text-ink')}
                  >
                    {nama}
                  </motion.button>
                )
              })}
            </div>
            {galat.kolom.hari && <p className="text-[0.8125rem] font-medium text-danger">{galat.kolom.hari}</p>}
          </fieldset>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={isian.sekaliJalan ? 'Tanggal' : jadwalUbah && pernah ? 'Berlaku mulai' : 'Tanggal mulai'}
            icon="calendar_today"
            type="date"
            required
            min={hariIni}
            value={isian.tanggal}
            onChange={(e) => ganti('tanggal', e.target.value)}
            error={galat.kolom.tanggal}
          />
          {!isian.sekaliJalan && (
            <TextField
              label="Berakhir (opsional)"
              icon="event_busy"
              type="date"
              min={isian.tanggal || hariIni}
              value={isian.berakhir ?? ''}
              onChange={(e) => ganti('berakhir', e.target.value || null)}
              error={galat.kolom.berakhir}
              hint="Kosongkan bila tanpa batas waktu."
            />
          )}
        </div>
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-2">
          {bentrok.length > 0 && (
            <motion.div variants={riseChild}>
              <Alert tone="info" icon="warning" title="Peringatan bentrok Jadwal">
                Bertumpuk dengan {bentrok.map((b) => `${b.nama} (${formatJam(b.mulai)}–${formatJam(b.selesai)})`).join(', ')}. Jadwal tetap bisa disimpan.
              </Alert>
            </motion.div>
          )}
          {blokTertimpa.length > 0 && (
            <motion.div variants={riseChild}>
              <Alert tone="info" icon="warning" title="Menimpa blok to-do">
                {blokTertimpa.length} blok akan ditandai “bentrok”: {[...new Set(namaTaskTertimpa)].join(', ')}.
              </Alert>
            </motion.div>
          )}
          {pengecualian && (
            <motion.div variants={riseChild}>
              <Alert tone="info" title="Jatuh dalam pengecualian">
                Jadwal ini tidak berlaku pada {formatTanggal(pengecualian.mulai)}
                {pengecualian.akhir !== pengecualian.mulai && ` – ${formatTanggal(pengecualian.akhir)}`}
                {pengecualian.keterangan && ` (${pengecualian.keterangan})`}.
              </Alert>
            </motion.div>
          )}
        </motion.div>
      </form>
    </Dialog>
  )
}
