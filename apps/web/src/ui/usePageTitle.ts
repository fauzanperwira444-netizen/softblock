import { useEffect } from 'react'

export function usePageTitle(judul: string) {
  useEffect(() => {
    document.title = `${judul} · Softblock`
  }, [judul])
}
