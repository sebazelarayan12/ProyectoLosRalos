import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { PerfilProfesionalPage } from './PerfilProfesionalPage'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const profesionalDetalle = {
  id: '11111111-1111-1111-1111-111111111111',
  apellido: 'Perez',
  nombre: 'Sara Gisela',
  dni: '12345678',
  cuil: '20-12345678-9',
  fechaNacimiento: '1980-01-01',
  sexo: 'Femenino',
  estadoCivil: 'Soltera',
  domicilio: 'Calle Falsa 123',
  barrio: null,
  localidad: 'Tucuman',
  provincia: 'Tucuman',
  codigoPostal: null,
  telefono: '3811234567',
  email: 'sara@example.com',
  funcion: 'Tec Estadisticas',
  servicio: 'Estadistica',
  nivel: 'Tecnico',
  planta: 'PermanenteEfectivo',
  nroExpediente: '123/2020',
  tipo: 'Administrativo',
  activo: true,
  fechaCreacion: '2026-01-01T00:00:00Z',
  fechaActualizacion: '2026-01-01T00:00:00Z',
  documentos: [
    {
      id: 'doc-1',
      tipoDocumento: 'DNI',
      nombreOriginal: 'dni.jpg',
      contentType: 'image/jpeg',
      tamanioBytes: 100,
      fechaCarga: '2026-05-01T10:00:00Z',
    },
  ],
}

function setUsuario(rol: 'Admin' | 'Visor') {
  localStorage.setItem('auth_token', 'fake-token')
  localStorage.setItem('auth_usuario', JSON.stringify({ nombre: 'Ana', rol }))
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/profesionales/11111111-1111-1111-1111-111111111111']}>
          <Routes>
            <Route path="/profesionales/:id" element={<PerfilProfesionalPage />} />
            <Route path="/profesionales/:id/editar" element={<div>Pantalla Editar</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('PerfilProfesionalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  test('muestra datos del profesional y sus documentos', async () => {
    setUsuario('Visor')
    vi.mocked(api.get).mockResolvedValue({ data: profesionalDetalle })

    renderPage()

    expect(await screen.findByText('Perez, Sara Gisela')).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getAllByText('DNI').length).toBeGreaterThan(0)
  })

  test('boton Editar visible solo para admin', async () => {
    setUsuario('Admin')
    vi.mocked(api.get).mockResolvedValue({ data: profesionalDetalle })

    renderPage()

    expect(await screen.findByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  test('click en Editar navega a la pantalla de edicion', async () => {
    setUsuario('Admin')
    vi.mocked(api.get).mockResolvedValue({ data: profesionalDetalle })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /editar/i }))

    expect(await screen.findByText('Pantalla Editar')).toBeInTheDocument()
  })

  test('boton Editar no aparece para visor', async () => {
    setUsuario('Visor')
    vi.mocked(api.get).mockResolvedValue({ data: profesionalDetalle })

    renderPage()

    await screen.findByText('Perez, Sara Gisela')
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
  })

  test('zona de subir documento visible solo para admin', async () => {
    setUsuario('Admin')
    vi.mocked(api.get).mockResolvedValue({ data: profesionalDetalle })

    renderPage()

    expect(await screen.findByLabelText(/tipo de documento/i)).toBeInTheDocument()
  })

  test('zona de subir documento no aparece para visor', async () => {
    setUsuario('Visor')
    vi.mocked(api.get).mockResolvedValue({ data: profesionalDetalle })

    renderPage()

    await screen.findByText('Perez, Sara Gisela')
    expect(screen.queryByLabelText(/tipo de documento/i)).not.toBeInTheDocument()
  })

  test('boton Eliminar del visor de documentos aparece solo para admin', async () => {
    setUsuario('Admin')
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/file')) {
        return Promise.resolve({ data: new Blob(['x'], { type: 'image/jpeg' }) })
      }
      return Promise.resolve({ data: profesionalDetalle })
    })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /DNI/i }))

    expect(await screen.findByRole('button', { name: /eliminar/i })).toBeInTheDocument()
  })

  test('muestra mensaje de no encontrado en 404', async () => {
    setUsuario('Visor')
    vi.mocked(api.get).mockRejectedValue({ response: { status: 404 } })

    renderPage()

    expect(await screen.findByText(/profesional no encontrado/i)).toBeInTheDocument()
  })
})
