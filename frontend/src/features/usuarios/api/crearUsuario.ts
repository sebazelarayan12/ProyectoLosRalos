import type { AxiosInstance } from 'axios'
import type { RolUsuario, Usuario } from './buscarUsuarios'

export type CrearUsuarioPayload = {
  nombre: string
  email: string
  password: string
  rol: RolUsuario
}

export function crearUsuario(client: AxiosInstance, payload: CrearUsuarioPayload): Promise<Usuario> {
  return client.post<Usuario>('/usuarios', payload).then((res) => res.data)
}
