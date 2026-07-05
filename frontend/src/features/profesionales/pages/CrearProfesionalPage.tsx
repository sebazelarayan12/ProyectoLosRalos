import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { ProfesionalForm } from '../components/ProfesionalForm'
import { VolverBusquedaButton } from '../components/VolverBusquedaButton'
import { crearProfesional, type ProfesionalRequestPayload } from '../api/crearProfesional'

export function CrearProfesionalPage() {
  const navigate = useNavigate()

  const handleSubmit = async (payload: ProfesionalRequestPayload) => {
    const detalle = await crearProfesional(api, payload)
    navigate(`/profesionales/${detalle.id}`)
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
