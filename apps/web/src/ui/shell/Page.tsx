import { motion } from 'motion/react'
import { Children, type ReactNode } from 'react'
import { riseChild, staggerParent } from '../motion'

type Props = { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }

/** Kepala halaman + isi yang masuk bertahap (maks 6 jeda, sesuai token stagger). */
export function Page({ title, subtitle, actions, children }: Props) {
  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-8">
      <motion.div variants={riseChild} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-xl-mobile md:text-headline-xl">{title}</h1>
          {subtitle && <p className="mt-1 text-[0.9375rem] leading-[1.375rem] text-ink-muted">{subtitle}</p>}
        </div>
        {actions}
      </motion.div>
      {Children.map(children, (child) => (child ? <motion.div variants={riseChild}>{child}</motion.div> : null))}
    </motion.div>
  )
}
