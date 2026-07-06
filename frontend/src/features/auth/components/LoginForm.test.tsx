import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { LoginForm } from './LoginForm'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}))

function renderForm() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </AuthProvider>,
  )
}

function renderFormConRutas() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={<p>Pantalla dashboard</p>} />
          <Route path="/profesionales" element={<p>Pantalla busqueda profesionales</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  test('muestra errores de validacion con campos vacios', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByText(/email.*requerido/i)).toBeInTheDocument()
    expect(await screen.findByText(/contrasenia.*requerida|password.*requerido|contraseña.*requerida/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  test('submit valido llama a la API con email y password', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { token: 'jwt-123', nombre: 'Ana', rol: 'Admin', expiraEn: '2026-07-03T00:00:00Z' },
    })
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'ana@hospital.gob.ar')
    await user.type(screen.getByLabelText(/contrasenia|contraseña|password/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'ana@hospital.gob.ar',
        password: 'secreta123',
      })
    })
  })

  test('login con rol Admin redirige a /dashboard', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { token: 'jwt-123', nombre: 'Ana', rol: 'Admin', expiraEn: '2026-07-03T00:00:00Z' },
    })
    const user = userEvent.setup()
    renderFormConRutas()

    await user.type(screen.getByLabelText(/email/i), 'ana@hospital.gob.ar')
    await user.type(screen.getByLabelText(/contrasenia|contraseña|password/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByText('Pantalla dashboard')).toBeInTheDocument()
  })

  test('login con rol Administrativo redirige a /profesionales', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { token: 'jwt-456', nombre: 'Juan', rol: 'Administrativo', expiraEn: '2026-07-03T00:00:00Z' },
    })
    const user = userEvent.setup()
    renderFormConRutas()

    await user.type(screen.getByLabelText(/email/i), 'juan@hospital.gob.ar')
    await user.type(screen.getByLabelText(/contrasenia|contraseña|password/i), 'secreta123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByText('Pantalla busqueda profesionales')).toBeInTheDocument()
  })

  test('credenciales invalidas muestran mensaje de error', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 401 } })
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'ana@hospital.gob.ar')
    await user.type(screen.getByLabelText(/contrasenia|contraseña|password/i), 'malapass')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByText(/credenciales inv/i)).toBeInTheDocument()
  })
})
