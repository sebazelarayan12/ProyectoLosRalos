import type { AxiosInstance } from 'axios'
import type { ProfesionalRequestPayload } from './crearProfesional'
import type { ProfesionalDetalle } from './obtenerProfesional'

export function editarProfesional(
  client: AxiosInstance,
  id: string,
  payload: ProfesionalRequestPayload,
): Promise<ProfesionalDetalle> {
  return client.patch<ProfesionalDetalle>(`/profesionales/${id}`, payload).then((res) => res.data)
}
