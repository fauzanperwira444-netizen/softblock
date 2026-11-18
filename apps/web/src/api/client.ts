import { ApiError, kodeDariStatus, type BadanGalat } from './errors'

const BUILD = import.meta.env.VITE_BUILD ?? 'dev'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

let csrfSiap: Promise<void> | null = null

function bacaCookie(nama: string): string | undefined {
  const baris = document.cookie.split('; ').find((c) => c.startsWith(`${nama}=`))
  return baris ? decodeURIComponent(baris.slice(nama.length + 1)) : undefined
}

// Sanctum SPA: cookie XSRF-TOKEN diambil sekali sebelum permintaan pengubah pertama.
function pastikanCsrf(): Promise<void> {
  csrfSiap ??= fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' }).then(
    () => undefined,
    () => {
      csrfSiap = null
    },
  )
  return csrfSiap
}

type Opsi = {
  /** Nomor revisi akun yang diketahui klien, untuk kendali konkurensi (7.2). */
  ifMatch?: number
}

export async function request<T>(method: Method, path: string, body?: unknown, opsi: Opsi = {}): Promise<T> {
  if (method !== 'GET') await pastikanCsrf()

  const headers: Record<string, string> = { Accept: 'application/json', 'X-Build': BUILD }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (opsi.ifMatch !== undefined) headers['If-Match'] = String(opsi.ifMatch)
  const xsrf = bacaCookie('XSRF-TOKEN')
  if (xsrf) headers['X-XSRF-TOKEN'] = xsrf

  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? null : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('jaringan', 0)
  }

  if (res.status === 204) return undefined as T
  const data: unknown = await res.json().catch(() => undefined)
  if (res.ok) return data as T

  const badan = (data ?? {}) as BadanGalat
  throw new ApiError(kodeDariStatus(res.status, badan.kode), res.status, badan)
}

export function resetCsrfUntukTes() {
  csrfSiap = null
}
