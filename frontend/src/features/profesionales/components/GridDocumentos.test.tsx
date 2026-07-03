import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GridDocumentos } from './GridDocumentos'
import type { DocumentoResumen } from '../api/obtenerProfesional'

const documentos: DocumentoResumen[] = [
  {
    id: 'doc-1',
    tipoDocumento: 'DNI',
    nombreOriginal: 'dni.jpg',
    contentType: 'image/jpeg',
    tamanioBytes: 100,
    fechaCarga: '2026-05-01T10:00:00Z',
  },
  {
    id: 'doc-2',
    tipoDocumento: 'Titulo',
    nombreOriginal: 'titulo.pdf',
    contentType: 'application/pdf',
    tamanioBytes: 200,
    fechaCarga: '2026-05-02T10:00:00Z',
  },
]

describe('GridDocumentos', () => {
  test('muestra una card por cada documento cargado', () => {
    render(<GridDocumentos documentos={documentos} onVerDocumento={vi.fn()} />)

    expect(screen.getByText('DNI')).toBeInTheDocument()
    expect(screen.getByText('Titulo')).toBeInTheDocument()
  })

  test('muestra mensaje cuando no hay documentos cargados', () => {
    render(<GridDocumentos documentos={[]} onVerDocumento={vi.fn()} />)

    expect(screen.getByText('Sin documentos cargados')).toBeInTheDocument()
  })

  test('click en una card llama a onVerDocumento con ese documento', async () => {
    const onVerDocumento = vi.fn()
    const user = userEvent.setup()
    render(<GridDocumentos documentos={documentos} onVerDocumento={onVerDocumento} />)

    await user.click(screen.getAllByRole('button')[0])

    expect(onVerDocumento).toHaveBeenCalledWith(documentos[0])
  })
})
