import { motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useAuth } from '../../app/auth'
import { cx } from '../cx'
import { Icon } from '../kit/Icon'
import { SPRING_SOFT } from '../motion'
import { BrandMark } from './Brand'
import { NAV_UTAMA } from './nav'
import { GerbangData } from './GerbangData'
import { StatusBar } from './StatusBar'
import { SyncPill } from './SyncPill'

function inisial(nama: string) {
  return nama.trim().charAt(0).toUpperCase() || '?'
}

export function Avatar({ nama, className }: { nama: string; className?: string | undefined }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-avatar text-body-md font-semibold text-on-avatar',
        'shadow-[0_0_0_2px_var(--sb-card),var(--sb-shadow-convex-sm)]',
        className,
      )}
    >
      {inisial(nama)}
    </span>
  )
}

/** Label rail yang muncul saat hover atau fokus keyboard (tooltip inverse-surface). */
function Tooltip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'pointer-events-none absolute top-1/2 left-[calc(100%+16px)] z-40 -translate-x-1.5 -translate-y-1/2 rounded-sm bg-inverse px-3 py-1.5',
        'text-body-sm font-semibold whitespace-nowrap text-on-inverse opacity-0 shadow-[0_8px_20px_rgb(25_28_29/0.18)]',
        'transition-[opacity,translate] duration-150 ease-out group-hover:translate-x-0 group-hover:opacity-100',
        'group-focus-visible:translate-x-0 group-focus-visible:opacity-100',
      )}
    >
      {children}
    </span>
  )
}

function NavRail() {
  const { akun } = useAuth()
  return (
    <aside className="sticky top-4 z-30 m-4 mr-0 hidden h-[calc(100dvh-2rem)] min-h-[560px] w-[72px] shrink-0 flex-col items-center gap-3.5 self-start rounded-full bg-well py-3.5 tactile-convex md:flex">
      <Link to="/" aria-label="Softblock, ke Dashboard" className="group relative rounded-full">
        <BrandMark />
        <Tooltip>Softblock</Tooltip>
      </Link>
      <nav aria-label="Navigasi utama" className="mt-2 flex-1">
        <ul className="flex flex-col items-center gap-2">
          {NAV_UTAMA.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                aria-label={item.label}
                className={({ isActive }) =>
                  cx(
                    'group relative flex size-12 items-center justify-center rounded-full transition-[color,background-color,box-shadow] duration-150',
                    isActive ? 'text-on-cta' : 'text-ink-muted hover:bg-card hover:text-ink hover:tactile-button',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="rail-aktif"
                        transition={SPRING_SOFT}
                        className="absolute inset-0 rounded-full bg-cta shadow-cta"
                        aria-hidden="true"
                      />
                    )}
                    <Icon name={isActive ? item.iconAktif : item.icon} size={22} className="relative" />
                    <Tooltip>{item.label}</Tooltip>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {akun && (
        <NavLink to="/akun" aria-label={`Akun ${akun.nama_tampil}`} className="group relative rounded-full">
          {({ isActive }) => (
            <>
              <Avatar nama={akun.nama_tampil} className={isActive ? 'shadow-[0_0_0_2px_var(--sb-primary)]' : undefined} />
              <Tooltip>
                {akun.nama_tampil} · {akun.email}
              </Tooltip>
            </>
          )}
        </NavLink>
      )}
    </aside>
  )
}

function TopBarHp() {
  const { akun } = useAuth()
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-canvas/88 px-4 py-2 shadow-header backdrop-blur-md md:hidden">
      <Link to="/" className="flex min-h-11 items-center gap-2.5">
        <BrandMark size="sm" />
        <span className="text-headline-sm font-bold tracking-[-0.01em]">Softblock</span>
      </Link>
      {akun && (
        <Link to="/akun" aria-label={`Akun ${akun.nama_tampil}`} className="rounded-full">
          <Avatar nama={akun.nama_tampil} />
        </Link>
      )}
    </header>
  )
}

function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-20 bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgb(30_35_34/0.05)] md:hidden"
    >
      <ul className="grid grid-cols-5 gap-1">
        {NAV_UTAMA.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-field text-[0.6875rem] leading-[0.875rem] font-semibold tracking-[0.02em]',
                  isActive ? 'text-ink' : 'text-ink-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative inline-flex h-7 w-14 items-center justify-center">
                    {isActive && (
                      <motion.span
                        layoutId="bawah-aktif"
                        transition={SPRING_SOFT}
                        className="absolute inset-0 rounded-full bg-mint tactile-pill"
                        aria-hidden="true"
                      />
                    )}
                    <Icon name={isActive ? item.iconAktif : item.icon} className={cx('relative', isActive && 'text-on-mint')} />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function AppShell() {
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const pertama = useRef(true)

  // J-07: setelah pindah halaman, fokus pindah ke area konten utama.
  useEffect(() => {
    if (pertama.current) {
      pertama.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="flex min-h-dvh">
      <a
        href="#konten"
        className="sr-only z-50 rounded-full bg-cta px-4 py-2 text-on-cta focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Lewati ke konten
      </a>
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBarHp />
        <StatusBar />
        <main
          id="konten"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-6 pb-28 outline-none md:px-8 md:pt-8 md:pb-12"
        >
          <div className="mb-2 hidden justify-end md:flex">
            <SyncPill />
          </div>
          {/* Akun dibaca dari API, bukan snapshot, jadi tetap tersedia tanpa data lokal. */}
          {pathname.startsWith('/akun') ? (
            <Outlet />
          ) : (
            <GerbangData>
              <Outlet />
            </GerbangData>
          )}
        </main>
      </div>
      <BottomNav />
      <ScrollRestoration />
    </div>
  )
}
