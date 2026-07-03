import type { AxiosInstance } from 'axios'
import type { RolUsuario, Usuario } from './buscarUsuarios'

export type EditarUsuarioPayload = {
  nombre?: string
  email?: string
  rol?: RolUsuario
}

export function editarUsuario(
  client: AxiosInstance,
  id: string,
  payload: EditarUsuarioPayload,
): Promise<Usuario> {
  return client.patch<Usuario>(`/usuarios/${id}`, payload).then((res) => res.data)
}
