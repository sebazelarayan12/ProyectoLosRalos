import type { AxiosInstance } from 'axios'
import type { TipoLegajo, Planta } from './buscarProfesionales'

export type DocumentoResumen = {
  id: string
  tipoDocumento: string
  nombreOriginal: string
  contentType: string
  tamanioBytes: number
  fechaCarga: string
}

export type ProfesionalDetalle = {
  id: string
  apellido: string
  nombre: string
  dni: string
  cuil: string | null
  fechaNacimiento: string
  sexo: string
  estadoCivil: string | null
  domicilio: string | null
  barrio: string | null
  localidad: string
  provincia: string
  codigoPostal: string | null
  telefono: string | null
  email: string | null
  matricula: string | null
  cargo: string
  areaOperativa: string
  tipoEfector: string
  nivel: string | null
  planta: Planta | null
  nroExpediente: string | null
  tipo: TipoLegajo | null
  activo: boolean
  fechaCreacion: string
  fechaActualizacion: string
  documentos: DocumentoResumen[]
}

export function obtenerProfesional(
  client: AxiosInstance,
  id: string,
): Promise<ProfesionalDetalle> {
  return client.get<ProfesionalDetalle>(`/profesionales/${id}`).then((res) => res.data)
}
