import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { editarUsuario, type EditarUsuarioPayload } from './editarUsuario'
import type { Usuario } from './buscarUsuarios'

describe('editarUsuario', () => {
  test('hace PATCH a /usuarios/{id} con el payload y retorna el usuario editado', async () => {
    const payload: EditarUsuarioPayload = { nombre: 'Nuevo Nombre' }
    const usuario = { id: 'u1', nombre: 'Nuevo Nombre' } as unknown as Usuario
    const client = { patch: vi.fn().mockResolvedValue({ data: usuario }) } as unknown as AxiosInstance

    const result = await editarUsuario(client, 'u1', payload)

    expect(client.patch).toHaveBeenCalledWith('/usuarios/u1', payload)
    expect(result).toEqual(usuario)
  })
})
