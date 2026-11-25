import { motion, useAnimate, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { PengenalanHalaman } from '../../pengenalan/isi'
import { Button } from '../kit/Button'
import { DUR, EASE_IN, EASE_OUT } from '../motion'
import { PenandaLangkah, TombolMatikan } from './bagian'

const RUANG = 8 // jarak lubang dari tepi elemen
const CELAH = 16 // jarak kartu dari lubang dan dari tepi layar

type Kotak = { x: number; y: number; w: number; h: number; r: number }
type Posisi = { lubang: Kotak; kartu: { x: number; y: number } }

function sasaranDi(id: string) {
  return document.querySelector<HTMLElement>(`[data-pengenalan="${id}"]`)
}

function elemenLangkah(sasaran: string[]) {
  return sasaran.map(sasaranDi).filter((el): el is HTMLElement => el !== null)
}

function gabungan(els: HTMLElement[]): Kotak {
  const rs = els.map((el) => el.getBoundingClientRect())
  const kiri = Math.min(...rs.map((r) => r.left))
  const atas = Math.min(...rs.map((r) => r.top))
  const kanan = Math.max(...rs.map((r) => r.right))
  const bawah = Math.max(...rs.map((r) => r.bottom))
  // Pembungkus tanpa radius memakai radius kartu di dalamnya.
  const pertama = els[0] as HTMLElement
  const radius = parseFloat(getComputedStyle(pertama).borderRadius) || parseFloat(getComputedStyle(pertama.firstElementChild ?? pertama).borderRadius) || 16
  return { x: kiri, y: atas, w: kanan - kiri, h: bawah - atas, r: radius }
}

/** Lubang selebar elemen + RUANG, dipotong ke layar agar elemen yang sangat tinggi tetap terbaca batasnya. */
function lubangDari(k: Kotak): Kotak {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const x = Math.max(RUANG / 2, k.x - RUANG)
  const y = Math.max(RUANG / 2, k.y - RUANG)
  const w = Math.min(vw - RUANG / 2, k.x + k.w + RUANG) - x
  const h = Math.min(vh - RUANG / 2, k.y + k.h + RUANG) - y
  return { x, y, w, h, r: Math.min(k.r + RUANG, h / 2) }
}

/** Kartu di sisi yang paling lega: kanan, kiri, bawah, lalu atas. Tidak muat (mis. teks 200%): pojok kanan bawah. */
function letakKartu(l: Kotak, w: number, h: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const jepitY = (y: number) => Math.min(Math.max(CELAH, y), vh - h - CELAH)
  const jepitX = (x: number) => Math.min(Math.max(CELAH, x), vw - w - CELAH)
  if (l.x + l.w + CELAH + w <= vw - CELAH) return { x: l.x + l.w + CELAH, y: jepitY(l.y) }
  if (l.x - CELAH - w >= CELAH) return { x: l.x - CELAH - w, y: jepitY(l.y) }
  if (l.y + l.h + CELAH + h <= vh - CELAH) return { x: jepitX(l.x + l.w - w), y: l.y + l.h + CELAH }
  if (l.y - CELAH - h >= CELAH) return { x: jepitX(l.x + l.w - w), y: l.y - CELAH - h }
  return { x: vw - w - CELAH, y: vh - h - CELAH }
}

/** Gulir sampai elemen terlihat, lalu tunggu posisinya berhenti berubah (guliran halus selesai). */
async function tampakkan(els: HTMLElement[], halus: boolean) {
  const k = gabungan(els)
  const vh = window.innerHeight
  if (k.y >= CELAH * 4 && k.y + k.h <= vh - CELAH) return
  els[0]?.scrollIntoView({ block: k.h > vh * 0.7 ? 'start' : 'center', behavior: halus ? 'smooth' : 'auto' })
  let terakhir = Number.NaN
  let tenang = 0
  const mulai = performance.now()
  await new Promise<void>((selesai) => {
    const cek = () => {
      const y = els[0]?.getBoundingClientRect().top ?? 0
      tenang = y === terakhir ? tenang + 1 : 0
      terakhir = y
      if (tenang >= 3 || performance.now() - mulai > 1000) selesai()
      else requestAnimationFrame(cek)
    }
    requestAnimationFrame(cek)
  })
}

type Props = { isi: PengenalanHalaman; onSelesai: () => void; onMatikan: () => void }

/**
 * O-03 (laptop): sorotan bagian halaman satu per satu. <dialog> modal transparan menjaga fokus
 * dan membuat halaman inert; lubang dibentuk dari bayangan scrim di sekeliling elemen.
 */
export function Sorotan({ isi, onSelesai, onMatikan }: Props) {
  const [scope, animate] = useAnimate<HTMLDialogElement>()
  const reduce = useReducedMotion() ?? false
  const kartuRef = useRef<HTMLDivElement>(null)
  const lanjutRef = useRef<HTMLButtonElement>(null)
  const judulId = useId()
  const teksId = useId()
  // Langkah tanpa elemen di layar dilewati; daftarnya dikunci saat sorotan dibuka.
  const [langkah] = useState(() => isi.langkah.filter((l) => elemenLangkah(l.sasaran).length > 0))
  const [ke, setKe] = useState(0)
  const [posisi, setPosisi] = useState<Posisi | null>(null)
  const sekarang = langkah[ke]
  const terakhir = ke === langkah.length - 1

  useEffect(() => {
    const el = scope.current
    if (!el || el.open) return
    el.showModal()
    lanjutRef.current?.focus({ preventScroll: true })
  }, [scope])

  const ukur = useCallback(() => {
    if (!sekarang || !kartuRef.current) return
    const els = elemenLangkah(sekarang.sasaran)
    if (els.length === 0) return
    const lubang = lubangDari(gabungan(els))
    setPosisi({ lubang, kartu: letakKartu(lubang, kartuRef.current.offsetWidth, kartuRef.current.offsetHeight) })
  }, [sekarang])

  // Tiap langkah: gulir ke elemen, lalu ukur setelah teks kartu baru dirender.
  useLayoutEffect(() => {
    if (!sekarang) return
    let batal = false
    void tampakkan(elemenLangkah(sekarang.sasaran), !reduce).then(() => {
      if (!batal) ukur()
    })
    return () => {
      batal = true
    }
  }, [sekarang, ukur, reduce])

  // Guliran manual dan ubah ukuran jendela: ikuti elemen tanpa menggulir ulang.
  useEffect(() => {
    let bingkai = 0
    const jadwalkan = () => {
      cancelAnimationFrame(bingkai)
      bingkai = requestAnimationFrame(ukur)
    }
    window.addEventListener('resize', jadwalkan)
    window.addEventListener('scroll', jadwalkan, true)
    return () => {
      cancelAnimationFrame(bingkai)
      window.removeEventListener('resize', jadwalkan)
      window.removeEventListener('scroll', jadwalkan, true)
    }
  }, [ukur])

  useEffect(() => {
    if (!scope.current?.contains(document.activeElement)) lanjutRef.current?.focus({ preventScroll: true })
  }, [ke, scope])

  async function tutup(lalu: () => void) {
    const el = scope.current
    if (el && !reduce) await animate(el, { opacity: 0 }, { duration: 0.18, ease: EASE_IN })
    el?.close()
    lalu()
  }

  function pindah(n: number) {
    const tujuan = ke + n
    if (tujuan < 0) return
    if (tujuan >= langkah.length) {
      void tutup(onSelesai)
      return
    }
    setKe(tujuan)
  }

  // Tidak ada sasaran sama sekali: anggap selesai agar tidak tampil kosong.
  useEffect(() => {
    if (langkah.length === 0) onSelesai()
  }, [langkah.length, onSelesai])

  if (!sekarang) return null
  const gerak = reduce ? { duration: 0 } : { duration: DUR.slow, ease: EASE_OUT }

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
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent backdrop:backdrop-blur-none open:block"
    >
      {/* Klik di luar kartu sengaja tidak menutup; penutupnya Lewati, Esc, atau Selesai. */}
      {posisi && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0"
          style={{ boxShadow: '0 0 0 2px var(--sb-primary), 0 0 0 8px var(--sb-glow), 0 0 0 200vmax var(--sb-scrim)' }}
          initial={{ opacity: 0, x: posisi.lubang.x, y: posisi.lubang.y, width: posisi.lubang.w, height: posisi.lubang.h, borderRadius: posisi.lubang.r }}
          animate={{ opacity: 1, x: posisi.lubang.x, y: posisi.lubang.y, width: posisi.lubang.w, height: posisi.lubang.h, borderRadius: posisi.lubang.r }}
          transition={{ ...gerak, opacity: { duration: reduce ? 0 : DUR.base, ease: EASE_OUT } }}
        />
      )}
      <motion.div
        ref={kartuRef}
        className="absolute top-0 left-0 w-[25rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-tile bg-card text-ink shadow-overlay"
        initial={false}
        animate={posisi ? { opacity: 1, x: posisi.kartu.x, y: posisi.kartu.y } : { opacity: 0 }}
        transition={posisi ? gerak : { duration: 0 }}
      >
        <div className="flex items-center gap-2 pt-3 pr-2 pl-5">
          <p className="lbl flex-1">Pengenalan {isi.nama}</p>
          <Button variant="ghost" size="sm" onClick={() => void tutup(onSelesai)}>
            Lewati
          </Button>
        </div>
        <motion.div
          key={ke}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          className="px-5 pt-1 pb-4"
        >
          <h2 id={judulId} className="text-headline-sm">
            {sekarang.judul}
          </h2>
          <p id={teksId} className="mt-1 text-body-md text-ink-muted">
            {sekarang.teks}
          </p>
        </motion.div>
        <div className="flex flex-wrap items-center gap-2 bg-well pt-3 pr-4 pb-1 pl-5">
          <PenandaLangkah ke={ke} dari={langkah.length} className="mr-auto" />
          {ke > 0 && (
            <Button variant="tactile" size="sm" onClick={() => pindah(-1)}>
              Kembali
            </Button>
          )}
          <Button ref={lanjutRef} size="sm" onClick={() => pindah(1)}>
            {terakhir ? 'Selesai' : 'Lanjut'}
          </Button>
        </div>
        <div className="bg-well px-2 pb-2">
          <TombolMatikan onClick={() => void tutup(onMatikan)} />
        </div>
        <p className="sr-only" aria-live="polite">
          Langkah {ke + 1} dari {langkah.length}, {sekarang.judul}
        </p>
      </motion.div>
    </dialog>
  )
}
