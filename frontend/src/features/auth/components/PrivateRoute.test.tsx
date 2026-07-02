import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { PrivateRoute } from './PrivateRoute'

function renderWithRoute(initialToken?: string) {
  if (initialToken) localStorage.setItem('auth_token', initialToken)

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Pantalla Login</div>} />
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div>Pantalla Privada</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('sin token, redirige a /login', () => {
    renderWithRoute()

    expect(screen.getByText('Pantalla Login')).toBeInTheDocument()
    expect(screen.queryByText('Pantalla Privada')).not.toBeInTheDocument()
  })

  test('con token, renderiza la ruta protegida', () => {
    renderWithRoute('fake-jwt-token')

    expect(screen.getByText('Pantalla Privada')).toBeInTheDocument()
    expect(screen.queryByText('Pantalla Login')).not.toBeInTheDocument()
  })
})
