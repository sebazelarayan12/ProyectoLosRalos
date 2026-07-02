import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { BusquedaProfesionalesPage } from './BusquedaProfesionalesPage'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

const respuestaConResultados = {
  items: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      apellido: 'Perez',
      nombre: 'Ana',
      funcion: 'Enfermera',
      servicio: 'Guardia',
      nroExpediente: '1/2020',
      tipo: 'Asistencial',
    },
  ],
  porPagina: 20,
  hasNextPage: false,
  cursor: null,
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
        <MemoryRouter initialEntries={['/profesionales']}>
          <Routes>
            <Route path="/profesionales" element={<BusquedaProfesionalesPage />} />
            <Route path="/profesionales/:id" element={<div>Pantalla Perfil</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('BusquedaProfesionalesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  test('muestra los resultados devueltos por la API', async () => {
    setUsuario('Visor')
    vi.mocked(api.get).mockResolvedValue({ data: respuestaConResultados })

    renderPage()

    expect(await screen.findByText('Perez, Ana')).toBeInTheDocument()
  })

  test('sin resultados, muestra el mensaje de vacio', async () => {
    setUsuario('Visor')
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [], porPagina: 20, hasNextPage: false, cursor: null },
    })

    renderPage()

    expect(
      await screen.findByText(/no se encontraron profesionales con ese apellido/i),
    ).toBeInTheDocument()
  })

  test('boton Nuevo profesional visible solo para admin', async () => {
    setUsuario('Admin')
    vi.mocked(api.get).mockResolvedValue({ data: respuestaConResultados })
    renderPage()
    await screen.findByText('Perez, Ana')

    expect(screen.getByRole('button', { name: /nuevo profesional/i })).toBeInTheDocument()
  })

  test('boton Nuevo profesional no aparece para visor', async () => {
    setUsuario('Visor')
    vi.mocked(api.get).mockResolvedValue({ data: respuestaConResultados })
    renderPage()
    await screen.findByText('Perez, Ana')

    expect(screen.queryByRole('button', { name: /nuevo profesional/i })).not.toBeInTheDocument()
  })

  test('escribir en el buscador filtra por apellido tras el debounce', async () => {
    setUsuario('Visor')
    vi.mocked(api.get).mockResolvedValue({ data: respuestaConResultados })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Perez, Ana')

    await user.type(screen.getByLabelText(/apellido/i), 'Perez')

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/profesionales',
        expect.objectContaining({ params: expect.objectContaining({ apellido: 'Perez' }) }),
      )
    })
  })

  test('click en Ver legajo navega al perfil del profesional', async () => {
    setUsuario('Visor')
    vi.mocked(api.get).mockResolvedValue({ data: respuestaConResultados })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Perez, Ana')

    await user.click(screen.getByRole('button', { name: /ver legajo/i }))

    expect(await screen.findByText('Pantalla Perfil')).toBeInTheDocument()
  })
})
