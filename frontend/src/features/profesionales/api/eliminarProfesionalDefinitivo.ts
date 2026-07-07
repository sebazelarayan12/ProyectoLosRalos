import type { AxiosInstance } from 'axios'

export function eliminarProfesionalDefinitivo(client: AxiosInstance, id: string): Promise<void> {
  return client.delete(`/profesionales/${id}/definitivo`).then(() => undefined)
}
