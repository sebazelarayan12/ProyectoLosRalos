import type { AxiosInstance } from 'axios'
import type { DocumentoResumen } from './obtenerProfesional'

export function subirDocumento(
  client: AxiosInstance,
  profesionalId: string,
  archivo: File,
  tipoDocumentoNombre: string,
): Promise<DocumentoResumen> {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('tipoDocumentoNombre', tipoDocumentoNombre)

  return client
    .post<DocumentoResumen>(`/profesionales/${profesionalId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}
