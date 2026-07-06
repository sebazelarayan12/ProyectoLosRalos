import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { extraerMensajeError } from '@/lib/extraerMensajeError'
import { UsuarioForm } from '../components/UsuarioForm'
import { crearUsuario, type CrearUsuarioPayload } from '../api/crearUsuario'

export function CrearUsuarioPage() {
  const navigate = useNavigate()

  const handleSubmit = async (payload: CrearUsuarioPayload) => {
    try {
      await crearUsuario(api, payload)
      toast.success('Usuario creado correctamente')
      navigate('/usuarios')
    } catch (error) {
      toast.error(extraerMensajeError(error, 'No se pudo crear el usuario'))
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/usuarios" className="hover:text-foreground hover:underline">
            Gestion de usuarios
          </Link>
          <ChevronRight className="size-3.5 opacity-50" />
          <span className="font-medium text-foreground">Nuevo usuario</span>
        </div>
        <h1 className="font-heading text-xl font-semibold sm:text-2xl">Nuevo usuario</h1>
        <p className="text-sm text-muted-foreground">Se envia el acceso con una contrasenia temporal.</p>
      </div>
      <UsuarioForm onSubmit={handleSubmit} />
    </div>
  )
}
