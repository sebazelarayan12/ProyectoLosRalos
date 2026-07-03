import type { AxiosInstance } from 'axios'

export function eliminarDocumento(client: AxiosInstance, id: string): Promise<void> {
  return client.delete(`/documentos/${id}`).then(() => undefined)
}
