import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { projekApi } from '../../../api/projek'
import { useMutasi } from '../../../data/DataProvider'
import { useDataProjek } from '../../../data/pilih'
import { useWaktu } from '../../../data/useWaktu'
import {
  DESKRIPSI_MAX,
  NAMA_PROJEK_MAX,
  PALET_PROJEK,
  validasiNamaProjek,
  warnaPertamaBebas,
  warnaTerpakai,
} from '../../../domain/projek'
import type { Projek } from '../../../domain/tipe'
import { Alert } from '../../kit/display'
import { TANPA_GALAT } from '../../formGalat'
import { TextareaField, TextField } from '../../kit/fields'
import { Dialog } from '../../overlay/Dialog'
import { BannerKonflik, KakiForm, PilihWarna, useKirimForm } from '../../formUmum'

type Props = { open: boolean; onClose: () => void; projek?: Projek | undefined }

/** F-11: buat atau ubah projek. Nama dan warna divalidasi di perangkat lalu diperiksa ulang server. */
export function FormProjek({ open, onClose, projek }: Props) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const mutasi = useMutasi()
  const navigate = useNavigate()
  const formId = useId()
  const { galat, setGalat, konflik, setKonflik, proses, kirim } = useKirimForm()

  const terpakai = data && waktu ? warnaTerpakai(data, waktu.hariIni, projek?.id ?? null) : new Set<string>()
  const [nama, setNama] = useState(projek?.nama ?? '')
  const [deskripsi, setDeskripsi] = useState(projek?.deskripsi ?? '')
  const [warna, setWarna] = useState(projek?.warna ?? warnaPertamaBebas(terpakai) ?? PALET_PROJEK[0])

  // Isian disetel ulang setiap kali formulir dibuka (pola "sesuaikan state saat prop berubah").
  const [bukaSebelumnya, setBukaSebelumnya] = useState(open)
  if (open !== bukaSebelumnya) {
    setBukaSebelumnya(open)
    if (open) {
      setNama(projek?.nama ?? '')
      setDeskripsi(projek?.deskripsi ?? '')
      setWarna(projek?.warna ?? warnaPertamaBebas(terpakai) ?? PALET_PROJEK[0])
      setGalat(TANPA_GALAT)
      setKonflik(false)
    }
  }

  function muatUlang() {
    const terbaru = projek && data?.projek.find((p) => p.id === projek.id)
    setNama(terbaru?.nama ?? '')
    setDeskripsi(terbaru?.deskripsi ?? '')
    if (terbaru) setWarna(terbaru.warna)
    setKonflik(false)
  }

  async function simpan(e: FormEvent) {
    e.preventDefault()
    if (!data) return
    const gNama = validasiNamaProjek(nama, data, projek?.id ?? null)
    const kolom: Record<string, string> = {}
    if (gNama) kolom.nama = gNama
    if (deskripsi.length > DESKRIPSI_MAX) kolom.deskripsi = `Deskripsi maksimal ${DESKRIPSI_MAX} karakter.`
    if (terpakai.has(warna)) kolom.warna = 'Warna ini dipakai projek lain yang belum tertutup.'
    if (Object.keys(kolom).length > 0) {
      setGalat({ kolom })
      return
    }
    const isi = { nama: nama.trim(), deskripsi, warna }
    let idBaru: string | undefined
    const ok = await kirim(async () => {
      const hasil = await mutasi((v) => (projek ? projekApi.ubah(v, projek.id, isi) : projekApi.buat(v, isi)))
      idBaru = hasil.id
    })
    if (!ok) return
    onClose()
    if (!projek && idBaru) navigate(`/projek/${idBaru}`)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={projek ? 'Ubah projek' : 'Buat projek baru'}
      description={projek ? 'Mengganti nama juga mengganti label task di projek ini.' : 'Kelompokkan sesi dan task dalam satu wadah.'}
      glyph={{ icon: projek ? 'edit' : 'create_new_folder' }}
      footer={
        <KakiForm formId={formId} label={projek ? 'Simpan perubahan' : 'Simpan projek'} proses={proses} konflik={konflik} onBatal={onClose} />
      }
    >
      <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
        {konflik && <BannerKonflik onMuatUlang={muatUlang} />}
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        <TextField
          label="Nama projek"
          icon="folder"
          required
          maxLength={NAMA_PROJEK_MAX}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          error={galat.kolom.nama}
          data-autofocus
        />
        <TextareaField
          label="Deskripsi (opsional)"
          maxLength={DESKRIPSI_MAX}
          rows={3}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          error={galat.kolom.deskripsi}
        />
        <PilihWarna palet={PALET_PROJEK} terpakai={terpakai} nilai={warna} onPilih={setWarna} error={galat.kolom.warna} />
      </form>
    </Dialog>
  )
}
