import { describe, test, expect, vi } from 'vitest'
import { subirLoteDocumentos } from './subirLoteDocumentos'

describe('subirLoteDocumentos', () => {
  test('manda el archivo y los segmentos como multipart', async () => {
    const post = vi.fn().mockResolvedValue({ data: [{ id: 'doc-1' }, { id: 'doc-2' }] })
    const client = { post } as unknown as Parameters<typeof subirLoteDocumentos>[0]
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })
    const segmentos = [
      { paginaInicio: 1, paginaFin: 2, tipoDocumentoNombre: 'Titulo' },
      { paginaInicio: 3, paginaFin: 4, tipoDocumentoNombre: 'Dni Frente' },
    ]

    const resultado = await subirLoteDocumentos(client, 'prof-1', archivo, segmentos)

    expect(resultado).toHaveLength(2)
    expect(post).toHaveBeenCalledWith(
      '/profesionales/prof-1/documentos/lote',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    const formData = post.mock.calls[0][1] as FormData
    expect(formData.get('archivo')).toBe(archivo)
    expect(formData.get('segmentos')).toBe(JSON.stringify(segmentos))
  })
})
