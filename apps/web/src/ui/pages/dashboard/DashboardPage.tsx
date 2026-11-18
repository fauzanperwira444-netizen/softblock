import { useData } from '../../../data/DataProvider'
import { useWaktu } from '../../../data/useWaktu'
import { LABEL_STATUS_PROJEK, nDariM, statusProjek, taskTelat, type StatusProjek } from '../../../domain/status'
import { Badge, Card, CardTitle, Chip, EmptyState, type BadgeKind } from '../../kit/display'
import { formatTanggal } from '../../format'
import { Page } from '../../shell/Page'
import { usePageTitle } from '../../usePageTitle'

const BADGE_STATUS: Record<StatusProjek, BadgeKind> = {
  belum_dijadwalkan: 'netral-garis',
  belum_mulai: 'netral-garis',
  berjalan: 'info',
  jeda: 'netral',
  melewati_jadwal: 'telat',
  selesai: 'redup',
  batal: 'redup',
}

/**
 * Sementara (Tahap 2): pratinjau isi snapshot lokal dan status yang dihitung domain.
 * Tata letak Dashboard lengkap (S-10) dibangun di Tahap 7.
 */
export function DashboardPage() {
  usePageTitle('Dashboard')
  const { snapshot } = useData()
  const waktu = useWaktu()
  if (!snapshot || !waktu) return null

  const { projek, sesi, task } = snapshot.isi
  const semuaSesi = Object.values(sesi)
  const semuaTask = Object.values(task)
  const telat = semuaTask.filter((t) => taskTelat(t, waktu.hariIni, waktu.menit)).length

  const baris = Object.values(projek).map((p) => {
    const sesiP = semuaSesi.filter((s) => s.projek_id === p.id)
    const idSesi = new Set(sesiP.map((s) => s.id))
    const taskP = semuaTask.filter((t) => t.sesi_id && idSesi.has(t.sesi_id))
    return { p, status: statusProjek(p, sesiP, taskP, waktu.hariIni), ...nDariM(taskP) }
  })

  return (
    <Page title="Dashboard" subtitle={`Hari ini ${formatTanggal(waktu.hariIni)}. Tata letak lengkap menyusul di Tahap 7.`}>
      {baris.length === 0 ? (
        <EmptyState icon="folder" title="Belum ada projek">
          Data akun ini masih kosong. Projek yang kamu buat akan muncul di sini.
        </EmptyState>
      ) : (
        <Card className="flex flex-col gap-4" aria-labelledby="pratinjau-data">
          <CardTitle icon="cloud_done" id="pratinjau-data" end={<Badge kind={telat > 0 ? 'telat' : 'redup'}>{`${telat} task telat`}</Badge>}>
            Pratinjau data lokal
          </CardTitle>
          <ul className="flex flex-col gap-3">
            {baris.map(({ p, status, n, m }) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-field bg-card p-4 tactile-convex">
                <Chip kind="projek" color={p.warna}>
                  {p.nama}
                </Chip>
                <Badge kind={BADGE_STATUS[status]}>{LABEL_STATUS_PROJEK[status]}</Badge>
                <span className="ml-auto font-mono text-body-sm text-ink-muted">
                  {n} dari {m} task selesai
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  )
}
