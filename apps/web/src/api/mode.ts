/** Build demo statis (Vercel): tanpa backend, data tiruan tersimpan di browser pengunjung. */
export const MODE_DEMO = import.meta.env.VITE_DEMO === 'on'

export const MODE_MOCK = MODE_DEMO || (import.meta.env.DEV && import.meta.env.VITE_API_MOCK !== 'off')
