import { useEffect, useRef } from 'react'

/*
  Formulir yang sedang terbuka mendaftarkan isiannya di sini. Sebelum pengalihan ke Google untuk
  login ulang (U-13), semua isian dikumpulkan dan disimpan ke store draf_formulir (DA-10).
*/
const pendaftar = new Map<string, () => unknown>()

export function useDaftarDraf(kunci: string, aktif: boolean, ambil: () => unknown) {
  const terbaru = useRef(ambil)
  useEffect(() => {
    terbaru.current = ambil
  })
  useEffect(() => {
    if (!aktif) return
    pendaftar.set(kunci, () => terbaru.current())
    return () => {
      pendaftar.delete(kunci)
    }
  }, [kunci, aktif])
}

export function kumpulkanDraf(): Record<string, unknown> {
  return Object.fromEntries([...pendaftar].map(([k, ambil]) => [k, ambil()]))
}
