import type { AxiosInstance } from 'axios'

export function reactivarProfesional(client: AxiosInstance, id: string): Promise<void> {
  return client.patch(`/profesionales/${id}/reactivar`).then(() => undefined)
}
