import { setupServer } from 'msw/node'
import { handlers, resetMock } from '../api/mock/handlers'
import { resetCsrfUntukTes } from '../api/client'

export const server = setupServer(...handlers)

/** Pasang mock API untuk satu berkas tes jsdom. */
export function pakaiServerMock() {
  beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' })
    // fetch Node menolak URL relatif; peramban menyelesaikannya terhadap origin halaman.
    const fetchMsw = globalThis.fetch
    globalThis.fetch = (input, init) =>
      fetchMsw(typeof input === 'string' && input.startsWith('/') ? new URL(input, location.origin) : input, init)
  })
  beforeEach(() => {
    resetMock()
    resetCsrfUntukTes()
  })
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}
