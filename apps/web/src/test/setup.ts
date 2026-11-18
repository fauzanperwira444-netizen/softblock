import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// Aksi mock punya jeda jaringan buatan ditambah animasi; batas bawaan 1 detik terlalu ketat.
configure({ asyncUtilTimeout: 4000 })

if (typeof window !== 'undefined') {
  // jsdom tidak mengimplementasikan scrollTo; ScrollRestoration memanggilnya saat berpindah rute.
  window.scrollTo = () => {}

  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList

  // jsdom belum punya showModal/close pada <dialog>; cukup atur atribut open.
  const proto = HTMLDialogElement.prototype
  proto.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
  proto.close ??= function (this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
