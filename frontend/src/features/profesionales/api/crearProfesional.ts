import type { AxiosInstance } from 'axios'
import type { ProfesionalDetalle } from './obtenerProfesional'

export type Sexo = 'Masculino' | 'Femenino' | 'Otro'
export type EstadoCivil = 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo' | 'Otro'
export type Nivel = 'Secundario' | 'Terciario' | 'Universitario'

export type ProfesionalRequestPayload = {
  apellido: string
  nombre: string
  dni: string
  cuil: string
  fechaNacimiento: string
  sexo: Sexo
  estadoCivil: EstadoCivil
  domicilio: string
  barrio: string | null
  localidad: string
  provincia: string
  codigoPostal: string | null
  telefono: string | null
  email: string | null
  matricula: string | null
  cargo: string
  areaOperativa: string
  tipoEfector: 'Hospital' | 'CAPS'
  nivel: Nivel
  planta: ProfesionalDetalle['planta']
  nroExpediente: string | null
  tipo: ProfesionalDetalle['tipo']
}

export function crearProfesional(
  client: AxiosInstance,
  payload: ProfesionalRequestPayload,
): Promise<ProfesionalDetalle> {
  return client.post<ProfesionalDetalle>('/profesionales', payload).then((res) => res.data)
}
