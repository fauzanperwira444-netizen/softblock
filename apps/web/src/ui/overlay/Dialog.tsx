import { useAnimate, useReducedMotion, type DOMKeyframesDefinition, type Transition } from 'motion/react'
import { useEffect, useId, type ReactNode } from 'react'
import { cx } from '../cx'
import { DUR, EASE_IN, EASE_OUT, SPRING_SOFT } from '../motion'
import { GlyphCircle, IconButton } from '../kit/Button'
import type { IconName } from '../kit/icons'

/*
  <dialog> native dengan showModal(): fokus terkurung, latar inert, Esc menutup lapisan teratas (J-06).
  Gerak masuk dan keluar dijalankan motion pada elemen dialog sebelum close().
*/
type Kind = 'form' | 'confirm' | 'panel'

const kindStyles: Record<Kind, string> = {
  // Formulir: sheet dari bawah di HP, dialog tengah di laptop.
  form: 'mt-auto mb-0 w-full max-w-none rounded-t-card md:m-auto md:max-w-xl md:rounded-card max-h-[92dvh]',
  confirm: 'm-auto w-[calc(100%-2rem)] max-w-[460px] rounded-card max-h-[90dvh]',
  // Panel: layar penuh di HP, panel samping kanan di laptop.
  panel: 'm-0 h-dvh max-h-none w-full max-w-none md:ml-auto md:w-[30rem] md:rounded-l-card',
}

type Motion = { from: DOMKeyframesDefinition; to: DOMKeyframesDefinition; out: DOMKeyframesDefinition; enter: Transition }

function gerak(kind: Kind): Motion {
  const lebar = window.matchMedia('(min-width: 768px)').matches
  if (kind === 'panel') {
    return lebar
      ? { from: { x: '100%' }, to: { x: '0%' }, out: { x: '100%' }, enter: SPRING_SOFT }
      : { from: { y: 24, opacity: 0 }, to: { y: 0, opacity: 1 }, out: { y: 24, opacity: 0 }, enter: { duration: DUR.slow, ease: EASE_OUT } }
  }
  if (kind === 'form' && !lebar) {
    return { from: { y: '100%' }, to: { y: '0%' }, out: { y: '100%' }, enter: SPRING_SOFT }
  }
  return {
    from: { opacity: 0, y: 16, scale: 0.97 },
    to: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: 10, scale: 0.98 },
    enter: { duration: DUR.slow, ease: EASE_OUT },
  }
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  glyph?: { icon: IconName; tone?: 'sage' | 'danger' }
  kind?: Kind
  /** Dialog login ulang tidak punya tombol tutup (AK-09). */
  closable?: boolean
  footer?: ReactNode
  children?: ReactNode
}

export function Dialog({ open, onClose, title, description, glyph, kind = 'form', closable = true, footer, children }: Props) {
  const [scope, animate] = useAnimate<HTMLDialogElement>()
  const reduce = useReducedMotion()
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const el = scope.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      // React tidak menulis atribut autofocus ke DOM, jadi fokus awal diatur lewat data-autofocus.
      el.querySelector<HTMLElement>('[data-autofocus]')?.focus()
      if (!reduce) {
        const g = gerak(kind)
        void animate(el, { ...g.from }, { duration: 0 }).then(() => animate(el, { ...g.to }, g.enter))
      }
    }
    if (!open && el.open) {
      if (reduce) {
        el.close()
        return
      }
      void animate(el, { ...gerak(kind).out }, { duration: 0.18, ease: EASE_IN }).then(() => el.close())
    }
  }, [open, kind, reduce, animate, scope])

  return (
    <dialog
      ref={scope}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        if (closable) onClose()
      }}
      className={cx('flex-col overflow-hidden bg-card p-0 text-ink shadow-overlay open:flex', kindStyles[kind])}
    >
      {kind === 'form' && <span aria-hidden="true" className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-high md:hidden" />}
      <header className="flex items-start gap-4 border-b border-ink/6 px-6 pt-6 pb-4">
        {glyph && <GlyphCircle icon={glyph.icon} tone={glyph.tone ?? 'sage'} />}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 id={titleId} className="text-[1.375rem] leading-[1.875rem] font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          {description && (
            <p id={descId} className="text-body-md text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {closable && <IconButton icon="close" label="Tutup" size="sm" onClick={onClose} />}
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">{children}</div>
      {footer && (
        <footer className="flex flex-col-reverse gap-2 bg-well px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {footer}
        </footer>
      )}
    </dialog>
  )
}
