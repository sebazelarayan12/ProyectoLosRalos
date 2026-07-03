import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { subirDocumento } from './subirDocumento'
import type { DocumentoResumen } from './obtenerProfesional'

describe('subirDocumento', () => {
  test('hace POST multipart a /profesionales/{id}/documentos con el archivo y tipo', async () => {
    const documento: DocumentoResumen = {
      id: 'doc-1',
      tipoDocumento: 'DNI',
      nombreOriginal: 'dni.jpg',
      contentType: 'image/jpeg',
      tamanioBytes: 100,
      fechaCarga: '2026-05-01T10:00:00Z',
    }
    const client = {
      post: vi.fn().mockResolvedValue({ data: documento }),
    } as unknown as AxiosInstance
    const archivo = new File(['contenido'], 'dni.jpg', { type: 'image/jpeg' })

    const result = await subirDocumento(client, 'prof-1', archivo, 'DNI')

    expect(client.post).toHaveBeenCalledWith(
      '/profesionales/prof-1/documentos',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    const formData = vi.mocked(client.post).mock.calls[0][1] as FormData
    expect(formData.get('archivo')).toBe(archivo)
    expect(formData.get('tipoDocumentoNombre')).toBe('DNI')
    expect(result).toEqual(documento)
  })
})
