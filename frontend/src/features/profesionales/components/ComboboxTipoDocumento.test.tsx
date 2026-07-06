import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComboboxTipoDocumento } from './ComboboxTipoDocumento'

const tipos = [
  { id: 'tipo-1', nombre: 'DNI' },
  { id: 'tipo-2', nombre: 'Titulo' },
]

describe('ComboboxTipoDocumento', () => {
  test('muestra los tipos existentes al abrir', async () => {
    const user = userEvent.setup()
    render(<ComboboxTipoDocumento id="tipo" value="" onChange={vi.fn()} tipos={tipos} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText('DNI')).toBeInTheDocument()
    expect(screen.getByText('Titulo')).toBeInTheDocument()
  })

  test('filtra la lista al tipear', async () => {
    const user = userEvent.setup()
    render(<ComboboxTipoDocumento id="tipo" value="" onChange={vi.fn()} tipos={tipos} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(/buscar o crear tipo/i), 'Titu')

    expect(screen.getByText('Titulo')).toBeInTheDocument()
    expect(screen.queryByText('DNI')).not.toBeInTheDocument()
  })

  test('seleccionar un tipo existente notifica el nombre elegido', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ComboboxTipoDocumento id="tipo" value="" onChange={onChange} tipos={tipos} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('DNI'))

    expect(onChange).toHaveBeenCalledWith('DNI')
  })

  test('ofrece crear un tipo nuevo cuando no matchea ninguno existente', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ComboboxTipoDocumento id="tipo" value="" onChange={onChange} tipos={tipos} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(/buscar o crear tipo/i), 'Certificado')

    const crearItem = screen.getByText(/crear tipo: certificado/i)
    expect(crearItem).toBeInTheDocument()

    await user.click(crearItem)

    expect(onChange).toHaveBeenCalledWith('Certificado')
  })

  test('no ofrece crear tipo cuando el texto matchea uno existente', async () => {
    const user = userEvent.setup()
    render(<ComboboxTipoDocumento id="tipo" value="" onChange={vi.fn()} tipos={tipos} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(/buscar o crear tipo/i), 'dni')

    expect(screen.queryByText(/crear tipo/i)).not.toBeInTheDocument()
  })
})
