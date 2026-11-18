import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { taskApi } from '../../api/task'
import { useBolehUbah, useMutasi } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { NAMA_LABEL_MAX, validasiNamaLabel } from '../../domain/task'
import type { LabelMandiri } from '../../domain/tipe'
import { Button, IconButton } from '../kit/Button'
import { Alert, EmptyState } from '../kit/display'
import { Icon } from '../kit/Icon'
import { TextField } from '../kit/fields'
import { galatForm } from '../formGalat'
import { DUR, riseChild, staggerParent } from '../motion'
import { LightConfirmDialog } from '../overlay/ConfirmDialog'
import { Dialog } from '../overlay/Dialog'

/** H-07: kelola label mandiri, termasuk yang tanpa task; ganti nama dan hapus (C-03). */
export function DialogLabel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useDataProjek()
  const mutasi = useMutasi()
  const { boleh, alasan } = useBolehUbah()
  const [ubahId, setUbahId] = useState<string | null>(null)
  const [nama, setNama] = useState('')
  const [galat, setGalat] = useState<string>()
  const [hapus, setHapus] = useState<LabelMandiri | null>(null)
  const [proses, setProses] = useState(false)

  const label = data ? [...data.label].sort((a, b) => a.nama.localeCompare(b.nama, 'id')) : []
  const jumlah = (id: string) => data?.task.filter((t) => t.label_id === id).length ?? 0

  async function simpan(l: LabelMandiri) {
    if (!data) return
    const g = validasiNamaLabel(nama, data, l.id)
    if (g) return setGalat(g)
    setProses(true)
    try {
      await mutasi((v) => taskApi.ubahLabel(v, l.id, nama.trim()))
      setUbahId(null)
      setGalat(undefined)
    } catch (e) {
      setGalat(galatForm(e).kolom.nama ?? galatForm(e).umum)
    } finally {
      setProses(false)
    }
  }

  async function jalankanHapus() {
    if (!hapus) return
    setProses(true)
    try {
      await mutasi((v) => taskApi.hapusLabel(v, hapus.id))
      setHapus(null)
    } catch (e) {
      setGalat(galatForm(e).umum)
      setHapus(null)
    } finally {
      setProses(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Kelola label"
        description="Label untuk task mandiri. Label baru dibuat saat menambah task."
        glyph={{ icon: 'sell' }}
        kind="confirm"
        footer={<Button onClick={onClose}>Selesai</Button>}
      >
        {!boleh && alasan && <Alert tone="info">{alasan}</Alert>}
        {label.length === 0 ? (
          <EmptyState icon="sell" title="Belum ada label">
            Buat task mandiri untuk membuat label pertama.
          </EmptyState>
        ) : (
          <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-2">
            {label.map((l) => {
              const n = jumlah(l.id)
              const sedangUbah = ubahId === l.id
              return (
                <motion.li key={l.id} variants={riseChild} className="rounded-field bg-card px-4 py-3 tactile-convex-sm">
                  <AnimatePresence mode="wait" initial={false}>
                    {sedangUbah ? (
                      <motion.form
                        key="ubah"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                        onSubmit={(e) => {
                          e.preventDefault()
                          void simpan(l)
                        }}
                        className="flex flex-col gap-2"
                      >
                        <TextField label={`Nama baru untuk ${l.nama}`} maxLength={NAMA_LABEL_MAX} value={nama} onChange={(e) => setNama(e.target.value)} error={galat} autoFocus />
                        <div className="flex justify-end gap-2">
                          <Button variant="tactile" size="sm" onClick={() => setUbahId(null)}>
                            Batal
                          </Button>
                          <Button type="submit" size="sm" icon="check" busy={proses}>
                            Simpan
                          </Button>
                        </div>
                      </motion.form>
                    ) : (
                      <motion.div key="lihat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                        <Icon name="sell" size={18} className="text-ink-muted" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{l.nama}</p>
                          <p className="text-body-sm text-ink-muted">{n === 0 ? 'Tanpa task' : `${n} task`}</p>
                        </div>
                        <IconButton
                          icon="edit"
                          label={`Ganti nama ${l.nama}`}
                          size="sm"
                          disabled={!boleh}
                          onClick={() => {
                            setUbahId(l.id)
                            setNama(l.nama)
                            setGalat(undefined)
                          }}
                        />
                        {n > 0 ? (
                          <span className="inline-flex size-9 items-center justify-center text-ink-muted" title="Label yang punya task tidak bisa dihapus">
                            <Icon name="lock" size={18} />
                            <span className="sr-only">Label yang punya task tidak bisa dihapus</span>
                          </span>
                        ) : (
                          <IconButton icon="delete" label={`Hapus ${l.nama}`} size="sm" disabled={!boleh} onClick={() => setHapus(l)} className="text-danger" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </Dialog>
      <LightConfirmDialog
        open={!!hapus}
        onClose={() => setHapus(null)}
        onConfirm={() => void jalankanHapus()}
        title={`Hapus label “${hapus?.nama ?? ''}”?`}
        icon="delete"
        confirmLabel="Hapus label"
        busy={proses}
      >
        Label ini belum dipakai task mana pun dan akan dihapus permanen.
      </LightConfirmDialog>
    </>
  )
}
