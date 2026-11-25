import type { JenisMiniatur } from '../../pengenalan/isi'
import { cx } from '../cx'
import { Button } from '../kit/Button'
import { Icon } from '../kit/Icon'

/** Penanda langkah: segmen ProgressStepper + angka "2 dari 5" yang selalu tampil (N-16). */
export function PenandaLangkah({ ke, dari, className }: { ke: number; dari: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cx('flex items-center gap-2', className)}>
      <span className="flex items-center gap-[3px]">
        {Array.from({ length: dari }, (_, i) => (
          <i
            key={i}
            className={cx(
              'block h-1.5 rounded-full transition-colors duration-200 ease-out',
              i === ke ? 'w-5.5 bg-primary' : 'w-3.5',
              i < ke && 'bg-sage',
              i > ke && 'bg-high tactile-pill',
            )}
          />
        ))}
      </span>
      <span className="font-mono text-body-sm whitespace-nowrap text-ink-muted">
        {ke + 1} dari {dari}
      </span>
    </span>
  )
}

export function TombolMatikan({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="underline decoration-line-strong underline-offset-4">
      Matikan semua pengenalan
    </Button>
  )
}

const baris = 'flex h-9 items-center gap-2.5 rounded-sm bg-card px-3 text-body-sm font-medium tactile-convex-sm'
const centang = 'size-4 shrink-0 rounded-full shadow-[inset_0_0_0_2px_var(--sb-line-strong)]'
const chip = 'ml-auto inline-flex min-h-6 items-center gap-1 rounded-full bg-well px-2.5 text-[0.6875rem] font-semibold text-ink-muted tactile-pill'

function Segmen({ isi, total }: { isi: number; total: number }) {
  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="flex gap-[3px]">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={cx('block h-1.5 w-2 rounded-full', i < isi ? 'bg-sage' : 'bg-high tactile-pill')} />
        ))}
      </span>
      <span className="font-mono text-[0.6875rem] text-ink-muted">
        {isi}/{total}
      </span>
    </span>
  )
}

/**
 * Miniatur menu di kartu ringkasan, disusun dari potongan komponen asli, bukan ilustrasi.
 * Isinya contoh statis dan disembunyikan dari pembaca layar; teks kartu sudah menjelaskannya.
 */
export function Miniatur({ jenis }: { jenis: JenisMiniatur }) {
  return (
    <div aria-hidden="true" className="relative h-44 overflow-hidden rounded-tile bg-well p-4 tactile-inset">
      <span className="pointer-events-none absolute -top-16 -right-16 size-52 rounded-full bg-[radial-gradient(circle,rgba(143,188,163,.35)_0%,rgba(227,239,233,.1)_70%,transparent_100%)] dark:opacity-40" />
      <div className="relative flex flex-col gap-2">{isiMiniatur(jenis)}</div>
    </div>
  )
}

function isiMiniatur(jenis: JenisMiniatur) {
  switch (jenis) {
    case 'dashboard':
      return (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              ['Telat', '2', 'text-danger'],
              ['To-do', '2/5', ''],
              ['Jam kosong', '3.5', ''],
            ].map(([l, v, w]) => (
              <div key={l} className="rounded-sm bg-card px-3 py-2.5 tactile-convex-sm">
                <p className="lbl">{l}</p>
                <p className={cx('font-mono text-numeric-md font-bold', w)}>{v}</p>
              </div>
            ))}
          </div>
          <div className={cx(baris, 'mt-1')}>
            <span className={centang} />
            Revisi metodologi
            <span className={chip}>Hari ini</span>
          </div>
        </>
      )
    case 'projek':
      return (
        <>
          <div className={baris}>
            <span className="size-2.5 shrink-0 rounded-[3px] bg-primary" />
            <b className="font-semibold">Skripsi</b>
            <Segmen isi={4} total={10} />
          </div>
          {[
            ['Sesi 1 · Riset', '2–14 Nov'],
            ['Sesi 2 · Pengumpulan data', '27 Nov'],
          ].map(([n, t]) => (
            <div key={n} className={cx(baris, 'ml-5')}>
              <Icon name="flag" size={16} className="text-ink-muted" />
              {n}
              <span className={cx(chip, 'font-mono')}>{t}</span>
            </div>
          ))}
        </>
      )
    case 'task':
      return (
        <>
          <div className={baris}>
            <Icon name="search" size={16} className="text-ink-muted" />
            <span className="text-ink-muted">Cari task</span>
            <span className={chip}>Status: Aktif</span>
          </div>
          <div className={baris}>
            <span className={centang} />
            Wireframe halaman profil
            <span className={chip}>
              <Icon name="sell" size={14} />
              Desain
            </span>
          </div>
          <div className={baris}>
            <span className={centang} />
            Rapat mingguan tim
            <span className={cx(chip, 'font-mono')}>26 Nov</span>
          </div>
        </>
      )
    case 'todo':
      return (
        <div className="grid grid-cols-[2.75rem_1fr] items-center gap-x-2.5 gap-y-2 font-mono text-[0.6875rem] text-ink-muted">
          <span>08.00</span>
          <span className="flex h-8 items-center gap-2 rounded-sm bg-mist px-3 font-sans text-body-sm font-semibold text-on-mist">
            <Icon name="check_circle" size={16} />
            Revisi metodologi
          </span>
          <span>10.00</span>
          <span className={cx(baris, 'h-8 font-sans font-semibold text-ink')}>
            <span className={centang} />
            Wireframe halaman profil
          </span>
          <span>13.00</span>
          <span className="flex h-8 items-center rounded-sm px-3 font-sans text-body-sm shadow-[inset_0_0_0_1.5px_var(--sb-line)]">Jam kosong · 2 jam</span>
        </div>
      )
    case 'kalender':
      return (
        <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[0.6875rem]">
          {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((h, i) => (
            <span key={i} className="font-sans font-semibold text-ink-muted">
              {h}
            </span>
          ))}
          {Array.from({ length: 14 }, (_, i) => {
            const t = i + 23
            const hariIni = t === 25
            const bertanda = [23, 24, 26, 27, 30].includes(t)
            return (
              <span
                key={t}
                className={cx(
                  'relative grid h-8 place-items-center rounded-full',
                  hariIni ? 'bg-cta font-bold text-on-cta' : 'bg-card tactile-convex-sm',
                )}
              >
                {t > 30 ? t - 30 : t}
                {bertanda && <i className="absolute bottom-1 size-1 rounded-full bg-primary" />}
              </span>
            )
          })}
        </div>
      )
  }
}
