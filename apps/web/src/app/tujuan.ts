/** Hanya terima jalur internal agar ?ke= tidak bisa dipakai untuk pengalihan ke situs lain. */
export function tujuanAman(ke: string | null): string {
  if (!ke || !ke.startsWith('/') || ke.startsWith('//') || ke.startsWith('/\\')) return '/'
  return ke
}
