import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { reactivarProfesional } from './reactivarProfesional'

describe('reactivarProfesional', () => {
  test('hace PATCH a /profesionales/{id}/reactivar', async () => {
    const client = { patch: vi.fn().mockResolvedValue({ data: undefined }) } as unknown as AxiosInstance

    await reactivarProfesional(client, 'p1')

    expect(client.patch).toHaveBeenCalledWith('/profesionales/p1/reactivar')
  })
})
