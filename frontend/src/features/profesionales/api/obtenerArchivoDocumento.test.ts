import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { obtenerArchivoDocumento } from './obtenerArchivoDocumento'

describe('obtenerArchivoDocumento', () => {
  test('hace GET a /documentos/{id}/file con responseType blob', async () => {
    const blob = new Blob(['contenido'], { type: 'application/pdf' })
    const client = {
      get: vi.fn().mockResolvedValue({ data: blob }),
    } as unknown as AxiosInstance

    const result = await obtenerArchivoDocumento(client, 'doc-1')

    expect(client.get).toHaveBeenCalledWith('/documentos/doc-1/file', { responseType: 'blob' })
    expect(result).toBe(blob)
  })
})
