import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuditoriaPage } from './AuditoriaPage'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

const respuestaConResultados = {
  items: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      usuarioId: '22222222-2222-2222-2222-222222222222',
      nombreUsuario: 'Admin Test',
      accion: 'VerLegajo',
      profesionalId: '33333333-3333-3333-3333-333333333333',
      detalleExtra: null,
      timestamp: '2026-01-15T10:00:00Z',
      ipOrigen: '1.2.3.4',
    },
  ],
  porPagina: 50,
  hasNextPage: false,
  cursor: null,
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/auditoria']}>
        <Routes>
          <Route path="/auditoria" element={<AuditoriaPage />} />
          <Route path="/profesionales/:id" element={<div>Pantalla Perfil</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AuditoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('muestra los eventos devueltos por la API', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: respuestaConResultados })

    renderPage()

    expect(await screen.findByText('Admin Test')).toBeInTheDocument()
  })

  test('sin eventos, muestra mensaje de vacio', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [], porPagina: 50, hasNextPage: false, cursor: null },
    })

    renderPage()

    expect(await screen.findByText(/no hay eventos/i)).toBeInTheDocument()
  })

  test('cambiar el filtro Desde lo manda como param y resetea la paginacion', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: respuestaConResultados })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Admin Test')

    await user.type(screen.getByLabelText(/^desde$/i), '2026-01-01')

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/audit',
        expect.objectContaining({ params: expect.objectContaining({ desde: '2026-01-01' }) }),
      )
    })
  })

  test('click en Ver legajo navega al perfil del profesional', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: respuestaConResultados })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Admin Test')

    await user.click(screen.getByRole('button', { name: /ver legajo/i }))

    expect(await screen.findByText('Pantalla Perfil')).toBeInTheDocument()
  })
})
