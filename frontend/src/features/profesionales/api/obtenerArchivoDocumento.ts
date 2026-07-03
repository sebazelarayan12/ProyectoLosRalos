import type { AxiosInstance } from 'axios'

export function obtenerArchivoDocumento(client: AxiosInstance, id: string): Promise<Blob> {
  return client
    .get<Blob>(`/documentos/${id}/file`, { responseType: 'blob' })
    .then((res) => res.data)
}
