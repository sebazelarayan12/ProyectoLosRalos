import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FiltrosProfesionales } from './FiltrosProfesionales'

describe('FiltrosProfesionales', () => {
  test('abre el panel de filtros al hacer click en el trigger', async () => {
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /filtros/i }))

    expect(screen.getByText(/tipo de legajo/i)).toBeInTheDocument()
    expect(screen.getByText(/planta/i)).toBeInTheDocument()
  })

  test('elegir un tipo llama a onFiltrosChange con el tipo seleccionado', async () => {
    const onFiltrosChange = vi.fn()
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={onFiltrosChange} />)

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('combobox', { name: /tipo de legajo/i }))
    await user.click(await screen.findByRole('option', { name: /^asistencial$/i }))

    expect(onFiltrosChange).toHaveBeenCalledWith({ tipo: 'Asistencial', planta: undefined })
  })

  test('boton limpiar filtros resetea tipo, planta y estado', async () => {
    const onFiltrosChange = vi.fn()
    const user = userEvent.setup()
    render(
      <FiltrosProfesionales
        filtros={{ tipo: 'Asistencial', planta: 'Transitorio', estado: 'Inactivos' }}
        onFiltrosChange={onFiltrosChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('button', { name: /limpiar filtros/i }))

    expect(onFiltrosChange).toHaveBeenCalledWith({ tipo: undefined, planta: undefined, estado: undefined })
  })

  test('muestra el select de Estado con placeholder Activos', async () => {
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /filtros/i }))

    expect(screen.getByRole('combobox', { name: /estado/i })).toHaveTextContent('Activos')
  })

  test('elegir Inactivos llama a onFiltrosChange con estado Inactivos', async () => {
    const onFiltrosChange = vi.fn()
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={onFiltrosChange} />)

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('combobox', { name: /estado/i }))
    await user.click(await screen.findByRole('option', { name: /^inactivos$/i }))

    expect(onFiltrosChange).toHaveBeenCalledWith({ tipo: undefined, planta: undefined, estado: 'Inactivos' })
  })
})
