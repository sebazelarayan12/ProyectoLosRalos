import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VisorDocumentoModal } from './VisorDocumentoModal'
import { useArchivoDocumento } from '../hooks/useArchivoDocumento'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { DocumentoResumen } from '../api/obtenerProfesional'

vi.mock('../hooks/useArchivoDocumento')
vi.mock('@/hooks/useMediaQuery')

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

    render(<VisorDocumentoModal documento={null} open={false} onOpenChange={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('muestra estado de carga mientras isLoading', () => {
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: undefined, isLoading: true, isError: false } as never)

    render(<VisorDocumentoModal documento={documentoImagen} open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  test('muestra mensaje de error si isError', () => {
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: undefined, isLoading: false, isError: true } as never)

    render(<VisorDocumentoModal documento={documentoImagen} open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument()
  })

  test('renderiza img para imagenes', () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)

    render(<VisorDocumentoModal documento={documentoImagen} open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:mock-url')
  })

  test('renderiza iframe para pdf en desktop', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)
    vi.mocked(useMediaQuery).mockReturnValue(false)

    render(<VisorDocumentoModal documento={documentoPdf} open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByTitle('Documento')).toHaveAttribute('src', 'blob:mock-url')
  })

  test('renderiza link de descarga en vez de iframe para pdf en mobile', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)
    vi.mocked(useMediaQuery).mockReturnValue(true)

    render(<VisorDocumentoModal documento={documentoPdf} open={true} onOpenChange={vi.fn()} />)

    expect(screen.queryByTitle('Documento')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /abrir pdf/i })).toHaveAttribute('href', 'blob:mock-url')
  })

  test('boton Descargar tiene href y download con el nombre original', () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    vi.mocked(useArchivoDocumento).mockReturnValue({ data: blob, isLoading: false, isError: false } as never)

    render(<VisorDocumentoModal documento={documentoImagen} open={true} onOpenChange={vi.fn()} />)

    const link = screen.getByRole('link', { name: /descargar/i })
    expect(link).toHaveAttribute('href', 'blob:mock-url')
    expect(link).toHaveAttribute('download', 'dni.jpg')
  })
})
