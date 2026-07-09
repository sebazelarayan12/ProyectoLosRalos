import type { AxiosInstance } from 'axios'

export type TipoLegajo = 'Asistencial' | 'NoAsistencial' | 'CP'
export type Planta = 'Transitorio' | 'PermanenteInterino' | 'PermanenteEfectivo'
export type EstadoProfesionalFiltro = 'Activos' | 'Inactivos' | 'Todos'

export type BuscarProfesionalesParams = {
  busqueda?: string
  tipo?: TipoLegajo
  planta?: Planta
  estado?: EstadoProfesionalFiltro
  cursor?: string
  porPagina: number
}

export type ProfesionalResumen = {
  id: string
  apellido: string
  nombre: string
  dni: string
  cuil: string | null
  matricula: string | null
  cargo: string
  nroExpediente: string | null
  tipo: TipoLegajo | null
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
