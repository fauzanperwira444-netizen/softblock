import type { ReactNode } from 'react'
import { Button } from '../kit/Button'
import { Alert } from '../kit/display'
import { Icon } from '../kit/Icon'
import type { IconName } from '../kit/icons'
import { Dialog } from './Dialog'

type Base = {
  open: boolean
  title: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  icon?: IconName
  description?: string
  busy?: boolean | undefined
  error?: string | undefined
}

type HeavyProps = Base & {
  akanTerjadi: string[]
  tetapAda?: string[]
  /** Tampilkan hanya bila aksinya memang tidak bisa dibatalkan. */
  takBisaDiurungkan?: boolean
}

/*
  Konfirmasi berat (I-04): fokus awal di "Kembali" sehingga Enter tidak pernah
  menjalankan aksi yang merusak.
*/
export function HeavyConfirmDialog({
  open,
  title,
  confirmLabel,
  onConfirm,
  onClose,
  icon = 'warning',
  description,
  busy,
  error,
  akanTerjadi,
  tetapAda,
  takBisaDiurungkan,
}: HeavyProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      {...(description ? { description } : {})}
      glyph={{ icon, tone: 'danger' }}
      kind="confirm"
      footer={<Footer confirmLabel={confirmLabel} onConfirm={onConfirm} onClose={onClose} busy={busy} />}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <ImpactList title="Akan terjadi" items={akanTerjadi} />
        {tetapAda && tetapAda.length > 0 && <ImpactList title="Tetap ada" items={tetapAda} />}
      </div>
      {takBisaDiurungkan && (
        <p className="flex items-center gap-2 text-body-md font-semibold text-danger">
          <Icon name="warning" size={18} />
          Tindakan ini tidak bisa diurungkan.
        </p>
      )}
    </Dialog>
  )
}

type LightProps = Base & { children?: ReactNode }

export function LightConfirmDialog({
  open,
  title,
  confirmLabel,
  onConfirm,
  onClose,
  icon = 'info',
  description,
  busy,
  error,
  children,
}: LightProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      {...(description ? { description } : {})}
      glyph={{ icon, tone: 'danger' }}
      kind="confirm"
      footer={<Footer confirmLabel={confirmLabel} onConfirm={onConfirm} onClose={onClose} busy={busy} />}
    >
      {error && <Alert tone="error">{error}</Alert>}
      {children && <div className="text-body-md text-ink-muted">{children}</div>}
    </Dialog>
  )
}

function Footer({
  confirmLabel,
  onConfirm,
  onClose,
  busy,
}: Pick<Base, 'confirmLabel' | 'onConfirm' | 'onClose' | 'busy'>) {
  return (
    <>
      <Button variant="outline" onClick={onClose} data-autofocus disabled={busy}>
        Kembali
      </Button>
      <Button variant="danger" onClick={onConfirm} busy={busy}>
        {confirmLabel}
      </Button>
    </>
  )
}

function ImpactList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-field bg-well p-4 tactile-inset">
      <p className="lbl mb-2">{title}</p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-body-md">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
