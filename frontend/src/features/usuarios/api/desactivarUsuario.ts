import type { AxiosInstance } from 'axios'

export function desactivarUsuario(client: AxiosInstance, id: string): Promise<void> {
  return client.patch(`/usuarios/${id}/desactivar`).then(() => undefined)
}
