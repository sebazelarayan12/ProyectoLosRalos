import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { SubirDocumentoDropzone } from './SubirDocumentoDropzone'
import { api } from '@/lib/api'
import { toast } from 'sonner'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

async function elegirTipo(user: ReturnType<typeof userEvent.setup>, texto: string) {
  await user.click(screen.getByRole('combobox'))
  await user.type(screen.getByPlaceholderText(/buscar o crear tipo/i), texto)
  await user.click(await screen.findByText(new RegExp(`crear tipo: ${texto}`, 'i')))
}

describe('SubirDocumentoDropzone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: [] })
  })

  test('boton y dropzone quedan deshabilitados mientras no hay tipo elegido', async () => {
    render(<SubirDocumentoDropzone profesionalId="prof-1" onSubido={vi.fn()} />, { wrapper })

    expect(screen.getByRole('button', { name: /subir documento/i })).toBeDisabled()
    expect(screen.getByLabelText(/seleccionar archivo/i)).toBeDisabled()
  })

  test('boton y dropzone se habilitan al elegir un tipo', async () => {
    const user = userEvent.setup()
    render(<SubirDocumentoDropzone profesionalId="prof-1" onSubido={vi.fn()} />, { wrapper })

    await elegirTipo(user, 'DNI')

    expect(screen.getByRole('button', { name: /subir documento/i })).toBeEnabled()
    expect(screen.getByLabelText(/seleccionar archivo/i)).toBeEnabled()
  })

  test('sube el archivo con el tipo elegido y notifica onSubido', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'doc-1' } })
    const onSubido = vi.fn()
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' })

    render(<SubirDocumentoDropzone profesionalId="prof-1" onSubido={onSubido} />, { wrapper })

    await elegirTipo(user, 'DNI')
    await user.upload(screen.getByLabelText(/seleccionar archivo/i), archivo)

    await waitFor(() => expect(onSubido).toHaveBeenCalled())
    expect(api.post).toHaveBeenCalledWith(
      '/profesionales/prof-1/documentos',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  })

  test('al subir con exito, limpia el tipo elegido y muestra un toast', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'doc-1' } })
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' })

    render(<SubirDocumentoDropzone profesionalId="prof-1" onSubido={vi.fn()} />, { wrapper })

    await elegirTipo(user, 'DNI')
    await user.upload(screen.getByLabelText(/seleccionar archivo/i), archivo)

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /subir documento/i })).toBeDisabled()
    expect(screen.getByRole('combobox')).toHaveTextContent(/ej: dni, titulo, certificado/i)
  })

  test('muestra error si la subida falla', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('fail'))
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' })

    render(<SubirDocumentoDropzone profesionalId="prof-1" onSubido={vi.fn()} />, { wrapper })

    await elegirTipo(user, 'DNI')
    await user.upload(screen.getByLabelText(/seleccionar archivo/i), archivo)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No se pudo subir el documento'))
  })
})
