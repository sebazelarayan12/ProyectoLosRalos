import type { AxiosInstance } from 'axios'

export function desactivarProfesional(client: AxiosInstance, id: string): Promise<void> {
  return client.delete(`/profesionales/${id}`).then(() => undefined)
}
