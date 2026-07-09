import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { listarCargos } from '../api/listarCargos'

export function useCargos() {
  return useQuery({
    queryKey: ['cargos'],
    queryFn: () => listarCargos(api),
    staleTime: 1000 * 60 * 5,
  })
}
