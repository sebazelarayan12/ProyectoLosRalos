import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { buscarProfesionales, type BuscarProfesionalesParams } from '../api/buscarProfesionales'

export function useProfesionales(params: BuscarProfesionalesParams) {
  return useQuery({
    queryKey: ['profesionales', params],
    queryFn: () => buscarProfesionales(api, params),
    staleTime: 1000 * 60 * 2,
  })
}
