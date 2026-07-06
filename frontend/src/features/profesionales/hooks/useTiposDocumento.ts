import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { listarTiposDocumento } from '../api/listarTiposDocumento'

export function useTiposDocumento() {
  return useQuery({
    queryKey: ['tipos-documento'],
    queryFn: () => listarTiposDocumento(api),
    staleTime: 1000 * 60 * 5,
  })
}
