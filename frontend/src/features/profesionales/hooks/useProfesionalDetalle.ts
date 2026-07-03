import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { obtenerProfesional } from '../api/obtenerProfesional'

export function useProfesionalDetalle(id: string) {
  return useQuery({
    queryKey: ['profesional', id],
    queryFn: () => obtenerProfesional(api, id),
    staleTime: 1000 * 60 * 2,
  })
}
