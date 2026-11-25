import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useDataProjek } from '../../../data/pilih'
import { useWaktu } from '../../../data/useWaktu'
import { formatDurasi } from '../../../domain/jamKosong'
import { tambahHari } from '../../../domain/tanggal'
import type { Tanggal } from '../../../domain/tipe'
import { Button, IconButton } from '../../kit/Button'
import { SegmentedControl } from '../../kit/controls'
import { Icon } from '../../kit/Icon'
import { formatRentang } from '../../format'
import { EASE_IN, EASE_OUT } from '../../motion'
import { hariMinggu, jamKosongHari } from '../../kalender/dataKalender'
import { TabJadwal } from '../../kalender/TabJadwal'
import { TampilanBulan } from '../../kalender/TampilanBulan'
import { TampilanMinggu } from '../../kalender/TampilanMinggu'
import { useLayananTask } from '../../task/LayananTask'
import { usePageTitle } from '../../usePageTitle'
import { usePengenalanHalaman } from '../../pengenalan/Pengenalan'

type Tab = 'bulan' | 'minggu' | 'jadwal'
const KUNCI_TAB = 'softblock:tab-kalender'
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/** Kalender mengingat tampilan terakhir di perangkat, bukan di akun (J-03, DA-9). */
function bacaTab(): Tab {
  try {
    const t = localStorage.getItem(KUNCI_TAB)
    return t === 'minggu' || t === 'jadwal' ? t : 'bulan'
  } catch {
    return 'bulan'
  }
}

function geserBulan(t: Tanggal, n: number): Tanggal {
  const [y, m] = t.split('-').map(Number)
  const d = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1 + n, 1))
  return d.toISOString().slice(0, 10)
}

/** S-15: Kalender dengan tab Bulan, Minggu, dan Jadwal (G-01..G-05). */
export function KalenderPage() {
  usePageTitle('Kalender')
  const data = useDataProjek()
  const waktu = useWaktu()
  const layanan = useLayananTask()
  const [tab, setTabState] = useState<Tab>(bacaTab)
  usePengenalanHalaman(tab === 'jadwal' ? 'jadwal' : 'kalender')
  const [kursor, setKursor] = useState<Tanggal | null>(null)
  const [arah, setArah] = useState(0)

  if (!data || !waktu) return null
  const hariIni = waktu.hariIni
  const titik = kursor ?? hariIni

  function setTab(t: Tab) {
    setTabState(t)
    try {
      localStorage.setItem(KUNCI_TAB, t)
    } catch {
      // Penyimpanan diblokir; pilihan tab hanya bertahan selama halaman terbuka.
    }
  }

  function geser(n: number) {
    setArah(n)
    setKursor(tab === 'bulan' ? geserBulan(titik, n) : tambahHari(titik, 7 * n))
  }

  const minggu = hariMinggu(titik)
  const judul =
    tab === 'jadwal' ? 'Jadwal' : tab === 'bulan' ? `${BULAN[Number(titik.slice(5, 7)) - 1]} ${titik.slice(0, 4)}` : formatRentang(minggu[0] ?? titik, minggu[6] ?? titik)
  const kosongPekan = hariMinggu(hariIni)
    .filter((t) => t >= hariIni)
    .reduce((n, t) => n + jamKosongHari(data, t), 0)

  const kunciGeser = tab === 'bulan' ? titik.slice(0, 7) : minggu[0]

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-card px-5 py-4 tactile-convex">
        <div className="flex flex-wrap items-center gap-3">
          {tab !== 'jadwal' && (
            <>
              <IconButton icon="chevron_left" label={tab === 'bulan' ? 'Bulan sebelumnya' : 'Minggu sebelumnya'} size="sm" onClick={() => geser(-1)} />
              <IconButton icon="chevron_right" label={tab === 'bulan' ? 'Bulan berikutnya' : 'Minggu berikutnya'} size="sm" onClick={() => geser(1)} />
            </>
          )}
          <h1 className="text-auth" aria-live="polite">
            {judul}
          </h1>
          {tab !== 'jadwal' && (
            <Button
              variant="tactile"
              size="sm"
              onClick={() => {
                setArah(0)
                setKursor(null)
              }}
            >
              Hari ini
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span data-pengenalan="kalender-jam-kosong" className="inline-flex items-center gap-1.5 rounded-full bg-well px-3 py-1.5 text-body-sm tactile-inset">
            <Icon name="schedule" size={16} className="text-primary" />
            Sisa pekan ini: <b className="font-mono">{formatDurasi(kosongPekan)} kosong</b>
          </span>
          <div data-pengenalan="kalender-tampilan" className="min-w-[280px]">
            <SegmentedControl
              label="Tampilan"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'bulan', label: 'Bulan' },
                { value: 'minggu', label: 'Minggu' },
                { value: 'jadwal', label: 'Jadwal' },
              ]}
            />
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false} custom={arah}>
        <motion.div
          key={`${tab}-${tab === 'jadwal' ? '' : kunciGeser}`}
          data-pengenalan={tab === 'jadwal' ? undefined : 'kalender-isi'}
          custom={arah}
          initial={{ opacity: 0, x: arah * 24 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE_OUT } }}
          exit={{ opacity: 0, x: arah * -24, transition: { duration: 0.16, ease: EASE_IN } }}
        >
          {tab === 'bulan' && <TampilanBulan data={data} bulan={titik} hariIni={hariIni} onPilihHari={layanan.bukaHari} />}
          {tab === 'minggu' && (
            <TampilanMinggu
              data={data}
              minggu={titik}
              hariIni={hariIni}
              menit={waktu.menit}
              onPilihHari={layanan.bukaHari}
              onItem={(t, it) => {
                if (it.jenis === 'jadwal') layanan.bukaFormJadwal({ mode: 'ubah', jadwalId: it.jadwalId })
                else {
                  const entri = data.entri.find((e) => e.id === it.blok.entri_id)
                  if (entri && t >= hariIni) layanan.bukaFormBlok({ entri, blok: it.blok })
                }
              }}
            />
          )}
          {tab === 'jadwal' && <TabJadwal data={data} hariIni={hariIni} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
