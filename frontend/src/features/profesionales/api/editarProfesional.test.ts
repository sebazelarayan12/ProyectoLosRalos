import { describe, test, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { editarProfesional } from './editarProfesional'
import type { ProfesionalRequestPayload } from './crearProfesional'
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

describe('editarProfesional', () => {
  test('hace PATCH a /profesionales/{id} con el payload y retorna el detalle actualizado', async () => {
    const detalle = { id: 'abc-1', ...payload } as unknown as ProfesionalDetalle
    const client = {
      patch: vi.fn().mockResolvedValue({ data: detalle }),
    } as unknown as AxiosInstance

    const result = await editarProfesional(client, 'abc-1', payload)

    expect(client.patch).toHaveBeenCalledWith('/profesionales/abc-1', payload)
    expect(result).toEqual(detalle)
  })
})
