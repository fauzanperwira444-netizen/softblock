import { motion } from 'motion/react'
import { useId, useRef, type KeyboardEvent } from 'react'
import { cx } from '../cx'
import { SPRING_SNAPPY, SPRING_SOFT, DUR, EASE_OUT } from '../motion'
import { Icon } from './Icon'

type Option<T extends string> = { value: T; label: string }

type SegmentedProps<T extends string> = {
  label: string
  options: ReadonlyArray<Option<T>>
  value: T
  onChange: (value: T) => void
}

/** Grup radio dengan roving tabindex; indikator taktil meluncur ke pilihan aktif. */
export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const labelId = useId()
  const indikatorId = useId()

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (step === 0) return
    e.preventDefault()
    const next = (index + step + options.length) % options.length
    const option = options[next]
    if (!option) return
    onChange(option.value)
    refs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="lbl">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex w-full gap-1 rounded-full bg-well p-1 tactile-inset">
        {options.map((option, i) => {
          const checked = option.value === value
          return (
            <button
              key={option.value}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cx(
                'relative min-h-10 flex-1 rounded-full px-3.5 text-body-md font-semibold transition-colors duration-150',
                checked ? 'text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              {checked && (
                <motion.span
                  layoutId={indikatorId}
                  transition={SPRING_SOFT}
                  className="absolute inset-0 rounded-full bg-card tactile-button"
                  aria-hidden="true"
                />
              )}
              <span className="relative">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

type StepperProps = {
  value: number
  onChange?: (value: number) => void
  taskName: string
  disabled?: boolean
  disabledReason?: string
}

const SEGMENTS = Array.from({ length: 10 }, (_, i) => i + 1)

/** Kontrol progress cepat 0–10. Nilai 10 berarti task selesai (C-06). */
export function ProgressStepper({ value, onChange, taskName, disabled = false, disabledReason }: StepperProps) {
  const readOnly = disabled || !onChange
  const reasonId = useId()
  const tombol =
    'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-ink tactile-button transition-[color,box-shadow] hover:text-primary active:tactile-pressed disabled:opacity-40 disabled:shadow-none'
  return (
    <div className="flex items-center gap-2">
      <motion.button
        type="button"
        whileTap={readOnly || value <= 0 ? {} : { scale: 0.97 }}
        aria-label={`Kurangi progress ${taskName}`}
        aria-describedby={disabledReason ? reasonId : undefined}
        disabled={readOnly || value <= 0}
        onClick={() => onChange?.(value - 1)}
        className={tombol}
      >
        <Icon name="remove" />
      </motion.button>
      <div className="inline-flex items-center gap-2 rounded-full bg-well px-4 py-1.5 tactile-inset">
        <div
          role="meter"
          aria-label={`Progress ${taskName}`}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={value}
          aria-valuetext={`${value} dari 10`}
          className="flex gap-1"
        >
          {SEGMENTS.map((n) => {
            const on = n <= value
            return (
              <motion.span
                key={n}
                aria-hidden="true"
                initial={false}
                animate={{ scaleY: on ? 1 : 0.82 }}
                transition={SPRING_SNAPPY}
                className={cx(
                  'h-4 w-2 rounded-full transition-colors duration-200',
                  on ? (value === 10 ? 'bg-primary' : 'bg-sage') : 'bg-high',
                )}
              />
            )
          })}
        </div>
        <motion.span
          key={value}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: DUR.slow, ease: EASE_OUT }}
          className={cx('inline-block min-w-14 text-right font-mono text-numeric-md font-bold tabular-nums', readOnly ? 'text-ink-muted' : 'text-primary')}
          aria-hidden="true"
        >
          {value}/10
        </motion.span>
      </div>
      <motion.button
        type="button"
        whileTap={readOnly || value >= 10 ? {} : { scale: 0.97 }}
        aria-label={`Tambah progress ${taskName}`}
        aria-describedby={disabledReason ? reasonId : undefined}
        disabled={readOnly || value >= 10}
        onClick={() => onChange?.(value + 1)}
        className={tombol}
      >
        <Icon name="add" />
      </motion.button>
      {disabledReason && (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      )}
    </div>
  )
}
