import { LinkButton } from '../kit/Button'
import { EmptyState } from '../kit/display'
import { usePageTitle } from '../usePageTitle'

export function TidakDitemukanPage() {
  usePageTitle('Tidak ditemukan')
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-4">
      <h1 className="sr-only">Halaman tidak ditemukan</h1>
      <EmptyState icon="link_off" title="Halaman tidak ditemukan" action={<LinkButton to="/">Ke Dashboard</LinkButton>}>
        Alamat ini tidak ada atau sudah dipindahkan.
      </EmptyState>
    </main>
  )
}
