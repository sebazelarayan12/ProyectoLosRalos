import type { AxiosInstance } from 'axios'

export type TipoDocumento = {
  id: string
  nombre: string
}

export function listarTiposDocumento(client: AxiosInstance): Promise<TipoDocumento[]> {
  return client.get<TipoDocumento[]>('/tipos-documento').then((res) => res.data)
}
