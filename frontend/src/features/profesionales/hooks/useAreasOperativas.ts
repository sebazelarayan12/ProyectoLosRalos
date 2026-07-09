import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { listarAreasOperativas } from '../api/listarAreasOperativas'

export function useAreasOperativas() {
  return useQuery({
    queryKey: ['areas-operativas'],
    queryFn: () => listarAreasOperativas(api),
    staleTime: 1000 * 60 * 5,
  })
}
