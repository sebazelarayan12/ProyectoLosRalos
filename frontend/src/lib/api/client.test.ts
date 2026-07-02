import { describe, test, expect, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { createApiClient } from './client'

describe('createApiClient', () => {
  test('agrega Authorization header con el token cuando hay uno', async () => {
    const client = createApiClient({ getToken: () => 'fake-token', onUnauthorized: vi.fn() })
    const mock = new MockAdapter(client)
    mock.onGet('/algo').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer fake-token')
      return [200, {}]
    })

    await client.get('/algo')
  })

  test('sin token, no agrega Authorization header', async () => {
    const client = createApiClient({ getToken: () => null, onUnauthorized: vi.fn() })
    const mock = new MockAdapter(client)
    mock.onGet('/algo').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined()
      return [200, {}]
    })

    await client.get('/algo')
  })

  test('respuesta 401 dispara onUnauthorized', async () => {
    const onUnauthorized = vi.fn()
    const client = createApiClient({ getToken: () => 'fake-token', onUnauthorized })
    const mock = new MockAdapter(client)
    mock.onGet('/protegido').reply(401)

    await expect(client.get('/protegido')).rejects.toBeDefined()
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })
})
