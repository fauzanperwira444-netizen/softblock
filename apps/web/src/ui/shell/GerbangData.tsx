import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useData } from '../../data/DataProvider'
import { Button } from '../kit/Button'
import { EmptyState } from '../kit/display'
import { riseChild, staggerParent } from '../motion'

/** Kerangka memuat saat perangkat belum punya snapshot dan masih tersambung (10.1). */
function Kerangka() {
  const blok = 'rounded-card bg-well tactile-inset'
  return (
    <motion.div
      role="status"
      aria-label="Memuat data"
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      <motion.div variants={riseChild} className="h-11 w-56 rounded-full bg-well tactile-inset" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_5fr]">
        <motion.div variants={riseChild} className={`${blok} h-72`} />
        <motion.div variants={riseChild} className={`${blok} h-72`} />
      </div>
      <motion.div variants={riseChild} className={`${blok} h-40`} />
    </motion.div>
  )
}

/**
 * Halaman yang dihitung dari snapshot hanya tampil bila snapshot ada. Tanpa snapshot:
 * kerangka saat menyambung, "Belum ada data di perangkat ini" saat offline (N-47), galat saat gagal.
 */
export function GerbangData({ children }: { children: ReactNode }) {
  const { snapshot, lokalDibaca, koneksi, segarkan } = useData()
  if (snapshot) return <>{children}</>
  if (!lokalDibaca || koneksi === 'menyambungkan' || koneksi === 'lambat' || koneksi === 'tersambung_kembali') {
    return <Kerangka />
  }
  if (koneksi === 'offline') {
    return (
      <EmptyState
        icon="cloud_off"
        title="Belum ada data di perangkat ini"
        action={
          <Button icon="refresh" onClick={segarkan}>
            Coba lagi
          </Button>
        }
      >
        Sambungkan perangkat ke internet sekali untuk memuat data akunmu. Setelah itu data bisa dibaca saat offline.
      </EmptyState>
    )
  }
  return (
    <EmptyState
      icon="sync_problem"
      title="Data belum bisa dimuat"
      action={
        <Button icon="refresh" onClick={segarkan}>
          Coba lagi
        </Button>
      }
    >
      Datamu aman di server. Periksa koneksi, lalu coba lagi.
    </EmptyState>
  )
}
