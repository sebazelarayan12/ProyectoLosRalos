import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { TablaUsuarios } from './TablaUsuarios'
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

const usuarioActivo: Usuario = {
  id: 'u1',
  nombre: 'Juan Perez',
  email: 'juan@test.com',
  rol: 'Visor',
  activo: true,
  ultimoAcceso: null,
  fechaCreacion: '2026-01-01T00:00:00Z',
}

describe('TablaUsuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('click en Editar llama a onEditar con el usuario', async () => {
    const onEditar = vi.fn()
    const user = userEvent.setup()
    render(
      <TablaUsuarios usuarios={[usuarioActivo]} onEditar={onEditar} onResetearPassword={vi.fn()} />,
      { wrapper },
    )

    await user.click(screen.getByRole('button', { name: /editar/i }))

    expect(onEditar).toHaveBeenCalledWith(usuarioActivo)
  })

  test('click en Resetear password llama a onResetearPassword con el usuario', async () => {
    const onResetearPassword = vi.fn()
    const user = userEvent.setup()
    render(
      <TablaUsuarios usuarios={[usuarioActivo]} onEditar={vi.fn()} onResetearPassword={onResetearPassword} />,
      { wrapper },
    )

    await user.click(screen.getByRole('button', { name: /resetear password/i }))

    expect(onResetearPassword).toHaveBeenCalledWith(usuarioActivo)
  })

  test('desactivar usuario activo llama a PATCH /usuarios/{id}/desactivar tras confirmar', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: undefined })
    const user = userEvent.setup()
    render(
      <TablaUsuarios usuarios={[usuarioActivo]} onEditar={vi.fn()} onResetearPassword={vi.fn()} />,
      { wrapper },
    )

    await user.click(screen.getByRole('button', { name: /^desactivar$/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    expect(api.patch).toHaveBeenCalledWith('/usuarios/u1/desactivar')
    expect(toast.success).toHaveBeenCalledWith('Usuario desactivado')
  })

  test('activar usuario inactivo llama a PATCH /usuarios/{id}/activar tras confirmar', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: undefined })
    const user = userEvent.setup()
    const usuarioInactivo: Usuario = { ...usuarioActivo, activo: false }
    render(
      <TablaUsuarios usuarios={[usuarioInactivo]} onEditar={vi.fn()} onResetearPassword={vi.fn()} />,
      { wrapper },
    )

    await user.click(screen.getByRole('button', { name: /^activar$/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    expect(api.patch).toHaveBeenCalledWith('/usuarios/u1/activar')
    expect(toast.success).toHaveBeenCalledWith('Usuario activado')
  })

  test('muestra un toast con el mensaje de error del backend si la desactivacion falla (ej: autodesactivacion)', async () => {
    vi.mocked(api.patch).mockRejectedValue({
      response: { data: { message: 'No podes desactivarte a vos mismo' } },
    })
    const user = userEvent.setup()
    render(
      <TablaUsuarios usuarios={[usuarioActivo]} onEditar={vi.fn()} onResetearPassword={vi.fn()} />,
      { wrapper },
    )

    await user.click(screen.getByRole('button', { name: /^desactivar$/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    await screen.findByRole('button', { name: /confirmar/i })
    expect(toast.error).toHaveBeenCalledWith('No podes desactivarte a vos mismo')
  })
})
