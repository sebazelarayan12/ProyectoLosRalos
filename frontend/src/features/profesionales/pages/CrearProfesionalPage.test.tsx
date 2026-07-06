import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { CrearProfesionalPage } from './CrearProfesionalPage'
import { api } from '@/lib/api'
import { toast } from 'sonner'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/profesionales/nuevo']}>
        <Routes>
          <Route path="/profesionales/nuevo" element={<CrearProfesionalPage />} />
          <Route path="/profesionales/:id" element={<div>Pantalla Perfil</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function completarYEnviar(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^apellido$/i), 'Gomez')
  await user.type(screen.getByLabelText(/^nombre$/i), 'Luis')
  await user.type(screen.getByLabelText(/^dni$/i), '11.111.111')
  await user.type(screen.getByLabelText(/^cuil$/i), '20-11111111-0')
  await user.type(screen.getByLabelText(/fecha de nacimiento/i), '1990-01-01')
  await user.click(screen.getByRole('combobox', { name: /^sexo$/i }))
  await user.click(await screen.findByRole('option', { name: 'Masculino' }))
  await user.click(screen.getByRole('combobox', { name: /estado civil/i }))
  await user.click(await screen.findByRole('option', { name: 'Soltero' }))
  await user.click(screen.getByRole('button', { name: /^domicilio/i }))
  await user.type(screen.getByLabelText(/^domicilio$/i), 'Calle Falsa 123')
  await user.type(screen.getByLabelText(/^localidad$/i), 'San Miguel de Tucuman')
  await user.click(screen.getByRole('button', { name: /datos laborales/i }))
  await user.type(screen.getByLabelText(/^funcion$/i), 'Chofer')
  await user.click(screen.getByRole('combobox', { name: /^nivel$/i }))
  await user.click(await screen.findByRole('option', { name: 'Secundario' }))
  await user.click(screen.getByRole('combobox', { name: /^planta$/i }))
  await user.click(await screen.findByRole('option', { name: 'Transitorio' }))
  await user.click(screen.getByRole('combobox', { name: /tipo de legajo/i }))
  await user.click(await screen.findByRole('option', { name: 'Administrativo' }))

  await user.click(screen.getByRole('button', { name: /crear profesional/i }))
}

describe('CrearProfesionalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('al enviar el formulario, llama a POST /profesionales y navega al perfil creado', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'nuevo-1' } })
    const user = userEvent.setup()
    renderPage()

    await completarYEnviar(user)

    expect(await screen.findByText('Pantalla Perfil')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/profesionales', expect.objectContaining({ apellido: 'Gomez' }))
    expect(toast.success).toHaveBeenCalled()
  }, 15000)

  test('si falla la creacion, muestra un toast de error y no navega', async () => {
    vi.mocked(api.post).mockRejectedValue({ response: { data: { message: 'El DNI ya esta registrado' } } })
    const user = userEvent.setup()
    renderPage()

    await completarYEnviar(user)

    expect(await screen.findByText(/nuevo profesional/i)).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith('El DNI ya esta registrado')
  }, 15000)
})
