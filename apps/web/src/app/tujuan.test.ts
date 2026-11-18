import { tujuanAman } from './tujuan'

test.each([
  [null, '/'],
  ['', '/'],
  ['/akun', '/akun'],
  ['/task?task=abc', '/task?task=abc'],
  ['//jahat.example', '/'],
  ['/\\jahat.example', '/'],
  ['https://jahat.example', '/'],
])('tujuanAman(%s) = %s', (masukan, hasil) => {
  expect(tujuanAman(masukan)).toBe(hasil)
})
