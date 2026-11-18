import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { taskApi } from '../../api/task'
import { useMutasi, useMutasiInstan } from '../../data/DataProvider'
import { useDataProjek } from '../../data/pilih'
import { useWaktu } from '../../data/useWaktu'
import { PROGRESS_SELESAI } from '../../domain/status'
import { dampakTask, infoLabel, namaBentrokBukaKembali, progressSebelumSelesai } from '../../domain/task'
import type { Task } from '../../domain/tipe'
import { galatForm } from '../formGalat'
import { HeavyConfirmDialog, LightConfirmDialog } from '../overlay/ConfirmDialog'
import { FormBlok, type AwalFormBlok } from '../todo/FormBlok'
import { PilihHari } from '../todo/PilihHari'
import { FormBukaKembali } from './FormBukaKembali'
import { FormPindah } from './FormPindah'
import { FormProgress } from './FormProgress'
import { FormTask, type AwalFormTask } from './FormTask'
import { PanelTask } from './PanelTask'

/*
  Layanan aksi task bersama untuk Daftar Task, Detail Projek, dan halaman lain (N-21): panel detail
  yang tercermin di alamat (J-04), formulir F-13/F-14, dan konfirmasi saat aksi menutup projek (2.4).
*/

type Penutupan = { jenis: 'progress'; task: Task; nilai: number; catatan: string } | { jenis: 'batal'; task: Task }

type LayananTaskValue = {
  bukaDetail: (taskId: string) => void
  bukaFormTask: (awal: AwalFormTask) => void
  bukaFormProgress: (task: Task) => void
  bukaFormPindah: (task: Task) => void
  /** Progress dari kontrol cepat; ditolak server → galat diteruskan ke baris (N-50). */
  ubahProgress: (task: Task, nilai: number, catatan?: string) => Promise<void>
  mintaBatal: (task: Task) => void
  bukaKembali: (task: Task) => Promise<void>
  /** Pilihan hari untuk menambah task ke to-do (E-02). */
  tambahKeTodo: (task: Task) => void
  bukaFormBlok: (awal: AwalFormBlok) => void
}

const LayananContext = createContext<LayananTaskValue | null>(null)

export function useLayananTask(): LayananTaskValue {
  const v = useContext(LayananContext)
  if (!v) throw new Error('useLayananTask dipakai di luar LayananTask')
  return v
}

export function LayananTask({ children }: { children: ReactNode }) {
  const data = useDataProjek()
  const waktu = useWaktu()
  const mutasi = useMutasi()
  const mutasiInstan = useMutasiInstan()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()

  const [formTask, setFormTask] = useState<AwalFormTask | null>(null)
  const [formProgress, setFormProgress] = useState<Task | null>(null)
  const [formPindah, setFormPindah] = useState<Task | null>(null)
  const [formBuka, setFormBuka] = useState<Task | null>(null)
  const [pilihHari, setPilihHari] = useState<Task | null>(null)
  const [formBlok, setFormBlok] = useState<AwalFormBlok | null>(null)
  const [konfirmasiBatal, setKonfirmasiBatal] = useState<Task | null>(null)
  const [penutupan, setPenutupan] = useState<Penutupan | null>(null)
  const [proses, setProses] = useState(false)
  const [galat, setGalat] = useState<string>()

  const taskId = params.get('task')

  const bukaDetail = useCallback(
    (id: string) => {
      const p = new URLSearchParams(params)
      p.set('task', id)
      navigate({ search: p.toString() }, { state: { panelTask: true } })
    },
    [navigate, params],
  )

  const tutupDetail = useCallback(() => {
    // Tombol kembali menutup panel; bila panel dibuka langsung dari alamat, hapus parameternya saja.
    if ((location.state as { panelTask?: boolean } | null)?.panelTask) navigate(-1)
    else {
      const p = new URLSearchParams(params)
      p.delete('task')
      setParams(p, { replace: true })
    }
  }, [location.state, navigate, params, setParams])

  const kirimProgress = useCallback(
    async (task: Task, nilai: number, catatan: string, dampak: ReturnType<typeof dampakTask>) => {
      await mutasiInstan({ tabel: 'task', id: task.id, baris: { ...task, progress: nilai } }, (v) => taskApi.progress(v, task.id, nilai, catatan, dampak))
    },
    [mutasiInstan],
  )

  const ubahProgress = useCallback(
    async (task: Task, nilai: number, catatan = '') => {
      if (!data || !waktu) return
      const dampak = nilai === PROGRESS_SELESAI ? dampakTask(data, task.id, { progress: nilai }, waktu.hariIni) : null
      if (dampak) {
        // Aksi yang menutup projek tidak instan: tampilkan dialog berat dan tunggu server (I-10).
        setGalat(undefined)
        setPenutupan({ jenis: 'progress', task, nilai, catatan })
        return
      }
      await kirimProgress(task, nilai, catatan, null)
    },
    [data, waktu, kirimProgress],
  )

  const mintaBatal = useCallback(
    (task: Task) => {
      setGalat(undefined)
      if (data && waktu && dampakTask(data, task.id, { batal: true }, waktu.hariIni)) setPenutupan({ jenis: 'batal', task })
      else setKonfirmasiBatal(task)
    },
    [data, waktu],
  )

  const bukaKembali = useCallback(
    async (task: Task) => {
      if (!data) return
      if (namaBentrokBukaKembali(data, task, task.nama)) {
        setFormBuka(task)
        return
      }
      const kembali = progressSebelumSelesai(data.riwayat, task.id)
      await mutasiInstan({ tabel: 'task', id: task.id, baris: { ...task, progress: kembali } }, (v) => taskApi.bukaKembali(v, task.id, null))
    },
    [data, mutasiInstan],
  )

  async function jalankanBatal(task: Task) {
    setProses(true)
    setGalat(undefined)
    try {
      const dampak = data && waktu ? dampakTask(data, task.id, { batal: true }, waktu.hariIni) : null
      await mutasi((v) => taskApi.batal(v, task.id, dampak))
      setKonfirmasiBatal(null)
      setPenutupan(null)
    } catch (e) {
      setGalat(galatForm(e).umum ?? 'Gagal membatalkan task.')
    } finally {
      setProses(false)
    }
  }

  async function jalankanPenutupan() {
    if (!penutupan || !data || !waktu) return
    if (penutupan.jenis === 'batal') return jalankanBatal(penutupan.task)
    setProses(true)
    setGalat(undefined)
    try {
      const dampak = dampakTask(data, penutupan.task.id, { progress: penutupan.nilai }, waktu.hariIni)
      await kirimProgress(penutupan.task, penutupan.nilai, penutupan.catatan, dampak)
      setPenutupan(null)
      setFormProgress(null)
    } catch (e) {
      setGalat(galatForm(e).umum ?? 'Gagal menyimpan progress.')
    } finally {
      setProses(false)
    }
  }

  const value = useMemo<LayananTaskValue>(
    () => ({
      bukaDetail,
      bukaFormTask: setFormTask,
      bukaFormProgress: setFormProgress,
      bukaFormPindah: setFormPindah,
      ubahProgress,
      mintaBatal,
      bukaKembali,
      tambahKeTodo: setPilihHari,
      bukaFormBlok: setFormBlok,
    }),
    [bukaDetail, ubahProgress, mintaBatal, bukaKembali],
  )

  const infoPenutupan = penutupan && data ? infoLabel(data, penutupan.task) : null
  const namaProjek = infoPenutupan?.jenis === 'projek' ? infoPenutupan.projek.nama : ''
  const taskPanel = taskId && data ? data.task.find((t) => t.id === taskId) : undefined

  return (
    <LayananContext.Provider value={value}>
      {children}
      <PanelTask task={taskPanel} open={!!taskPanel} onClose={tutupDetail} />
      <FormTask awal={formTask} onClose={() => setFormTask(null)} />
      <FormProgress task={formProgress} onClose={() => setFormProgress(null)} />
      <FormPindah task={formPindah} onClose={() => setFormPindah(null)} />
      <FormBukaKembali task={formBuka} onClose={() => setFormBuka(null)} />
      <PilihHari task={pilihHari} onClose={() => setPilihHari(null)} />
      <FormBlok awal={formBlok} onClose={() => setFormBlok(null)} />

      <LightConfirmDialog
        open={!!konfirmasiBatal}
        onClose={() => setKonfirmasiBatal(null)}
        onConfirm={() => konfirmasiBatal && void jalankanBatal(konfirmasiBatal)}
        title={`Batalkan task “${konfirmasiBatal?.nama ?? ''}”?`}
        icon="cancel"
        confirmLabel="Batalkan task"
        busy={proses}
        error={galat}
      >
        Task batal tidak bisa dipulihkan dan hanya bisa dilihat. Entri to-do mendatang untuk task ini dihapus.
      </LightConfirmDialog>

      <HeavyConfirmDialog
        open={!!penutupan}
        onClose={() => setPenutupan(null)}
        onConfirm={() => void jalankanPenutupan()}
        title={penutupan?.jenis === 'batal' ? `Batalkan task “${penutupan.task.nama}”?` : `Selesaikan “${penutupan?.task.nama ?? ''}”?`}
        icon={penutupan?.jenis === 'batal' ? 'cancel' : 'check_circle'}
        confirmLabel={penutupan?.jenis === 'batal' ? 'Ya, batalkan task' : 'Ya, selesaikan task'}
        akanTerjadi={[
          penutupan?.jenis === 'batal' ? 'Task dibatalkan dan hanya bisa dilihat.' : 'Task menjadi selesai (progress 10).',
          `Projek “${namaProjek}” akan menjadi selesai dan terkunci.`,
          'Entri to-do mendatang untuk task ini dihapus.',
        ]}
        tetapAda={['Riwayat progress', 'Task lain di projek ini', 'Entri to-do hari ini']}
        takBisaDiurungkan={penutupan?.jenis === 'batal'}
        busy={proses}
        error={galat}
      />
    </LayananContext.Provider>
  )
}
