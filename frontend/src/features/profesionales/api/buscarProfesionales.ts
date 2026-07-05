import type { AxiosInstance } from 'axios'

export type TipoLegajo = 'Asistencial' | 'Administrativo'
export type Planta = 'Transitorio' | 'PermanenteInterino' | 'PermanenteEfectivo'

export type BuscarProfesionalesParams = {
  busqueda?: string
  tipo?: TipoLegajo
  planta?: Planta
  cursor?: string
  porPagina: number
}

export type ProfesionalResumen = {
  id: string
  apellido: string
  nombre: string
  funcion: string
  servicio: string | null
  nroExpediente: string | null
  tipo: TipoLegajo
}

export type PaginatedResponse<T> = {
  items: T[]
  porPagina: number
  hasNextPage: boolean
  cursor: string | null
}

export function buscarProfesionales(
  client: AxiosInstance,
  params: BuscarProfesionalesParams,
): Promise<PaginatedResponse<ProfesionalResumen>> {
  return client
    .get<PaginatedResponse<ProfesionalResumen>>('/profesionales', { params })
    .then((res) => res.data)
}
