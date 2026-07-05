import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { buscarAuditoria, type BuscarAuditoriaParams } from '../api/buscarAuditoria'

export function useAuditoria(params: BuscarAuditoriaParams) {
  return useQuery({
    queryKey: ['auditoria', params],
    queryFn: () => buscarAuditoria(api, params),
    staleTime: 1000 * 60 * 2,
  })
}
