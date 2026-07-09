import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { EditarProfesionalPage } from './EditarProfesionalPage'
import { api } from '@/lib/api'
import { toast } from 'sonner'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const profesionalDetalle = {
  id: '11111111-1111-1111-1111-111111111111',
  apellido: 'Perez',
  nombre: 'Sara Gisela',
  dni: '12.345.678',
  cuil: '20-12345678-9',
  fechaNacimiento: '1980-01-01',
  sexo: 'Femenino',
  estadoCivil: 'Soltero',
  domicilio: 'Calle Falsa 123',
  barrio: null,
  localidad: 'Tucuman',
  provincia: 'Tucuman',
  codigoPostal: null,
  telefono: null,
  email: null,
  matricula: null,
  cargo: 'Tec Estadisticas',
  areaOperativa: 'Los Ralos',
  tipoEfector: 'Hospital',
  nivel: 'Terciario',
  planta: 'PermanenteEfectivo',
  nroExpediente: '123/2020',
  tipo: 'NoAsistencial',
  activo: true,
  fechaCreacion: '2026-01-01T00:00:00Z',
  fechaActualizacion: '2026-01-01T00:00:00Z',
  documentos: [],
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/profesionales/${profesionalDetalle.id}/editar`]}>
        <Routes>
          <Route path="/profesionales/:id/editar" element={<EditarProfesionalPage />} />
          <Route path="/profesionales/:id" element={<div>Pantalla Perfil</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockGetPorUrl() {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/cargos' || url === '/areas-operativas') return Promise.resolve({ data: [] })
    return Promise.resolve({ data: profesionalDetalle })
  })
}

describe('EditarProfesionalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPorUrl()
  })

  test('precarga los datos actuales del profesional en el formulario', async () => {
    renderPage()

    expect(await screen.findByLabelText(/^apellido$/i)).toHaveValue('Perez')
    expect(screen.getByLabelText(/^dni$/i)).toHaveValue('12.345.678')
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
  })

  test('boton volver navega al perfil del profesional', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByLabelText(/^apellido$/i)

    await user.click(screen.getByRole('link', { name: /volver al perfil/i }))

    expect(await screen.findByText('Pantalla Perfil')).toBeInTheDocument()
  })

  test('al guardar, llama a PATCH /profesionales/{id} y navega al perfil', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { ...profesionalDetalle, cargo: 'Enfermera' } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByLabelText(/^apellido$/i)

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText('Pantalla Perfil')).toBeInTheDocument()
    expect(api.patch).toHaveBeenCalledWith(
      `/profesionales/${profesionalDetalle.id}`,
      expect.objectContaining({ apellido: 'Perez' }),
    )
    expect(toast.success).toHaveBeenCalled()
  }, 15000)

  test('si falla el guardado, muestra un toast de error y no navega', async () => {
    vi.mocked(api.patch).mockRejectedValue({ response: { data: { message: 'El DNI ya esta en uso' } } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByLabelText(/^apellido$/i)

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await screen.findByRole('button', { name: /guardar cambios/i })
    expect(toast.error).toHaveBeenCalledWith('El DNI ya esta en uso')
    expect(screen.queryByText('Pantalla Perfil')).not.toBeInTheDocument()
  }, 15000)
})
