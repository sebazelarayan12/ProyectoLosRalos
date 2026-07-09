import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { crearProfesional, type ProfesionalRequestPayload } from './crearProfesional'
import type { ProfesionalDetalle } from './obtenerProfesional'

const payload: ProfesionalRequestPayload = {
  apellido: 'Gomez',
  nombre: 'Luis',
  dni: '11.111.111',
  cuil: '20-11111111-0',
  fechaNacimiento: '1990-01-01',
  sexo: 'Masculino',
  estadoCivil: 'Soltero',
  domicilio: 'Calle Falsa 123',
  barrio: null,
  localidad: 'San Miguel de Tucuman',
  provincia: 'Tucuman',
  codigoPostal: null,
  telefono: null,
  email: null,
  matricula: null,
  cargo: 'Chofer',
  areaOperativa: 'Los Ralos',
  tipoEfector: 'Hospital',
  nivel: 'Secundario',
  planta: 'Transitorio',
  nroExpediente: null,
  tipo: 'NoAsistencial',
}

describe('crearProfesional', () => {
  test('hace POST a /profesionales con el payload y retorna el detalle creado', async () => {
    const detalle = { id: 'nuevo-1', ...payload } as unknown as ProfesionalDetalle
    const client = {
      post: vi.fn().mockResolvedValue({ data: detalle }),
    } as unknown as AxiosInstance

    const result = await crearProfesional(client, payload)

    expect(client.post).toHaveBeenCalledWith('/profesionales', payload)
    expect(result).toEqual(detalle)
  })
})
