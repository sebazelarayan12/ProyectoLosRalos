import type { AxiosInstance } from 'axios'

export type AreaOperativa = {
  id: string
  nombre: string
}

export function listarAreasOperativas(client: AxiosInstance): Promise<AreaOperativa[]> {
  return client.get<AreaOperativa[]>('/areas-operativas').then((res) => res.data)
}
