import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { AUTH_TOKEN_KEY, AUTH_USUARIO_KEY } from '@/lib/authStorage'

function renderLayout() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/profesionales']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/profesionales" element={<p>Pantalla busqueda</p>} />
            <Route path="/dashboard" element={<p>Pantalla dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'fake-token')
    localStorage.setItem(AUTH_USUARIO_KEY, JSON.stringify({ nombre: 'Ana', rol: 'Admin' }))
  })

  test('el titulo Legajos Digitales es un link al dashboard', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('link', { name: /legajos digitales/i }))

    expect(await screen.findByText('Pantalla dashboard')).toBeInTheDocument()
  })
})
