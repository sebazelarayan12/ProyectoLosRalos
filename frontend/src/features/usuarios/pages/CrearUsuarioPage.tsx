import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { UsuarioForm } from '../components/UsuarioForm'
import { crearUsuario, type CrearUsuarioPayload } from '../api/crearUsuario'

export function CrearUsuarioPage() {
  const navigate = useNavigate()

  const handleSubmit = async (payload: CrearUsuarioPayload) => {
    await crearUsuario(api, payload)
    navigate('/usuarios')
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">Nuevo usuario</h1>
      <UsuarioForm onSubmit={handleSubmit} />
    </div>
  )
}
