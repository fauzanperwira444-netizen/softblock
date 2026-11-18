import { motion } from 'motion/react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../cx'
import { dropIn, riseChild } from '../motion'
import { Icon } from './Icon'
import type { IconName } from './icons'

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={cx('rounded-card bg-card p-6 tactile-convex', className)} {...rest}>
      {children}
    </section>
  )
}

/** Judul kartu dengan ikon hijau di kiri, seperti seksi halaman Akun prototipe. */
export function CardTitle({ icon, id, children, end }: { icon: IconName; id?: string; children: ReactNode; end?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/7 pb-4">
      <h2 id={id} className="flex items-center gap-2.5 text-headline-md">
        <Icon name={icon} className="text-primary" />
        {children}
      </h2>
      {end}
    </div>
  )
}

export type BadgeKind ='telat' | 'tinta' | 'konteks' | 'netral-garis' | 'redup' | 'info' | 'netral'

const badgeStyles: Record<BadgeKind, string> = {
  telat: 'bg-danger text-on-danger',
  tinta: 'bg-ink text-canvas',
  konteks: 'text-primary shadow-[inset_0_0_0_1px_var(--sb-primary)]',
  'netral-garis': 'text-ink-muted shadow-[inset_0_0_0_1px_var(--sb-line-strong)]',
  redup: 'bg-high text-ink-muted',
  info: 'bg-mint text-on-mint',
  netral: 'bg-raised text-ink-muted',
}

type BadgeProps = { kind?: BadgeKind; icon?: IconName; children: ReactNode }

/**
 * Status dengan tiga bobot: solid untuk yang butuh tindakan, garis untuk konteks, redup untuk yang selesai.
 * Selalu berteks agar warna bukan satu-satunya makna (N-16).
 */
export function Badge({ kind = 'redup', icon, children }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] leading-[0.875rem] font-semibold tracking-[0.04em] whitespace-nowrap',
        badgeStyles[kind],
      )}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  )
}

type ChipProps = { kind: 'projek' | 'label'; color?: string; children: ReactNode }

export function Chip({ kind, color, children }: ChipProps) {
  if (kind === 'label') {
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-raised px-3 py-1 text-body-sm text-ink-muted underline decoration-line-strong decoration-dotted underline-offset-4">
        <Icon name="sell" size={14} />
        <span className="truncate">{children}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-well px-3 py-1 text-body-sm font-medium text-ink tactile-inset">
      <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} />
      <span className="truncate">{children}</span>
    </span>
  )
}

type FilterChipProps = { pressed: boolean; onToggle: () => void; children: ReactNode }

export function FilterChip({ pressed, onToggle, children }: FilterChipProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      whileTap={{ scale: 0.97 }}
      className={cx(
        'inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-body-md font-semibold transition-colors duration-150',
        pressed ? 'bg-primary text-on-primary' : 'bg-well text-ink-muted tactile-inset hover:text-ink',
      )}
    >
      {pressed && <Icon name="check" size={16} />}
      {children}
    </motion.button>
  )
}

type EmptyStateProps = { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }

export function EmptyState({ icon = 'inbox', title, children, action }: EmptyStateProps) {
  return (
    <motion.div
      variants={riseChild}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center gap-4 rounded-card bg-card p-8 text-center tactile-convex"
    >
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-well text-primary tactile-inset" aria-hidden="true">
        <Icon name={icon} size={32} />
      </span>
      <div>
        <p className="text-headline-md">{title}</p>
        {children && <div className="mx-auto mt-1 max-w-md text-body-md text-ink-muted">{children}</div>}
      </div>
      {action}
    </motion.div>
  )
}

type NoteTone = 'info' | 'error' | 'success'

const noteStyles: Record<NoteTone, { box: string; icon: IconName; iconColor: string }> = {
  info: { box: 'bg-well text-ink-muted tactile-inset', icon: 'info', iconColor: 'text-primary' },
  error: { box: 'bg-danger-soft text-on-danger-soft', icon: 'error', iconColor: 'text-danger' },
  success: { box: 'bg-mist text-on-mist', icon: 'check_circle', iconColor: 'text-on-mist' },
}

type AlertProps = { tone?: NoteTone; icon?: IconName; title?: string; children?: ReactNode; action?: ReactNode }

/** Catatan inline (kelas `note` di prototipe); galat memakai role alert. */
export function Alert({ tone = 'info', icon, title, children, action }: AlertProps) {
  const style = noteStyles[tone]
  return (
    <motion.div
      variants={dropIn}
      initial="hidden"
      animate="show"
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx('flex items-start gap-2.5 rounded-field px-4 py-3 text-[0.8125rem] leading-[1.1875rem]', style.box)}
    >
      <Icon name={icon ?? style.icon} size={18} className={cx('mt-px', style.iconColor)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </motion.div>
  )
}

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-8 text-ink-muted">
      <Icon name="sync" className="animate-spin text-primary" />
      <span>{label}</span>
    </div>
  )
}
