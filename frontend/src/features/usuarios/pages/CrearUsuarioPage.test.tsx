import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { CrearUsuarioPage } from './CrearUsuarioPage'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/usuarios/nuevo']}>
        <Routes>
          <Route path="/usuarios/nuevo" element={<CrearUsuarioPage />} />
          <Route path="/usuarios" element={<div>Pantalla Usuarios</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CrearUsuarioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('al enviar el formulario, llama a POST /usuarios y navega a la lista', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'nuevo-1' } })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/^nombre$/i), 'Juan Perez')
    await user.type(screen.getByLabelText(/^email$/i), 'juan@test.com')
    await user.type(screen.getByLabelText(/password temporal/i), 'password123')
    await user.click(screen.getByRole('combobox', { name: /^rol$/i }))
    await user.click(await screen.findByRole('option', { name: 'Visor' }))

    await user.click(screen.getByRole('button', { name: /crear usuario/i }))

    expect(await screen.findByText('Pantalla Usuarios')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/usuarios', {
      nombre: 'Juan Perez',
      email: 'juan@test.com',
      password: 'password123',
      rol: 'Visor',
    })
  })
})
