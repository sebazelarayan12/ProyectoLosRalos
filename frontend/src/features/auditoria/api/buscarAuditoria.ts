import type { AxiosInstance } from 'axios'

export type AuditLogEntry = {
  id: string
  usuarioId: string | null
  nombreUsuario: string | null
  accion: string
  profesionalId: string | null
  detalleExtra: string | null
  timestamp: string
  ipOrigen: string | null
}

export type PaginatedResponse<T> = {
  items: T[]
  porPagina: number
  hasNextPage: boolean
  cursor: string | null
}

export type BuscarAuditoriaParams = {
  usuarioId?: string
  profesionalId?: string
  desde?: string
  hasta?: string
  cursor?: string
  porPagina: number
}

export function buscarAuditoria(
  client: AxiosInstance,
  params: BuscarAuditoriaParams,
): Promise<PaginatedResponse<AuditLogEntry>> {
  return client.get<PaginatedResponse<AuditLogEntry>>('/audit', { params }).then((res) => res.data)
}
