import { motion } from 'motion/react'
import { useState } from 'react'
import { ApiError } from '../../../api/errors'
import { useBolehUbah } from '../../../data/DataProvider'
import { cx } from '../../cx'
import { Button } from '../../kit/Button'
import { Alert } from '../../kit/display'
import { Icon } from '../../kit/Icon'
import { galatForm, TANPA_GALAT, type FormGalat } from '../../formGalat'
import { SPRING_SNAPPY } from '../../motion'

/** Status kirim formulir: galat per kolom, galat umum, dan konflik versi (AU-3, N-46). */
export function useKirimForm() {
  const [galat, setGalat] = useState<FormGalat>(TANPA_GALAT)
  const [konflik, setKonflik] = useState(false)
  const [proses, setProses] = useState(false)

  async function kirim(aksi: () => Promise<unknown>): Promise<boolean> {
    setProses(true)
    setGalat(TANPA_GALAT)
    try {
      await aksi()
      return true
    } catch (e) {
      if (e instanceof ApiError && e.kode === 'versi_konflik') setKonflik(true)
      else setGalat(galatForm(e))
      return false
    } finally {
      setProses(false)
    }
  }

  return { galat, setGalat, konflik, setKonflik, proses, kirim }
}

/** Pesan konflik di formulir: Simpan nonaktif sampai pengguna menekan Muat ulang. */
export function BannerKonflik({ onMuatUlang }: { onMuatUlang: () => void }) {
  return (
    <Alert
      tone="error"
      title="Data berubah di perangkat lain. Muat ulang?"
      action={
        <Button variant="tactile" size="sm" icon="refresh" onClick={onMuatUlang}>
          Muat ulang
        </Button>
      }
    >
      Muat ulang mengganti isian formulir dengan data terbaru.
    </Alert>
  )
}

/** Tombol kaki formulir: Batal + Simpan; Simpan nonaktif saat offline atau konflik, dengan alasannya. */
export function KakiForm({
  formId,
  label,
  icon = 'check',
  proses,
  konflik,
  onBatal,
}: {
  formId: string
  label: string
  icon?: 'check' | 'add' | 'refresh'
  proses: boolean
  konflik: boolean
  onBatal: () => void
}) {
  const { boleh, alasan } = useBolehUbah()
  return (
    <>
      {!boleh && alasan && (
        <p className="mr-auto flex items-center gap-1.5 text-body-sm text-ink-muted">
          <Icon name="lock" size={16} />
          {alasan}
        </p>
      )}
      <Button variant="tactile" onClick={onBatal}>
        Batal
      </Button>
      <Button type="submit" form={formId} icon={icon} busy={proses} disabled={!boleh || konflik}>
        {label}
      </Button>
    </>
  )
}

/** Pemilih warna 12 petak (A-02); warna yang dipakai projek belum tertutup dinonaktifkan. */
export function PilihWarna({
  palet,
  terpakai,
  nilai,
  onPilih,
  error,
}: {
  palet: readonly string[]
  terpakai: Set<string>
  nilai: string
  onPilih: (w: string) => void
  error?: string | undefined
}) {
  const indeks = palet.indexOf(nilai)
  return (
    <fieldset className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <legend className="lbl">Warna identitas</legend>
        {indeks >= 0 && <span className="text-body-sm font-semibold text-primary">Petak {indeks + 1} terpilih</span>}
      </div>
      <p className="text-body-sm text-ink-muted">Membantu mengenali projek di timeline dan kalender.</p>
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {palet.map((w, i) => {
          const dipakai = terpakai.has(w) && w !== nilai
          const dipilih = w === nilai
          return (
            <motion.button
              key={w}
              type="button"
              role="radio"
              aria-checked={dipilih}
              aria-label={`Warna ${i + 1}${dipakai ? ' (dipakai projek lain)' : ''}`}
              disabled={dipakai}
              onClick={() => onPilih(w)}
              whileTap={dipakai ? {} : { scale: 0.92 }}
              className={cx(
                'relative flex aspect-square min-h-11 items-center justify-center rounded-full bg-well tactile-inset disabled:opacity-60',
                dipilih && 'shadow-[inset_0_0_0_2px_var(--sb-primary),var(--sb-shadow-inset)]',
              )}
            >
              <span className="flex size-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: w }}>
                {dipilih && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING_SNAPPY}>
                    <Icon name="check" size={16} />
                  </motion.span>
                )}
                {dipakai && <Icon name="close" size={16} />}
              </span>
            </motion.button>
          )
        })}
      </div>
      <p className="text-body-sm text-ink-muted">Petak bertanda silang sedang dipakai projek lain yang belum tertutup.</p>
      {error && <p className="text-[0.8125rem] font-medium text-danger">{error}</p>}
    </fieldset>
  )
}
