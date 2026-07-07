import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { desactivarProfesional } from './desactivarProfesional'

describe('desactivarProfesional', () => {
  test('hace DELETE a /profesionales/{id}', async () => {
    const client = { delete: vi.fn().mockResolvedValue({ data: undefined }) } as unknown as AxiosInstance

    await desactivarProfesional(client, 'p1')

    expect(client.delete).toHaveBeenCalledWith('/profesionales/p1')
  })
})
