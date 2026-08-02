import type { AxiosInstance } from 'axios'
import type { DocumentoResumen } from './obtenerProfesional'

export type SegmentoParaEnviar = {
  paginaInicio: number
  paginaFin: number
  tipoDocumentoNombre: string
}

export function subirLoteDocumentos(
  client: AxiosInstance,
  profesionalId: string,
  archivo: File,
  segmentos: SegmentoParaEnviar[],
): Promise<DocumentoResumen[]> {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('segmentos', JSON.stringify(segmentos))

  return client
    .post<DocumentoResumen[]>(`/profesionales/${profesionalId}/documentos/lote`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}
