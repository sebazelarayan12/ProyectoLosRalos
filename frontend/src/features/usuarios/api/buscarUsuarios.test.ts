import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { buscarUsuarios, type Usuario, type PaginatedResponse } from './buscarUsuarios'

describe('buscarUsuarios', () => {
  test('hace GET a /usuarios con los params y retorna la pagina', async () => {
    const usuario: Usuario = {
      id: 'u1',
      nombre: 'Juan Perez',
      email: 'juan@test.com',
      rol: 'Administrativo',
      activo: true,
      ultimoAcceso: null,
      fechaCreacion: '2026-01-01T00:00:00Z',
    }
    const response: PaginatedResponse<Usuario> = {
      items: [usuario],
      porPagina: 20,
      hasNextPage: false,
      cursor: null,
    }
    const client = { get: vi.fn().mockResolvedValue({ data: response }) } as unknown as AxiosInstance

    const result = await buscarUsuarios(client, { porPagina: 20 })

    expect(client.get).toHaveBeenCalledWith('/usuarios', { params: { porPagina: 20 } })
    expect(result).toEqual(response)
  })
})
