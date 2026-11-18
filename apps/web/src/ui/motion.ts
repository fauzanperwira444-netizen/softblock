import type { Transition, Variants } from 'motion/react'

// Token gerak "Tactile calm" dari design system Softblock (durasi dalam detik).
export const DUR = { instant: 0.09, fast: 0.14, base: 0.22, slow: 0.32, page: 0.42 } as const
export const STAGGER = 0.045

export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN = [0.55, 0, 1, 0.45] as const
export const EASE_PRESS = [0.4, 0, 0.2, 1] as const

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 520, damping: 26, mass: 0.7 }
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 260, damping: 28 }

/** Tekan dan hover tombol taktil: naik 1px saat hover, scale 0.97 saat ditekan. */
export const press = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97, y: 0 },
  transition: { y: { duration: DUR.fast, ease: EASE_PRESS }, scale: SPRING_SNAPPY },
} as const

/** Wadah masuk bertahap; maksimal 6 anak yang diberi jeda (sisanya ikut jeda ke-6). */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.02 } },
}

export const riseChild: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE_OUT } },
}

/** Kartu modal dan kartu auth: naik 16px + scale 0.97 → 1; keluar lebih cepat. */
export const modalCard: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.slow, ease: EASE_OUT } },
  exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.18, ease: EASE_IN } },
}

/** Pesan galat dan banner: turun 6px saat muncul. */
export const dropIn: Variants = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE_IN } },
}

/** Getar sekali saat field menjadi tidak valid. */
export const shake = { x: [0, -4, 4, -2, 2, 0], transition: { duration: 0.36, ease: EASE_PRESS } }
