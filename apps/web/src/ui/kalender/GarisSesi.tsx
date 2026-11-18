import type { CSSProperties, ReactNode } from 'react'
import type { PolaGaris } from '../../domain/jamKosong'
import { cx } from '../cx'

/**
 * Gaya garis projek: warna ditambah pola (penuh, putus-putus, titik-titik, arsir) agar warna
 * bukan satu-satunya pembeda (G-03, N-16). Teks tetap berwarna tinta di atas latar tipis.
 */
export function gayaGaris(warna: string, pola: PolaGaris): CSSProperties {
  const tipis = `color-mix(in srgb, ${warna} 16%, var(--sb-card))`
  switch (pola) {
    case 'penuh':
      return { backgroundColor: tipis, boxShadow: `inset 0 -3px 0 ${warna}` }
    case 'putus':
      return { backgroundColor: tipis, border: `1.5px dashed ${warna}` }
    case 'titik':
      return { backgroundColor: tipis, border: `2px dotted ${warna}` }
    case 'arsir':
      return {
        backgroundImage: `repeating-linear-gradient(135deg, color-mix(in srgb, ${warna} 30%, var(--sb-card)) 0 4px, ${tipis} 4px 9px)`,
      }
  }
}

type Props = { warna: string; pola: PolaGaris; children?: ReactNode; className?: string; ringkas?: boolean }

export function GarisSesi({ warna, pola, children, className, ringkas = false }: Props) {
  return (
    <span
      className={cx('block truncate rounded-full text-ink', ringkas ? 'h-2' : 'px-2.5 py-0.5 text-body-sm font-medium', className)}
      style={gayaGaris(warna, pola)}
    >
      {children}
    </span>
  )
}

/** Contoh pola untuk legenda. */
export function ContohPola({ warna, pola }: { warna: string; pola: PolaGaris }) {
  return <i aria-hidden="true" className="inline-block size-3.5 shrink-0 rounded" style={gayaGaris(warna, pola)} />
}

export const NAMA_POLA: Record<PolaGaris, string> = { penuh: 'penuh', putus: 'putus-putus', titik: 'titik-titik', arsir: 'arsir' }
