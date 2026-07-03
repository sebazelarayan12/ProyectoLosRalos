import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { resetearPassword } from './resetearPassword'

describe('resetearPassword', () => {
  test('hace POST a /usuarios/{id}/reset-password con la nueva password', async () => {
    const client = { post: vi.fn().mockResolvedValue({ data: undefined }) } as unknown as AxiosInstance

    await resetearPassword(client, 'u1', 'nuevaPassword1')

    expect(client.post).toHaveBeenCalledWith('/usuarios/u1/reset-password', { nuevaPassword: 'nuevaPassword1' })
  })
})
