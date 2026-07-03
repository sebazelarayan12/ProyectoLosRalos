import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { obtenerProfesional, type ProfesionalDetalle } from './obtenerProfesional'

describe('obtenerProfesional', () => {
  test('hace GET a /profesionales/{id} y retorna el detalle', async () => {
    const detalle: ProfesionalDetalle = {
      id: 'abc-123',
      apellido: 'Perez',
      nombre: 'Sara Gisela',
      dni: '12345678',
      cuil: '20-12345678-9',
      fechaNacimiento: '1980-01-01',
      sexo: 'Femenino',
      estadoCivil: 'Soltera',
      domicilio: 'Calle Falsa 123',
      barrio: null,
      localidad: 'Tucuman',
      provincia: 'Tucuman',
      codigoPostal: null,
      telefono: '3811234567',
      email: 'sara@example.com',
      funcion: 'Tec Estadisticas',
      servicio: 'Estadistica',
      nivel: 'Tecnico',
      planta: 'PermanenteEfectivo',
      nroExpediente: '123/2020',
      tipo: 'Administrativo',
      activo: true,
      fechaCreacion: '2026-01-01T00:00:00Z',
      fechaActualizacion: '2026-01-01T00:00:00Z',
      documentos: [],
    }

    const client = {
      get: vi.fn().mockResolvedValue({ data: detalle }),
    } as unknown as AxiosInstance

    const result = await obtenerProfesional(client, 'abc-123')

    expect(client.get).toHaveBeenCalledWith('/profesionales/abc-123')
    expect(result).toEqual(detalle)
  })
})
