import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from '../cx'
import { press } from '../motion'
import { Icon } from './Icon'
import type { IconName } from './icons'

type Variant = 'primary' | 'tactile' | 'sage' | 'outline' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-cta text-on-cta shadow-cta hover:bg-cta-hover',
  tactile: 'bg-card text-ink tactile-button hover:bg-raised active:tactile-pressed',
  sage: 'bg-mist text-on-mist hover:bg-avatar hover:text-on-avatar',
  outline: 'bg-card text-primary shadow-[inset_0_0_0_2px_var(--sb-primary),var(--sb-shadow-button)]',
  danger: 'bg-danger text-on-danger shadow-cta hover:brightness-110',
  ghost: 'bg-transparent text-ink-muted hover:bg-raised hover:text-ink',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-11 px-4 text-body-sm font-semibold gap-1',
  md: 'min-h-11 px-6 text-body-md font-semibold gap-2',
  lg: 'min-h-13 px-6 text-body-lg font-semibold gap-2',
}

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconEnd?: IconName
  busy?: boolean | undefined
  block?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  busy = false,
  block = false,
  className,
  disabled,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const off = disabled || busy
  return (
    <motion.button
      type={type}
      disabled={off}
      aria-busy={busy || undefined}
      {...(off ? {} : press)}
      className={cx(
        'inline-flex items-center justify-center rounded-full transition-[background-color,color,box-shadow,filter] duration-150 ease-press',
        'disabled:opacity-45 disabled:shadow-none',
        sizes[size],
        variants[variant],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {busy ? <Icon name="sync" size={18} className="animate-spin" /> : icon && <Icon name={icon} size={18} />}
      {children}
      {iconEnd && !busy && <Icon name={iconEnd} size={18} />}
    </motion.button>
  )
}

type LinkButtonProps = {
  to: string
  variant?: Variant
  size?: Size
  icon?: IconName
  iconEnd?: IconName
  block?: boolean
  children: ReactNode
}

/** Navigasi yang tampil seperti tombol tetap memakai <a href> (R-39). */
export function LinkButton({ to, variant = 'primary', size = 'md', icon, iconEnd, block = false, children }: LinkButtonProps) {
  return (
    <MotionLink
      to={to}
      {...press}
      className={cx(
        'inline-flex items-center justify-center rounded-full transition-[background-color,color,box-shadow] duration-150 ease-press',
        sizes[size],
        variants[variant],
        block && 'w-full',
      )}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={18} />}
    </MotionLink>
  )
}

const MotionLink = motion.create(Link)

type IconButtonProps =Omit<HTMLMotionProps<'button'>, 'children'> & {
  icon: IconName
  label: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'tactile' | 'plain'
}

const iconSizes = { sm: 'size-9', md: 'size-11', lg: 'size-13' } as const

export function IconButton({ icon, label, size = 'md', tone = 'tactile', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      {...(rest.disabled ? {} : press)}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full text-ink transition-[color,background-color,box-shadow] duration-150 hover:text-primary disabled:opacity-45',
        iconSizes[size],
        tone === 'tactile' ? 'bg-card tactile-button active:tactile-pressed' : 'hover:bg-raised',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 18 : 20} />
    </motion.button>
  )
}

/** Lingkaran ikon dekoratif di kepala kartu auth dan dialog. */
export function GlyphCircle({ icon, tone = 'pressed' }: { icon: IconName; tone?: 'pressed' | 'sage' | 'danger' }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex size-13 shrink-0 items-center justify-center rounded-full',
        tone === 'pressed' && 'bg-card text-primary tactile-pressed',
        tone === 'sage' && 'bg-mist text-on-mist',
        tone === 'danger' && 'bg-danger-soft text-on-danger-soft',
      )}
    >
      <Icon name={icon} size={24} />
    </span>
  )
}
