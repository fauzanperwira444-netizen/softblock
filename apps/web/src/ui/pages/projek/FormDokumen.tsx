import { useId, useState, type FormEvent } from 'react'
import { projekApi } from '../../../api/projek'
import { useMutasi } from '../../../data/DataProvider'
import { rapikanUrl } from '../../../domain/projek'
import type { Dokumen } from '../../../domain/tipe'
import { Alert } from '../../kit/display'
import { TextField } from '../../kit/fields'
import { TANPA_GALAT } from '../../formGalat'
import { Dialog } from '../../overlay/Dialog'
import { BannerKonflik, KakiForm, useKirimForm } from '../../formUmum'

const NAMA_DOKUMEN_MAX = 60

type Props = { open: boolean; onClose: () => void; projekId: string; dokumen?: Dokumen | undefined }

/** Tautan dokumen projek: nama wajib, "https://" ditambahkan bila tanpa skema (A-08). */
export function FormDokumen({ open, onClose, projekId, dokumen }: Props) {
  const mutasi = useMutasi()
  const formId = useId()
  const { galat, setGalat, konflik, setKonflik, proses, kirim } = useKirimForm()
  const [nama, setNama] = useState(dokumen?.nama ?? '')
  const [url, setUrl] = useState(dokumen?.url ?? '')

  const [bukaSebelumnya, setBukaSebelumnya] = useState(open)
  if (open !== bukaSebelumnya) {
    setBukaSebelumnya(open)
    if (open) {
      setNama(dokumen?.nama ?? '')
      setUrl(dokumen?.url ?? '')
      setGalat(TANPA_GALAT)
      setKonflik(false)
    }
  }

  async function simpan(e: FormEvent) {
    e.preventDefault()
    const rapi = rapikanUrl(url)
    const kolom: Record<string, string> = {}
    if (!nama.trim()) kolom.nama = 'Nama dokumen wajib diisi.'
    if (!rapi) kolom.url = 'Tautan harus berupa alamat web yang valid (http atau https).'
    if (Object.keys(kolom).length > 0 || !rapi) {
      setGalat({ kolom })
      return
    }
    const isi = { nama: nama.trim(), url: rapi }
    const ok = await kirim(() =>
      mutasi((v) => (dokumen ? projekApi.ubahDokumen(v, dokumen.id, isi) : projekApi.tambahDokumen(v, projekId, isi))),
    )
    if (ok) onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={dokumen ? 'Ubah dokumen' : 'Tambah dokumen'}
      description="Tautan ke berkas di Drive atau web. Maksimal 10 per projek."
      glyph={{ icon: 'note_add' }}
      footer={<KakiForm formId={formId} label="Simpan dokumen" proses={proses} konflik={konflik} onBatal={onClose} />}
    >
      <form id={formId} onSubmit={simpan} noValidate className="flex flex-col gap-4">
        {konflik && <BannerKonflik onMuatUlang={() => setKonflik(false)} />}
        {galat.umum && <Alert tone="error">{galat.umum}</Alert>}
        <TextField
          label="Nama dokumen"
          required
          maxLength={NAMA_DOKUMEN_MAX}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          error={galat.kolom.nama}
          data-autofocus
        />
        <TextField
          label="Tautan"
          icon="link"
          inputMode="url"
          placeholder="docs.google.com/…"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={galat.kolom.url}
          hint="Tanpa https:// juga boleh; akan ditambahkan otomatis."
        />
      </form>
    </Dialog>
  )
}
