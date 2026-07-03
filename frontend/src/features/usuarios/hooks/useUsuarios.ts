import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { buscarUsuarios, type BuscarUsuariosParams } from '../api/buscarUsuarios'

export function useUsuarios(params: BuscarUsuariosParams) {
  return useQuery({
    queryKey: ['usuarios', params],
    queryFn: () => buscarUsuarios(api, params),
    staleTime: 1000 * 60 * 2,
  })
}
