import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { FiltrosProfesionales } from './FiltrosProfesionales'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('FiltrosProfesionales', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { id: 'area-1', nombre: 'LOS RALOS' },
        { id: 'area-2', nombre: 'LAS CEJAS' },
      ],
    })
  })

  test('abre el panel de filtros al hacer click en el trigger', async () => {
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={vi.fn()} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /filtros/i }))

    expect(screen.getByText(/tipo de legajo/i)).toBeInTheDocument()
    expect(screen.getByText(/area operativa/i)).toBeInTheDocument()
    expect(screen.getByText(/tipo de efector/i)).toBeInTheDocument()
    expect(screen.queryByText(/^planta$/i)).not.toBeInTheDocument()
  })

  test('elegir un tipo llama a onFiltrosChange con el tipo seleccionado', async () => {
    const onFiltrosChange = vi.fn()
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={onFiltrosChange} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('combobox', { name: /tipo de legajo/i }))
    await user.click(await screen.findByRole('option', { name: /^asistencial$/i }))

    expect(onFiltrosChange).toHaveBeenCalledWith({ tipo: 'Asistencial', areaOperativaId: undefined, tipoEfector: undefined })
  })

  test('elegir un area operativa llama a onFiltrosChange con el id del area', async () => {
    const onFiltrosChange = vi.fn()
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={onFiltrosChange} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('combobox', { name: /area operativa/i }))
    await user.click(await screen.findByRole('option', { name: /las cejas/i }))

    expect(onFiltrosChange).toHaveBeenCalledWith({ tipo: undefined, areaOperativaId: 'area-2', tipoEfector: undefined })
  })

  test('elegir un tipo de efector llama a onFiltrosChange con Hospital o CAPS', async () => {
    const onFiltrosChange = vi.fn()
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={onFiltrosChange} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('combobox', { name: /tipo de efector/i }))
    await user.click(await screen.findByRole('option', { name: /^caps$/i }))

    expect(onFiltrosChange).toHaveBeenCalledWith({ tipo: undefined, areaOperativaId: undefined, tipoEfector: 'CAPS' })
  })

  test('boton limpiar filtros resetea tipo, area operativa, efector y estado', async () => {
    const onFiltrosChange = vi.fn()
    const user = userEvent.setup()
    render(
      <FiltrosProfesionales
        filtros={{ tipo: 'Asistencial', areaOperativaId: 'area-1', tipoEfector: 'Hospital', estado: 'Inactivos' }}
        onFiltrosChange={onFiltrosChange}
      />,
      { wrapper },
    )

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('button', { name: /limpiar filtros/i }))

    expect(onFiltrosChange).toHaveBeenCalledWith({
      tipo: undefined,
      areaOperativaId: undefined,
      tipoEfector: undefined,
      estado: undefined,
    })
  })

  test('muestra el select de Estado con placeholder Activos', async () => {
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={vi.fn()} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /filtros/i }))

    expect(screen.getByRole('combobox', { name: /estado/i })).toHaveTextContent('Activos')
  })

  test('elegir Inactivos llama a onFiltrosChange con estado Inactivos', async () => {
    const onFiltrosChange = vi.fn()
    const user = userEvent.setup()
    render(<FiltrosProfesionales filtros={{}} onFiltrosChange={onFiltrosChange} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /filtros/i }))
    await user.click(screen.getByRole('combobox', { name: /estado/i }))
    await user.click(await screen.findByRole('option', { name: /^inactivos$/i }))

    expect(onFiltrosChange).toHaveBeenCalledWith({
      tipo: undefined,
      areaOperativaId: undefined,
      tipoEfector: undefined,
      estado: 'Inactivos',
    })
  })
})
