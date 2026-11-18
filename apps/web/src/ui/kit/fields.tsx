import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cx } from '../cx'
import { dropIn, shake } from '../motion'
import { Icon } from './Icon'
import type { IconName } from './icons'

const control =
  'w-full bg-well text-body-md text-ink tactile-inset outline-none transition-shadow duration-150 ease-out ' +
  'placeholder:text-ink-muted/80 read-only:text-ink-muted disabled:opacity-60 ' +
  'focus-visible:shadow-[var(--sb-shadow-inset),0_0_0_2px_var(--sb-primary)] ' +
  'aria-[invalid=true]:shadow-[var(--sb-shadow-inset),inset_0_0_0_2px_var(--sb-danger)]'

/** Getar sekali tiap kali galat baru muncul pada field. */
function useShake(error: string | undefined) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const reduce = useReducedMotion()
  const sebelumnya = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (error && error !== sebelumnya.current && !reduce && scope.current) {
      void animate(scope.current, { x: shake.x }, shake.transition)
    }
    sebelumnya.current = error
  }, [error, reduce, animate, scope])
  return scope
}

type FieldShellProps = {
  id: string
  label: string
  hint?: string | undefined
  error?: string | undefined
  required?: boolean | undefined
  counter?: string | undefined
  headRight?: ReactNode
  children: ReactNode
}

function FieldShell({ id, label, hint, error, required, counter, headRight, children }: FieldShellProps) {
  const scope = useShake(error)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <label htmlFor={id} className="lbl">
          {label}
          {required && (
            <span aria-hidden="true" className="text-danger">
              {' '}*
            </span>
          )}
        </label>
        {headRight}
        {counter && !headRight && (
          <span className="font-mono text-body-sm text-ink-muted" aria-hidden="true">
            {counter}
          </span>
        )}
      </div>
      <div ref={scope}>{children}</div>
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="galat"
            id={`${id}-galat`}
            variants={dropIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex items-start gap-1.5 text-[0.8125rem] leading-[1.125rem] font-medium text-danger"
          >
            <Icon name="error" size={16} className="mt-px" />
            {error}
          </motion.p>
        ) : (
          hint && (
            <p key="petunjuk" id={`${id}-petunjuk`} className="text-body-sm text-ink-muted">
              {hint}
            </p>
          )
        )}
      </AnimatePresence>
    </div>
  )
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-galat`
  if (hint) return `${id}-petunjuk`
  return undefined
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id?: string
  label: string
  icon?: IconName
  hint?: string
  error?: string | undefined
  headRight?: ReactNode
  trailing?: ReactNode
}

export function TextField({
  id: idLuar,
  label,
  icon,
  hint,
  error,
  headRight,
  required,
  maxLength,
  value,
  trailing,
  className,
  ...rest
}: TextFieldProps) {
  const idOtomatis = useId()
  const id = idLuar ?? idOtomatis
  const counter = maxLength !== undefined && typeof value === 'string' ? `${value.length}/${maxLength}` : undefined
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} counter={counter} headRight={headRight}>
      <div className="relative">
        {icon && (
          <Icon name={icon} size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted" />
        )}
        <input
          id={id}
          required={required}
          maxLength={maxLength}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cx(control, 'min-h-12 rounded-full px-4', icon && 'pl-11', trailing ? 'pr-32' : undefined, className)}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
    </FieldShell>
  )
}

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing' | 'icon'> & { meter?: boolean }

export function PasswordField({ meter = false, ...props }: PasswordFieldProps) {
  const [shown, setShown] = useState(false)
  const value = typeof props.value === 'string' ? props.value : ''
  return (
    <div className="flex flex-col gap-2">
      <TextField
        {...props}
        icon="lock"
        type={shown ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-[0.8125rem] font-semibold text-ink-muted transition-colors hover:bg-card hover:text-ink"
          >
            <Icon name={shown ? 'visibility_off' : 'visibility'} size={18} />
            {shown ? 'Sembunyikan' : 'Tampilkan'}
            <span className="sr-only"> password</span>
          </button>
        }
      />
      {meter && value.length > 0 && <KekuatanPassword value={value} />}
    </div>
  )
}

const LABEL_KEKUATAN = ['lemah', 'lemah', 'menengah', 'kuat', 'sangat kuat'] as const

function skorPassword(v: string): number {
  let skor = 0
  if (v.length >= 8) skor++
  if (v.length >= 12) skor++
  if (/[a-z]/.test(v) && /[A-Z0-9]/.test(v)) skor++
  if (/[^A-Za-z0-9]/.test(v)) skor++
  return skor
}

/** Perkiraan kasar kekuatan password; bukan aturan validasi (aturannya hanya 8–128 karakter). */
function KekuatanPassword({ value }: { value: string }) {
  const skor = skorPassword(value)
  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <motion.i
            key={n}
            className={cx('h-1.5 origin-left rounded-full', n <= skor ? (n <= 2 ? 'bg-primary' : 'bg-sage') : 'bg-high')}
            initial={false}
            animate={{ scaleX: n <= skor ? 1 : 0.92 }}
          />
        ))}
      </div>
      <p className="text-right text-body-sm font-semibold text-primary">Kekuatan: {LABEL_KEKUATAN[skor]}</p>
    </div>
  )
}

type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string
  hint?: string
  error?: string | undefined
}

export function TextareaField({ label, hint, error, required, maxLength, value, className, ...rest }: TextareaFieldProps) {
  const id = useId()
  const counter = maxLength !== undefined && typeof value === 'string' ? `${value.length}/${maxLength}` : undefined
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} counter={counter}>
      <textarea
        id={id}
        required={required}
        maxLength={maxLength}
        value={value}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cx(control, 'min-h-28 resize-y rounded-field p-4', className)}
        {...rest}
      />
    </FieldShell>
  )
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string
  icon?: IconName
  hint?: string
  error?: string | undefined
  children: ReactNode
}

export function SelectField({ label, icon, hint, error, required, className, children, ...rest }: SelectFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        {icon && (
          <Icon name={icon} size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted" />
        )}
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cx(control, 'min-h-12 appearance-none rounded-full pr-11 pl-4', icon && 'pl-11', className)}
          {...rest}
        >
          {children}
        </select>
        <Icon
          name="chevron_right"
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rotate-90 text-ink-muted"
        />
      </div>
    </FieldShell>
  )
}
