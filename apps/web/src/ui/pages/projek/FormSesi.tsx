import { useId, useState, type FormEvent } from 'react'
import { projekApi } from '../../../api/projek'
import { useMutasi } from '../../../data/DataProvider'
import { useDataProjek } from '../../../data/pilih'
import { useWaktu } from '../../../data/useWaktu'
import {
  dampakUbahPeriode,
  DESKRIPSI_MAX,
  hitungStatusProjek,
  NAMA_SESI_MAX,
  PALET_PROJEK,
  perluDialogBerat,
  sesiProjek,
  validasiSesi,
  warnaPertamaBebas,
  warnaTerpakai,
  type Dampak,
  type IsianSesi,
} from '../../../domain/projek'
import { tambahHari } from '../../../domain/tanggal'
import type { Projek, Sesi } from '../../../domain/tipe'
import { Alert } from '../../kit/display'
import { TextareaField, TextField } from '../../kit/fields'
import { formatRentang } from '../../format'
import { TANPA_GALAT } from '../../formGalat'
import { HeavyConfirmDialog } from '../../overlay/ConfirmDialog'
import { Dialog } from '../../overlay/Dialog'
import { BannerKonflik, KakiForm, PilihWarna, useKirimForm } from './formUmum'
import { uraianDampak } from './uraianDampak'

export type ModeSesi = 'tambah' | 'ubah' | 'buka'

type Props = { open: boolean; onClose: () => void; projek: Projek; sesi?: Sesi | undefined; mode: ModeSesi }

const JUDUL: Record<ModeSesi, string> = { tambah: 'Tambah sesi', ubah: 'Ubah sesi', buka: 'Buka kembali projek' }

/** F-12: tambah atau ubah sesi, dan alur buka kembali projek lewat sesi baru (A-07). */
export function FormSesi({ open, onClose, projek, sesi, mode }: Props) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const mutasi = useMutasi()
  const formId = useId()
  const { galat, setGalat, konflik, setKonflik, proses, kirim } = useKirimForm()
  const hariIni = waktu?.hariIni ?? ''

  const awal = (): IsianSesi =>
    sesi
      ? { nama: sesi.nama, mulai: sesi.mulai, akhir: sesi.akhir, deskripsi: sesi.deskripsi }
      : { nama: `Sesi ${(data ? sesiProjek(data, projek.id).filter((s) => !s.batal).length : 0) + 1}`, mulai: hariIni, akhir: tambahHari(hariIni, 13), deskripsi: '' }

  const [isian, setIsian] = useState<IsianSesi>(awal)
  const [warna, setWarna] = useState<string | null>(null)
  const [dampak, setDampak] = useState<Dampak | null>(null)

  const [bukaSebelumnya, setBukaSebelumnya] = useState(open)
  if (open !== bukaSebelumnya) {
    setBukaSebelumnya(open)
    if (open) {
      setIsian(awal())
      setWarna(null)
      setDampak(null)
      setGalat(TANPA_GALAT)
      setKonflik(false)
    }
  }

  const terpakai = data && waktu ? warnaTerpakai(data, hariIni, projek.id) : new Set<string>()
  const warnaBentrok = mode === 'buka' && terpakai.has(projek.warna.toLowerCase())
  const periodeTerkunci = mode === 'ubah' && !!sesi && sesi.mulai <= hariIni && sesi.akhir < hariIni
  const mulaiTerkunci = mode === 'ubah' && !!sesi && sesi.mulai <= hariIni

  const ubah = (kunci: keyof IsianSesi) => (e: { target: { value: string } }) => setIsian((s) => ({ ...s, [kunci]: e.target.value }))

  async function jalankan(dampakKirim: Dampak | null) {
    const isi = { ...isian, nama: isian.nama.trim() }
    const ok = await kirim(async () => {
      await mutasi((v) =>
        mode === 'tambah'
          ? projekApi.tambahSesi(v, projek.id, isi)
          : mode === 'buka'
            ? projekApi.bukaKembali(v, projek.id, isi, warnaBentrok ? warna : null)
            : projekApi.ubahSesi(v, sesi?.id ?? '', isi, dampakKirim),
      )
    })
    return ok
  }

  async function simpan(e: FormEvent) {
    e.preventDefault()
    if (!data || !waktu) return
    const periodeBerubah = mode !== 'ubah' || isian.mulai !== sesi?.mulai || isian.akhir !== sesi?.akhir
    const g = validasiSesi(isian, sesiProjek(data, projek.id), hariIni, { kecualiId: sesi?.id ?? null, periodeBerubah }, formatRentang)
    if (warnaBentrok && !warna) g.umum = g.umum ?? 'Warna lama sedang dipakai projek lain. Pilih warna baru.'
    if (Object.keys(g).length > 0) {
      const { umum, ...kolom } = g
      setGalat({ ...(umum ? { umum } : {}), kolom: kolom as Record<string, string> })
      return
    }
    if (mode === 'ubah' && sesi && periodeBerubah) {
      const d = dampakUbahPeriode(data, projek, sesi, isian.mulai, isian.akhir, hariIni)
      if (perluDialogBerat(hitungStatusProjek(data, projek, hariIni), d)) {
        setDampak(d)
        return
      }
      if (await jalankan(d)) onClose()
      return
    }
    if (await jalankan(null)) onClose()
  }

  async function konfirmasiPeriode() {
    // Server menolak dengan 409 dampak_berubah bila dampaknya berbeda; dialog lalu menampilkan dampak terbaru.
    if (dampakTerkini && (await jalankan(dampakTerkini))) {
      setDampak(null)
      onClose()
    }
  }

  // Dampak dihitung ulang dari data terbaru agar dialog ikut berubah setelah 409 dampak_berubah.
  const dampakTerkini = dampak && data && sesi ? dampakUbahPeriode(data, projek, sesi, isian.mulai, isian.akhir, hariIni) : null
  const uraian = dampakTerkini && data ? uraianDampak('ubah_periode', dampakTerkini, data) : null

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={JUDUL[mode]}
        description={
          mode === 'buka'
            ? `Projek “${projek.nama}” dibuka lagi dengan sesi baru yang berakhir hari ini atau setelahnya. Sesi dan task yang batal tidak dipulihkan.`
            : `${projek.nama} · sesi tidak boleh tumpang tindih.`
        }
        glyph={{ icon: mode === 'buka' ? 'refresh' : 'calendar_today' }}
        footer={
          <KakiForm
            formId={formId}
            label={mode === 'buka' ? 'Buka kembali projek' : 'Simpan sesi'}
            icon={mode === 'buka' ? 'refresh' : 'check'}
            proses={proses && !dampak}
            konflik={konflik}
            onBatal={onClose}
          />
        }
      >
        <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
          {konflik && (
            <BannerKonflik
              onMuatUlang={() => {
                setIsian(awal())
                setKonflik(false)
              }}
            />
          )}
          {galat.umum && (
            <Alert tone="error" title="Periksa periode sesi">
              {galat.umum}
            </Alert>
          )}
          <TextField
            label="Nama sesi"
            required
            maxLength={NAMA_SESI_MAX}
            value={isian.nama}
            onChange={ubah('nama')}
            error={galat.kolom.nama}
            hint="Unik di antara sesi yang tidak batal di projek ini."
            data-autofocus
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Tanggal mulai"
              icon="calendar_today"
              type="date"
              required
              value={isian.mulai}
              onChange={ubah('mulai')}
              error={galat.kolom.mulai}
              disabled={periodeTerkunci || mulaiTerkunci}
              {...(mulaiTerkunci ? { hint: 'Sesi sudah berjalan; tanggal mulai tetap.' } : {})}
            />
            <TextField
              label="Tanggal akhir"
              icon="event_busy"
              type="date"
              required
              min={hariIni}
              value={isian.akhir}
              onChange={ubah('akhir')}
              error={galat.kolom.akhir}
              disabled={periodeTerkunci}
              {...(periodeTerkunci ? { hint: 'Periode sesi yang selesai terkunci.' } : {})}
            />
          </div>
          <TextareaField
            label="Deskripsi sesi (opsional)"
            rows={2}
            maxLength={DESKRIPSI_MAX}
            value={isian.deskripsi}
            onChange={ubah('deskripsi')}
            error={galat.kolom.deskripsi}
          />
          {warnaBentrok && (
            <PilihWarna
              palet={PALET_PROJEK}
              terpakai={terpakai}
              nilai={warna ?? warnaPertamaBebas(terpakai) ?? ''}
              onPilih={setWarna}
              error={galat.kolom.warna}
            />
          )}
        </form>
      </Dialog>

      <HeavyConfirmDialog
        open={!!dampak && !!uraian}
        onClose={() => setDampak(null)}
        onConfirm={() => void konfirmasiPeriode()}
        title={`Ubah periode “${isian.nama.trim()}”?`}
        description={`Periode baru ${formatRentang(isian.mulai, isian.akhir)}.`}
        icon="calendar_today"
        confirmLabel="Terapkan periode baru"
        akanTerjadi={uraian?.akanTerjadi ?? []}
        tetapAda={uraian?.tetapAda ?? []}
        busy={proses}
        error={galat.umum}
      />
    </>
  )
}
