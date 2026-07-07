import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { eliminarProfesionalDefinitivo } from './eliminarProfesionalDefinitivo'

describe('eliminarProfesionalDefinitivo', () => {
  test('hace DELETE a /profesionales/{id}/definitivo', async () => {
    const client = { delete: vi.fn().mockResolvedValue({ data: undefined }) } as unknown as AxiosInstance

    await eliminarProfesionalDefinitivo(client, 'p1')

    expect(client.delete).toHaveBeenCalledWith('/profesionales/p1/definitivo')
  })
})
