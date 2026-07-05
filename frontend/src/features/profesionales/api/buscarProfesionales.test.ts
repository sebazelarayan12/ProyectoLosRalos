import { describe, test, expect } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { createApiClient } from '@/lib/api/client'
import { buscarProfesionales } from './buscarProfesionales'

function buildClient() {
  const client = createApiClient({ getToken: () => null, onUnauthorized: () => {} })
  const mock = new MockAdapter(client)
  return { client, mock }
}

describe('buscarProfesionales', () => {
  test('envia busqueda, tipo, planta, cursor y porPagina como query params', async () => {
    const { client, mock } = buildClient()
    mock.onGet('/profesionales').reply((config) => {
      expect(config.params).toEqual({
        busqueda: 'Perez',
        tipo: 'Asistencial',
        planta: 'PermanenteEfectivo',
        cursor: 'abc',
        porPagina: 20,
      })
      return [200, { items: [], porPagina: 20, hasNextPage: false, cursor: null }]
    })

    await buscarProfesionales(client, {
      busqueda: 'Perez',
      tipo: 'Asistencial',
      planta: 'PermanenteEfectivo',
      cursor: 'abc',
      porPagina: 20,
    })
  })

  test('omite params undefined', async () => {
    const { client, mock } = buildClient()
    mock.onGet('/profesionales').reply((config) => {
      expect(config.params).toEqual({ porPagina: 20 })
      return [200, { items: [], porPagina: 20, hasNextPage: false, cursor: null }]
    })

    await buscarProfesionales(client, { porPagina: 20 })
  })

  test('retorna la respuesta paginada tal cual la manda la API', async () => {
    const { client, mock } = buildClient()
    const respuesta = {
      items: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          apellido: 'Perez',
          nombre: 'Ana',
          funcion: 'Enfermera',
          servicio: 'Guardia',
          nroExpediente: '123/2020',
          tipo: 'Asistencial',
        },
      ],
      porPagina: 20,
      hasNextPage: false,
      cursor: null,
    }
    mock.onGet('/profesionales').reply(200, respuesta)

    const result = await buscarProfesionales(client, { porPagina: 20 })

    expect(result).toEqual(respuesta)
  })
})
