import type { AxiosInstance } from 'axios'

export function resetearPassword(
  client: AxiosInstance,
  id: string,
  nuevaPassword: string,
): Promise<void> {
  return client.post(`/usuarios/${id}/reset-password`, { nuevaPassword }).then(() => undefined)
}
