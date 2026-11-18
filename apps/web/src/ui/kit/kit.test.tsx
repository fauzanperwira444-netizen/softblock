// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { SegmentedControl } from './controls'
import { TextField } from './fields'

describe('TextField', () => {
  test('menghubungkan label, penghitung, dan galat ke input', () => {
    render(<TextField label="Nama task" maxLength={30} value="Revisi" onChange={() => {}} error="Nama sudah dipakai." />)
    const input = screen.getByLabelText('Nama task')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Nama sudah dipakai.')
    expect(screen.getByText('6/30')).toBeInTheDocument()
  })
})

describe('SegmentedControl', () => {
  function Contoh() {
    const [v, setV] = useState<'a' | 'b' | 'c'>('a')
    return (
      <SegmentedControl
        label="Pilihan"
        value={v}
        onChange={setV}
        options={[
          { value: 'a', label: 'Satu' },
          { value: 'b', label: 'Dua' },
          { value: 'c', label: 'Tiga' },
        ]}
      />
    )
  }

  test('panah memindahkan pilihan dan fokus, berputar di ujung', async () => {
    const user = userEvent.setup()
    render(<Contoh />)
    await user.tab()
    expect(screen.getByRole('radio', { name: 'Satu' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Dua' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Dua' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Tiga' })).toBeChecked()
  })
})
