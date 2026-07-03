import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { crearUsuario, type CrearUsuarioPayload } from './crearUsuario'
import type { Usuario } from './buscarUsuarios'

const payload: CrearUsuarioPayload = {
  nombre: 'Juan Perez',
  email: 'juan@test.com',
  password: 'password123',
  rol: 'Visor',
}

describe('crearUsuario', () => {
  test('hace POST a /usuarios con el payload y retorna el usuario creado', async () => {
    const usuario = { id: 'u1', ...payload, activo: true, ultimoAcceso: null, fechaCreacion: '2026-01-01T00:00:00Z' } as unknown as Usuario
    const client = { post: vi.fn().mockResolvedValue({ data: usuario }) } as unknown as AxiosInstance

    const result = await crearUsuario(client, payload)

    expect(client.post).toHaveBeenCalledWith('/usuarios', payload)
    expect(result).toEqual(usuario)
  })
})
