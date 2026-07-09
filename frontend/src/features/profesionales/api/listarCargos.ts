import type { AxiosInstance } from 'axios'

export type Cargo = {
  id: string
  nombre: string
}

export function listarCargos(client: AxiosInstance): Promise<Cargo[]> {
  return client.get<Cargo[]>('/cargos').then((res) => res.data)
}
