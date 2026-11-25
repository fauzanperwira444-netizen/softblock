import { AnimatePresence, motion, useAnimate, useReducedMotion, type Variants } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { PENGENALAN_AWAL } from '../../pengenalan/isi'
import { Button } from '../kit/Button'
import { Icon } from '../kit/Icon'
import { DUR, EASE_IN, EASE_OUT } from '../motion'
import { Miniatur, PenandaLangkah, TombolMatikan } from './bagian'

// Kartu bergeser 24px searah tombol yang ditekan.
const geser: Variants = {
  masuk: (arah: number) => ({ opacity: 0, x: arah * 24 }),
  diam: { opacity: 1, x: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
  keluar: (arah: number) => ({ opacity: 0, x: arah * -24, transition: { duration: DUR.fast, ease: EASE_IN } }),
}

type Props = { nama: string; onSelesai: () => void; onMatikan: () => void }

/** O-02: dialog tengah berisi satu kartu ringkasan per menu. Lewati dan Selesai sama-sama menandai sudah dilihat. */
export function DialogAwal({ nama, onSelesai, onMatikan }: Props) {
  const [scope, animate] = useAnimate<HTMLDialogElement>()
  const reduce = useReducedMotion()
  const [ke, setKe] = useState(0)
  const [arah, setArah] = useState(1)
  const lanjutRef = useRef<HTMLButtonElement>(null)
  const judulId = useId()
  const teksId = useId()
  const kartu = PENGENALAN_AWAL[ke]
  const terakhir = ke === PENGENALAN_AWAL.length - 1

  useEffect(() => {
    const el = scope.current
    if (!el) return
    // StrictMode memasang efek dua kali dan menghentikan animasi pertama; animasi selalu dijalankan ulang.
    if (!el.open) el.showModal()
    lanjutRef.current?.focus()
    if (!reduce) void animate(el, { opacity: [0, 1], y: [16, 0], scale: [0.97, 1] }, { duration: DUR.slow, ease: EASE_OUT })
  }, [animate, reduce, scope])

  // Tombol Kembali hilang di langkah pertama; fokus jangan sampai jatuh ke body.
  useEffect(() => {
    if (!scope.current?.contains(document.activeElement)) lanjutRef.current?.focus()
  }, [ke, scope])

  async function tutup(lalu: () => void) {
    const el = scope.current
    if (el && !reduce) await animate(el, { opacity: 0, y: 10, scale: 0.98 }, { duration: 0.18, ease: EASE_IN })
    el?.close()
    lalu()
  }

  function pindah(n: number) {
    const tujuan = ke + n
    if (tujuan < 0) return
    if (tujuan >= PENGENALAN_AWAL.length) {
      void tutup(onSelesai)
      return
    }
    setArah(n)
    setKe(tujuan)
  }

  if (!kartu) return null

  return (
    <dialog
      ref={scope}
      data-lapisan-pengenalan=""
      aria-labelledby={judulId}
      aria-describedby={teksId}
      onCancel={(e) => {
        e.preventDefault()
        void tutup(onSelesai)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') pindah(1)
        if (e.key === 'ArrowLeft') pindah(-1)
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-[560px] flex-col overflow-hidden rounded-card bg-card p-0 text-ink shadow-overlay open:flex"
    >
      <header className="flex items-center gap-3 pt-4 pr-4 pl-6">
        <p className="lbl flex-1">Selamat datang{nama ? `, ${nama}` : ''}</p>
        <Button variant="ghost" size="sm" onClick={() => void tutup(onSelesai)}>
          Lewati
        </Button>
      </header>

      <div className="overflow-x-hidden overflow-y-auto px-6 pt-3 pb-6">
        <AnimatePresence mode="wait" initial={false} custom={arah}>
          <motion.div key={ke} custom={arah} variants={geser} initial="masuk" animate="diam" exit="keluar" className="flex flex-col gap-3">
            <Miniatur jenis={kartu.miniatur} />
            <span className="mt-2 flex items-center gap-2 text-body-sm font-semibold text-on-mist">
              <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-mist">
                <Icon name={kartu.icon} size={18} />
              </span>
              Menu {kartu.menu}
            </span>
            <h2 id={judulId} className="text-[1.375rem] leading-[1.875rem] font-semibold tracking-[-0.01em]">
              {kartu.judul}
            </h2>
            <p id={teksId} className="text-body-md text-ink-muted">
              {kartu.teks}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flex flex-wrap items-center gap-2 bg-well px-6 pt-4 pb-1">
        <PenandaLangkah ke={ke} dari={PENGENALAN_AWAL.length} className="mr-auto" />
        {ke > 0 && (
          <Button variant="tactile" onClick={() => pindah(-1)}>
            Kembali
          </Button>
        )}
        <Button ref={lanjutRef} onClick={() => pindah(1)}>
          {terakhir ? 'Selesai' : 'Lanjut'}
        </Button>
      </footer>
      <div className="flex justify-center bg-well px-4 pb-3">
        <TombolMatikan onClick={() => void tutup(onMatikan)} />
      </div>
      <p className="sr-only" aria-live="polite">
        Langkah {ke + 1} dari {PENGENALAN_AWAL.length}, menu {kartu.menu}
      </p>
    </dialog>
  )
}
