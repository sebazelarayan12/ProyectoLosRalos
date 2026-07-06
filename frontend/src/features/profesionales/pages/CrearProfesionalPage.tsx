import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { extraerMensajeError } from '@/lib/extraerMensajeError'
import { ProfesionalForm } from '../components/ProfesionalForm'
import { VolverBusquedaButton } from '../components/VolverBusquedaButton'
import { crearProfesional, type ProfesionalRequestPayload } from '../api/crearProfesional'

export function CrearProfesionalPage() {
  const navigate = useNavigate()

  const handleSubmit = async (payload: ProfesionalRequestPayload) => {
    try {
      const detalle = await crearProfesional(api, payload)
      toast.success('Profesional creado correctamente')
      navigate(`/profesionales/${detalle.id}`)
    } catch (error) {
      toast.error(extraerMensajeError(error, 'No se pudo crear el profesional'))
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <VolverBusquedaButton />
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Nuevo legajo</span>
        <h1 className="font-heading text-xl font-semibold sm:text-2xl">Nuevo profesional</h1>
        <p className="max-w-lg text-sm text-muted-foreground">
          Completa los datos del legajo. Los campos marcados como opcionales pueden quedar vacios.
        </p>
      </div>
      <ProfesionalForm modo="crear" onSubmit={handleSubmit} />
    </div>
  )
}
