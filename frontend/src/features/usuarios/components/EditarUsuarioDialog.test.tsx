import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { EditarUsuarioDialog } from './EditarUsuarioDialog'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Usuario } from '../api/buscarUsuarios'

vi.mock('@/lib/api', () => ({
  api: { patch: vi.fn() },
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
  rol: 'Administrativo',
  activo: true,
  ultimoAcceso: null,
  fechaCreacion: '2026-01-01T00:00:00Z',
}

describe('EditarUsuarioDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('no renderiza contenido si usuario es null', () => {
    render(<EditarUsuarioDialog usuario={null} open={false} onOpenChange={vi.fn()} />, { wrapper })
    expect(screen.queryByText(/editar usuario/i)).not.toBeInTheDocument()
  })

  test('precarga los valores del usuario', () => {
    render(<EditarUsuarioDialog usuario={usuario} open={true} onOpenChange={vi.fn()} />, { wrapper })

    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('Juan Perez')
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('juan@test.com')
  })

  test('al guardar, llama a PATCH /usuarios/{id} con los cambios', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { ...usuario, nombre: 'Nuevo Nombre' } })
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<EditarUsuarioDialog usuario={usuario} open={true} onOpenChange={onOpenChange} />, { wrapper })

    await user.clear(screen.getByLabelText(/^nombre$/i))
    await user.type(screen.getByLabelText(/^nombre$/i), 'Nuevo Nombre')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(api.patch).toHaveBeenCalledWith('/usuarios/u1', {
      nombre: 'Nuevo Nombre',
      email: 'juan@test.com',
      rol: 'Administrativo',
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(toast.success).toHaveBeenCalled()
  })

  test('muestra un toast con el mensaje de error del backend si falla (ej: cambiar propio rol)', async () => {
    vi.mocked(api.patch).mockRejectedValue({
      response: { data: { message: 'No podes cambiar tu propio rol' } },
    })
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<EditarUsuarioDialog usuario={usuario} open={true} onOpenChange={onOpenChange} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No podes cambiar tu propio rol'))
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
