import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button, GlyphCircle } from '../../kit/Button'
import type { IconName } from '../../kit/icons'
import { modalCard } from '../../motion'
import { BrandLockup } from '../../shell/Brand'

type Props = {
  subjudul?: string
  kanan?: ReactNode
  /** Kunci langkah; kartu berganti dengan animasi keluar-masuk saat kunci berubah. */
  langkah?: string
  children: ReactNode
}

export function AuthLayout({ subjudul = 'Perencana kerja', kanan, langkah = 'utama', children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-12 md:py-6">
        <Link to="/masuk" className="rounded-full">
          <BrandLockup subjudul={subjudul} />
        </Link>
        {kanan}
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-6">
        {/* Satu glow sage per layar, dekoratif (design system: Bentuk, ruang, dan kedalaman). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-64 left-1/2 size-160 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--sb-glow)_0%,transparent_70%)]"
        />
        <AnimatePresence mode="wait" initial={true}>
          <motion.section
            key={langkah}
            variants={modalCard}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative flex w-full max-w-[480px] flex-col gap-4 rounded-card bg-card p-6 tactile-convex sm:p-10"
          >
            {children}
          </motion.section>
        </AnimatePresence>
      </main>
      <footer className="px-6 py-6 text-center text-[0.8125rem] text-ink-muted">© 2026 Softblock</footer>
    </div>
  )
}

type KepalaProps = { icon?: IconName; tone?: 'pressed' | 'sage' | 'danger'; judul: string; sub?: ReactNode; tengah?: boolean }

export function KepalaKartu({ icon, tone = 'pressed', judul, sub, tengah = false }: KepalaProps) {
  return (
    <div className={tengah ? 'flex flex-col items-center gap-3 text-center' : 'flex flex-col gap-3'}>
      {icon && <GlyphCircle icon={icon} tone={tone} />}
      <div>
        <h1 className="text-auth">{judul}</h1>
        {sub && <p className="mt-1 text-[0.9375rem] leading-[1.375rem] text-ink-muted">{sub}</p>}
      </div>
    </div>
  )
}

export function Pemisah() {
  return (
    <div className="flex items-center gap-3 text-[0.6875rem] leading-[0.875rem] font-semibold tracking-[0.08em] text-ink-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-ink/10" />
      ATAU
      <span className="h-px flex-1 bg-ink/10" />
    </div>
  )
}

export function Garis() {
  return <hr className="h-px border-0 bg-ink/7" />
}

export const tautan = 'font-semibold text-primary underline-offset-4 hover:underline'

export function TombolGoogle({ label, onClick, busy }: { label: string; onClick: () => void; busy: boolean }) {
  return (
    <Button variant="tactile" size="lg" block onClick={onClick} busy={busy}>
      {!busy && <GoogleMark />}
      {label}
    </Button>
  )
}

// Logo "G" Google; dipakai sesuai pedoman tombol masuk Google.
export function GoogleMark() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  )
}
