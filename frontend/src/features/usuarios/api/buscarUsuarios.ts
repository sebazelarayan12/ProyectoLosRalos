import type { AxiosInstance } from 'axios'

export type RolUsuario = 'Admin' | 'Administrativo'

export type Usuario = {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
  activo: boolean
  ultimoAcceso: string | null
  fechaCreacion: string
}

export type PaginatedResponse<T> = {
  items: T[]
  porPagina: number
  hasNextPage: boolean
  cursor: string | null
}

export type BuscarUsuariosParams = {
  cursor?: string
  porPagina: number
}

export function buscarUsuarios(
  client: AxiosInstance,
  params: BuscarUsuariosParams,
): Promise<PaginatedResponse<Usuario>> {
  return client.get<PaginatedResponse<Usuario>>('/usuarios', { params }).then((res) => res.data)
}
