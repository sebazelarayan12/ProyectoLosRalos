import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { desactivarUsuario } from './desactivarUsuario'

describe('desactivarUsuario', () => {
  test('hace PATCH a /usuarios/{id}/desactivar', async () => {
    const client = { patch: vi.fn().mockResolvedValue({ data: undefined }) } as unknown as AxiosInstance

    await desactivarUsuario(client, 'u1')

    expect(client.patch).toHaveBeenCalledWith('/usuarios/u1/desactivar')
  })
})
