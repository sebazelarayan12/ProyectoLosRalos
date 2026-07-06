import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ResetPasswordDialog } from './ResetPasswordDialog'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Usuario } from '../api/buscarUsuarios'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const usuario: Usuario = {
  id: 'u1',
  nombre: 'Juan Perez',
  email: 'juan@test.com',
  rol: 'Visor',
  activo: true,
  ultimoAcceso: null,
  fechaCreacion: '2026-01-01T00:00:00Z',
}

describe('ResetPasswordDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('no renderiza contenido si usuario es null', () => {
    render(<ResetPasswordDialog usuario={null} open={false} onOpenChange={vi.fn()} />, { wrapper })
    expect(screen.queryByText(/resetear password/i)).not.toBeInTheDocument()
  })

  test('password invalida muestra error de validacion y no llama al backend', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordDialog usuario={usuario} open={true} onOpenChange={vi.fn()} />, { wrapper })

    await user.type(screen.getByLabelText(/nueva password temporal/i), 'corta')
    await user.click(screen.getByRole('button', { name: /^resetear password$/i }))

    expect(await screen.findByText(/minimo 8 caracteres/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  test('con password valida, llama a POST reset-password y cierra el dialog', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined })
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<ResetPasswordDialog usuario={usuario} open={true} onOpenChange={onOpenChange} />, { wrapper })

    await user.type(screen.getByLabelText(/nueva password temporal/i), 'nuevaPassword1')
    await user.click(screen.getByRole('button', { name: /^resetear password$/i }))

    expect(api.post).toHaveBeenCalledWith('/usuarios/u1/reset-password', {
      nuevaPassword: 'nuevaPassword1',
    })
    await screen.findByRole('button', { name: /^resetear password$/i })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(toast.success).toHaveBeenCalled()
  })

  test('si falla, muestra un toast de error y no cierra el dialog', async () => {
    vi.mocked(api.post).mockRejectedValue({ response: { data: { message: 'Usuario no encontrado' } } })
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<ResetPasswordDialog usuario={usuario} open={true} onOpenChange={onOpenChange} />, { wrapper })

    await user.type(screen.getByLabelText(/nueva password temporal/i), 'nuevaPassword1')
    await user.click(screen.getByRole('button', { name: /^resetear password$/i }))

    await screen.findByRole('button', { name: /^resetear password$/i })
    expect(toast.error).toHaveBeenCalledWith('Usuario no encontrado')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
