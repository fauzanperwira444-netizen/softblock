import { cx } from '../cx'
import { Icon } from '../kit/Icon'

// Belum ada logo; design system menetapkan ikon dalam lingkaran putih ekstrusi di samping nama.
export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-card text-primary tactile-convex-sm',
        size === 'sm' ? 'size-9' : 'size-11',
      )}
    >
      <Icon name="view_kanban" size={size === 'sm' ? 18 : 20} />
    </span>
  )
}

export function BrandLockup({ subjudul }: { subjudul: string }) {
  return (
    <span className="flex items-center gap-3">
      <BrandMark />
      <span>
        <b className="block text-[1.125rem] leading-[1.375rem] font-bold tracking-[-0.01em]">Softblock</b>
        <small className="lbl block tracking-[0.06em]">{subjudul}</small>
      </span>
    </span>
  )
}
