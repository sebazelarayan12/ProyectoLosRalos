import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { listarTiposDocumento, type TipoDocumento } from './listarTiposDocumento'

describe('listarTiposDocumento', () => {
  test('hace GET a /tipos-documento y retorna la lista', async () => {
    const tipos: TipoDocumento[] = [
      { id: 'tipo-1', nombre: 'DNI' },
      { id: 'tipo-2', nombre: 'Titulo' },
    ]

    const client = {
      get: vi.fn().mockResolvedValue({ data: tipos }),
    } as unknown as AxiosInstance

    const result = await listarTiposDocumento(client)

    expect(client.get).toHaveBeenCalledWith('/tipos-documento')
    expect(result).toEqual(tipos)
  })
})
