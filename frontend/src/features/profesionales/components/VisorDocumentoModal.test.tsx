import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { VisorDocumentoModal } from './VisorDocumentoModal'
import { useArchivoDocumento } from '../hooks/useArchivoDocumento'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { eliminarDocumento } from '../api/eliminarDocumento'
import type { DocumentoResumen } from '../api/obtenerProfesional'
import { toast } from 'sonner'

vi.mock('../hooks/useArchivoDocumento')
vi.mock('@/hooks/useMediaQuery')
vi.mock('../api/eliminarDocumento')
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const documentoImagen: DocumentoResumen = {
  id: 'doc-1',
  tipoDocumento: 'DNI',
  nombreOriginal: 'dni.jpg',
  contentType: 'image/jpeg',
  tamanioBytes: 100,
  fechaCarga: '2026-05-01T10:00:00Z',
}

const documentoPdf: DocumentoResumen = {
  id: 'doc-2',
  tipoDocumento: 'Titulo',
  nombreOriginal: 'titulo.pdf',
  contentType: 'application/pdf',
  tamanioBytes: 200,
  fechaCarga: '2026-05-02T10:00:00Z',
}

describe('VisorDocumentoModal', () => {
  beforeEach(() => {
    vi.mocked(useMediaQuery).mockReturnValue(false)
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('no renderiza nada si documento es null', () => {
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never)

    render(<VisorDocumentoModal documento={null} open={false} onOpenChange={vi.fn()} />, { wrapper })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('muestra estado de carga mientras isLoading', () => {
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: undefined, isLoading: true, isError: false } as never)

    render(<VisorDocumentoModal documento={documentoImagen} open={true} onOpenChange={vi.fn()} />, { wrapper })

    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  test('muestra mensaje de error si isError', () => {
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: undefined, isLoading: false, isError: true } as never)

    render(<VisorDocumentoModal documento={documentoImagen} open={true} onOpenChange={vi.fn()} />, { wrapper })

    expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument()
  })

  test('renderiza img para imagenes', () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)

    render(<VisorDocumentoModal documento={documentoImagen} open={true} onOpenChange={vi.fn()} />, { wrapper })

    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:mock-url')
  })

  test('renderiza iframe para pdf en desktop', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)
    vi.mocked(useMediaQuery).mockReturnValue(false)

    render(<VisorDocumentoModal documento={documentoPdf} open={true} onOpenChange={vi.fn()} />, { wrapper })

    expect(screen.getByTitle('Documento')).toHaveAttribute('src', 'blob:mock-url')
  })

  test('renderiza link de descarga en vez de iframe para pdf en mobile', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)
    vi.mocked(useMediaQuery).mockReturnValue(true)

    render(<VisorDocumentoModal documento={documentoPdf} open={true} onOpenChange={vi.fn()} />, { wrapper })

    expect(screen.queryByTitle('Documento')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /abrir pdf/i })).toHaveAttribute('href', 'blob:mock-url')
  })

  test('boton Descargar tiene href y download con el nombre original', () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)

    render(<VisorDocumentoModal documento={documentoImagen} open={true} onOpenChange={vi.fn()} />, { wrapper })

    const link = screen.getByRole('link', { name: /descargar/i })
    expect(link).toHaveAttribute('href', 'blob:mock-url')
    expect(link).toHaveAttribute('download', 'dni.jpg')
  })

  test('no muestra boton Eliminar si puedeEscribir es false', () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)

    render(
      <VisorDocumentoModal documento={documentoImagen} open={true} onOpenChange={vi.fn()} puedeEscribir={false} />,
      { wrapper },
    )

    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument()
  })

  test('confirmar Eliminar llama a eliminarDocumento y a onEliminado', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)
    vi.mocked(eliminarDocumento).mockResolvedValue(undefined)
    const onEliminado = vi.fn()
    const user = userEvent.setup()

    render(
      <VisorDocumentoModal
        documento={documentoImagen}
        open={true}
        onOpenChange={vi.fn()}
        puedeEscribir={true}
        onEliminado={onEliminado}
      />,
      { wrapper },
    )

    await user.click(screen.getByRole('button', { name: /eliminar/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    await waitFor(() => expect(eliminarDocumento).toHaveBeenCalledWith(expect.anything(), 'doc-1'))
    expect(onEliminado).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Documento eliminado')
  })

  test('si eliminar falla, muestra un toast de error y no cierra el modal', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)
    vi.mocked(eliminarDocumento).mockRejectedValue(new Error('fail'))
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <VisorDocumentoModal
        documento={documentoImagen}
        open={true}
        onOpenChange={onOpenChange}
        puedeEscribir={true}
      />,
      { wrapper },
    )

    await user.click(screen.getByRole('button', { name: /eliminar/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No se pudo eliminar el documento'))
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
