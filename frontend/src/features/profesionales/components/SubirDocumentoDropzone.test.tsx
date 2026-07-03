import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { SubirDocumentoDropzone } from './SubirDocumentoDropzone'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('SubirDocumentoDropzone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('sube el archivo con el tipo indicado y notifica onSubido', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'doc-1' } })
    const onSubido = vi.fn()
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' })

    render(<SubirDocumentoDropzone profesionalId="prof-1" onSubido={onSubido} />, { wrapper })

    await user.type(screen.getByLabelText(/tipo de documento/i), 'DNI')
    await user.upload(screen.getByLabelText(/seleccionar archivo/i), archivo)

    await waitFor(() => expect(onSubido).toHaveBeenCalled())
    expect(api.post).toHaveBeenCalledWith(
      '/profesionales/prof-1/documentos',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  })

  test('no sube si falta el tipo de documento', async () => {
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' })

    render(<SubirDocumentoDropzone profesionalId="prof-1" onSubido={vi.fn()} />, { wrapper })

    await user.upload(screen.getByLabelText(/seleccionar archivo/i), archivo)

    expect(await screen.findByText(/indica el tipo de documento/i)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  test('muestra error si la subida falla', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('fail'))
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' })

    render(<SubirDocumentoDropzone profesionalId="prof-1" onSubido={vi.fn()} />, { wrapper })

    await user.type(screen.getByLabelText(/tipo de documento/i), 'DNI')
    await user.upload(screen.getByLabelText(/seleccionar archivo/i), archivo)

    expect(await screen.findByText(/no se pudo subir el documento/i)).toBeInTheDocument()
  })
})
