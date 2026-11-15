import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Memastikan folder fixture bersama (N-10) terjangkau dari web.
test('folder fixture bersama terbaca', () => {
  const dir = fileURLToPath(new URL('../../../../fixtures', import.meta.url))
  expect(readdirSync(dir)).toContain('README.md')
})
