import type { AxiosInstance } from 'axios'

export function activarUsuario(client: AxiosInstance, id: string): Promise<void> {
  return client.patch(`/usuarios/${id}/activar`).then(() => undefined)
}
