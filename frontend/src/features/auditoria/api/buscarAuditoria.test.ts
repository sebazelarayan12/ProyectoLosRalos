import { describe, test, expect } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { createApiClient } from '@/lib/api/client'
import { buscarAuditoria } from './buscarAuditoria'

function buildClient() {
  const client = createApiClient({ getToken: () => null, onUnauthorized: () => {} })
  const mock = new MockAdapter(client)
  return { client, mock }
}

describe('buscarAuditoria', () => {
  test('envia desde, hasta, cursor y porPagina como query params', async () => {
    const { client, mock } = buildClient()
    mock.onGet('/audit').reply((config) => {
      expect(config.params).toEqual({
        desde: '2026-01-01',
        hasta: '2026-01-31',
        cursor: 'abc',
        porPagina: 50,
      })
      return [200, { items: [], porPagina: 50, hasNextPage: false, cursor: null }]
    })

    await buscarAuditoria(client, {
      desde: '2026-01-01',
      hasta: '2026-01-31',
      cursor: 'abc',
      porPagina: 50,
    })
  })

  test('omite params undefined', async () => {
    const { client, mock } = buildClient()
    mock.onGet('/audit').reply((config) => {
      expect(config.params).toEqual({ porPagina: 50 })
      return [200, { items: [], porPagina: 50, hasNextPage: false, cursor: null }]
    })

    await buscarAuditoria(client, { porPagina: 50 })
  })

  test('retorna la respuesta paginada tal cual la manda la API', async () => {
    const { client, mock } = buildClient()
    const respuesta = {
      items: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          usuarioId: '22222222-2222-2222-2222-222222222222',
          nombreUsuario: 'Admin Test',
          accion: 'VerLegajo',
          profesionalId: '33333333-3333-3333-3333-333333333333',
          detalleExtra: null,
          timestamp: '2026-01-15T10:00:00Z',
          ipOrigen: '1.2.3.4',
        },
      ],
      porPagina: 50,
      hasNextPage: false,
      cursor: null,
    }
    mock.onGet('/audit').reply(200, respuesta)

    const result = await buscarAuditoria(client, { porPagina: 50 })

    expect(result).toEqual(respuesta)
  })
})
