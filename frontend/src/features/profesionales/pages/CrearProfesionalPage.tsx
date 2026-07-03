import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { ProfesionalForm } from '../components/ProfesionalForm'
import { crearProfesional, type ProfesionalRequestPayload } from '../api/crearProfesional'

export function CrearProfesionalPage() {
  const navigate = useNavigate()

  const handleSubmit = async (payload: ProfesionalRequestPayload) => {
    const detalle = await crearProfesional(api, payload)
    navigate(`/profesionales/${detalle.id}`)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">Nuevo profesional</h1>
      <ProfesionalForm modo="crear" onSubmit={handleSubmit} />
    </div>
  )
}
