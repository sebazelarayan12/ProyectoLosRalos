import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PerfilTopbar } from './PerfilTopbar'
import { api } from '@/lib/api'
import { toast } from 'sonner'

vi.mock('@/lib/api', () => ({
  api: { patch: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function renderTopbar(props: Partial<React.ComponentProps<typeof PerfilTopbar>> = {}) {
  return render(
    <MemoryRouter>
      <PerfilTopbar
        id="p1"
        apellido="Perez"
        nombre="Ana"
        nroExpediente="1/2020"
        puedeEscribir={false}
        onEditar={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
    { wrapper },
  )
}

function renderTopbarConRutas() {
  return render(
    <MemoryRouter initialEntries={['/profesionales/p1']}>
      <Routes>
        <Route
          path="/profesionales/p1"
          element={
            <PerfilTopbar
              id="p1"
              apellido="Perez"
              nombre="Ana"
              nroExpediente="1/2020"
              puedeEscribir={true}
              onEditar={vi.fn()}
              activo={true}
            />
          }
        />
        <Route path="/profesionales" element={<p>Pantalla busqueda profesionales</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper },
  )
}

describe('PerfilTopbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('muestra nombre completo y numero de expediente', () => {
    renderTopbar()

    expect(screen.getByText('Perez, Ana')).toBeInTheDocument()
    expect(screen.getByText('1/2020')).toBeInTheDocument()
  })

  test('muestra boton Editar solo si puedeEscribir es true', () => {
    const { rerender } = renderTopbar({ puedeEscribir: false })
    expect(screen.queryByRole('button', { name: /^editar$/i })).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <PerfilTopbar
          id="p1"
          apellido="Perez"
          nombre="Ana"
          nroExpediente="1/2020"
          puedeEscribir={true}
          onEditar={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /^editar$/i })).toBeInTheDocument()
  })

  test('click en Editar llama a onEditar', async () => {
    const onEditar = vi.fn()
    const user = userEvent.setup()
    renderTopbar({ puedeEscribir: true, onEditar })

    await user.click(screen.getByRole('button', { name: /^editar$/i }))

    expect(onEditar).toHaveBeenCalled()
  })

  test('no muestra acciones de desactivar/eliminar si puedeEscribir es false', () => {
    renderTopbar({ puedeEscribir: false, activo: true })

    expect(screen.queryByRole('button', { name: /desactivar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument()
  })

  test('profesional activo: click en Desactivar + confirmar llama DELETE /profesionales/{id}', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined })
    const user = userEvent.setup()
    renderTopbar({ puedeEscribir: true, activo: true })

    await user.click(screen.getByRole('button', { name: /^desactivar$/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    expect(api.delete).toHaveBeenCalledWith('/profesionales/p1')
    expect(toast.success).toHaveBeenCalledWith('Profesional desactivado')
  })

  test('profesional inactivo: click en Reactivar + confirmar llama PATCH /profesionales/{id}/reactivar', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: undefined })
    const user = userEvent.setup()
    renderTopbar({ puedeEscribir: true, activo: false })

    await user.click(screen.getByRole('button', { name: /^reactivar$/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    expect(api.patch).toHaveBeenCalledWith('/profesionales/p1/reactivar')
    expect(toast.success).toHaveBeenCalledWith('Profesional reactivado')
  })

  test('boton Eliminar definitivamente siempre visible aunque el profesional tenga documentos', () => {
    renderTopbar({ puedeEscribir: true, activo: true })
    expect(screen.getByRole('button', { name: /eliminar definitivamente/i })).toBeInTheDocument()
  })

  test('Eliminar definitivamente con exito navega a /profesionales', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined })
    const user = userEvent.setup()
    renderTopbarConRutas()

    await user.click(screen.getByRole('button', { name: /eliminar definitivamente/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    expect(api.delete).toHaveBeenCalledWith('/profesionales/p1/definitivo')
    expect(await screen.findByText('Pantalla busqueda profesionales')).toBeInTheDocument()
  })

  test('Eliminar definitivamente con documentos cargados muestra el mensaje real del backend', async () => {
    vi.mocked(api.delete).mockRejectedValue({
      response: { data: { message: 'No se puede eliminar: el profesional tiene documentos cargados. Elimine los documentos primero.' } },
    })
    const user = userEvent.setup()
    renderTopbar({ puedeEscribir: true, activo: true })

    await user.click(screen.getByRole('button', { name: /eliminar definitivamente/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    await screen.findByRole('button', { name: /confirmar/i })
    expect(toast.error).toHaveBeenCalledWith(
      'No se puede eliminar: el profesional tiene documentos cargados. Elimine los documentos primero.',
    )
  })
})
