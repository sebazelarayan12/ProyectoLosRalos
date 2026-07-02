import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectField } from './SelectField'

const opciones = [
  { value: 'a', label: 'Opcion A' },
  { value: 'b', label: 'Opcion B' },
]

describe('SelectField', () => {
  test('muestra el label y el placeholder', () => {
    render(
      <SelectField
        id="campo"
        label="Mi campo"
        placeholder="Elegir"
        value={undefined}
        onValueChange={vi.fn()}
        options={opciones}
      />,
    )

    expect(screen.getByText('Mi campo')).toBeInTheDocument()
    expect(screen.getByText('Elegir')).toBeInTheDocument()
  })

  test('elegir una opcion llama a onValueChange con su value', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <SelectField
        id="campo"
        label="Mi campo"
        placeholder="Elegir"
        value={undefined}
        onValueChange={onValueChange}
        options={opciones}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Mi campo' }))
    await user.click(await screen.findByRole('option', { name: 'Opcion B' }))

    expect(onValueChange).toHaveBeenCalledWith('b')
  })
})
