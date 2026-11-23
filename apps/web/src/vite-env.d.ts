/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD?: string
  /** "off" mematikan mock msw di dev agar SPA bicara ke Laravel asli. */
  readonly VITE_API_MOCK?: string
  /** "on" membuat build statis yang memakai API tiruan di browser. */
  readonly VITE_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
