import { EmptyState } from '../kit/display'
import type { IconName } from '../kit/icons'
import { Page } from '../shell/Page'
import { usePageTitle } from '../usePageTitle'

type Props = { judul: string; icon: IconName; tahap: string }

/** Penanda jujur untuk halaman yang belum dibangun pada tahap ini. */
export function SedangDibangun({ judul, icon, tahap }: Props) {
  usePageTitle(judul)
  return (
    <Page title={judul}>
      <EmptyState icon={icon} title="Halaman ini sedang dibangun">
        Dijadwalkan pada {tahap} rencana front-end.
      </EmptyState>
    </Page>
  )
}
