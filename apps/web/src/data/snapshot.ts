import { NAMA_TABEL, type IsiTabel, type NamaTabel, type ResponsSinkron, type Tanggal } from '../domain/tipe'

/** Salinan baca-saja data akun di perangkat (AD-2). */
export type Snapshot = {
  revisi: number
  /** Waktu sinkron terakhir yang berhasil (ISO UTC); dipakai untuk "Data per". */
  disinkron_pada: string
  hari_ini: Tanggal
  zona_waktu: string
  /** Tidak ada di snapshot yang disimpan sebelum fitur pengenalan. */
  akun_dibuat?: Tanggal | null
  isi: IsiTabel
}

export function isiKosong(): IsiTabel {
  return Object.fromEntries(NAMA_TABEL.map((t) => [t, {}])) as unknown as IsiTabel
}

/** Terapkan respons sinkron (penuh atau delta) ke snapshot tanpa mengubah snapshot lama. */
export function terapkan(lama: Snapshot | null, respons: ResponsSinkron, sekarang: Date): Snapshot {
  const dasar = respons.penuh || !lama ? isiKosong() : lama.isi
  const isi = { ...dasar } as Record<NamaTabel, Record<string, { id: string }>>

  for (const tabel of NAMA_TABEL) {
    const baris = respons.ubah[tabel]
    if (!baris || baris.length === 0) continue
    const salinan = { ...isi[tabel] }
    for (const b of baris) salinan[b.id] = b
    isi[tabel] = salinan
  }
  for (const { tabel, id } of respons.hapus) {
    if (!isi[tabel]?.[id]) continue
    const salinan = { ...isi[tabel] }
    delete salinan[id]
    isi[tabel] = salinan
  }

  return {
    revisi: respons.revisi,
    disinkron_pada: sekarang.toISOString(),
    hari_ini: respons.meta.hari_ini,
    zona_waktu: respons.meta.zona_waktu,
    akun_dibuat: respons.meta.akun_dibuat,
    isi: isi as unknown as IsiTabel,
  }
}
