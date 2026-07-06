import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { EditarProfesionalPage } from './EditarProfesionalPage'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
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
  funcion: 'Tec Estadisticas',
  servicio: null,
  nivel: 'Terciario',
  planta: 'PermanenteEfectivo',
  nroExpediente: '123/2020',
  tipo: 'Administrativo',
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

describe('EditarProfesionalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('precarga los datos actuales del profesional en el formulario', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profesionalDetalle })
    renderPage()

    expect(await screen.findByLabelText(/^apellido$/i)).toHaveValue('Perez')
    expect(screen.getByLabelText(/^dni$/i)).toHaveValue('12.345.678')
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
  })

  test('boton volver navega al perfil del profesional', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profesionalDetalle })
    const user = userEvent.setup()
    renderPage()
    await screen.findByLabelText(/^apellido$/i)

    await user.click(screen.getByRole('link', { name: /volver al perfil/i }))

    expect(await screen.findByText('Pantalla Perfil')).toBeInTheDocument()
  })

  test('al guardar, llama a PATCH /profesionales/{id} y navega al perfil', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profesionalDetalle })
    vi.mocked(api.patch).mockResolvedValue({ data: { ...profesionalDetalle, funcion: 'Enfermera' } })
    const user = userEvent.setup()
    renderPage()
    await screen.findByLabelText(/^apellido$/i)

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText('Pantalla Perfil')).toBeInTheDocument()
    expect(api.patch).toHaveBeenCalledWith(
      `/profesionales/${profesionalDetalle.id}`,
      expect.objectContaining({ apellido: 'Perez' }),
    )
  }, 15000)
})
