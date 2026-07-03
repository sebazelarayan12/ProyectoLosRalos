import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { obtenerArchivoDocumento } from '../api/obtenerArchivoDocumento'

export function useArchivoDocumento(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['documento-archivo', id],
    queryFn: () => obtenerArchivoDocumento(api, id!),
    enabled: enabled && !!id,
  })
}
