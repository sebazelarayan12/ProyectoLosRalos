import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentoCard } from './DocumentoCard'
import type { DocumentoResumen } from '../api/obtenerProfesional'

const documento: DocumentoResumen = {
  id: 'doc-1',
  tipoDocumento: 'DNI',
  nombreOriginal: 'dni_frente.jpg',
  contentType: 'image/jpeg',
  tamanioBytes: 12345,
  fechaCarga: '2026-05-01T10:00:00Z',
}

describe('DocumentoCard', () => {
  test('muestra el tipo de documento y la fecha de carga', () => {
    render(<DocumentoCard documento={documento} onVer={vi.fn()} />)

    expect(screen.getByText('DNI')).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  test('click en la card llama a onVer con el documento', async () => {
    const onVer = vi.fn()
    const user = userEvent.setup()
    render(<DocumentoCard documento={documento} onVer={onVer} />)

    await user.click(screen.getByRole('button'))

    expect(onVer).toHaveBeenCalledWith(documento)
  })
})
