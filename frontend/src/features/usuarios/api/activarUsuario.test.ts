import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { activarUsuario } from './activarUsuario'

describe('activarUsuario', () => {
  test('hace PATCH a /usuarios/{id}/activar', async () => {
    const client = { patch: vi.fn().mockResolvedValue({ data: undefined }) } as unknown as AxiosInstance

    await activarUsuario(client, 'u1')

    expect(client.patch).toHaveBeenCalledWith('/usuarios/u1/activar')
  })
})
