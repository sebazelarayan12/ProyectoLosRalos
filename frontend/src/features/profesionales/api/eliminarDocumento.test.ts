import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { eliminarDocumento } from './eliminarDocumento'

describe('eliminarDocumento', () => {
  test('hace DELETE a /documentos/{id}', async () => {
    const client = {
      delete: vi.fn().mockResolvedValue({}),
    } as unknown as AxiosInstance

    await eliminarDocumento(client, 'doc-1')

    expect(client.delete).toHaveBeenCalledWith('/documentos/doc-1')
  })
})
