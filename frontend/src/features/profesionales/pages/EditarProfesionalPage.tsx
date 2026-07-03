import { useNavigate, useParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useProfesionalDetalle } from '../hooks/useProfesionalDetalle'
import { ProfesionalForm, type ProfesionalFormValues } from '../components/ProfesionalForm'
import { editarProfesional } from '../api/editarProfesional'
import type { ProfesionalRequestPayload } from '../api/crearProfesional'
import type { ProfesionalDetalle } from '../api/obtenerProfesional'

function aValoresFormulario(detalle: ProfesionalDetalle): ProfesionalFormValues {
  return {
    apellido: detalle.apellido,
    nombre: detalle.nombre,
    dni: detalle.dni,
    cuil: detalle.cuil,
    fechaNacimiento: detalle.fechaNacimiento,
    sexo: detalle.sexo as ProfesionalFormValues['sexo'],
    estadoCivil: detalle.estadoCivil as ProfesionalFormValues['estadoCivil'],
    domicilio: detalle.domicilio,
    barrio: detalle.barrio ?? '',
    localidad: detalle.localidad,
    provincia: detalle.provincia,
    codigoPostal: detalle.codigoPostal ?? '',
    telefono: detalle.telefono ?? '',
    email: detalle.email ?? '',
    funcion: detalle.funcion,
    servicio: detalle.servicio ?? '',
    nivel: detalle.nivel as ProfesionalFormValues['nivel'],
    planta: detalle.planta,
    nroExpediente: detalle.nroExpediente ?? '',
    tipo: detalle.tipo,
  }
}

export function EditarProfesionalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: profesional, isLoading, isError } = useProfesionalDetalle(id!)

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !profesional) {
    return <p className="p-4">No se pudo cargar el profesional</p>
  }

  const handleSubmit = async (payload: ProfesionalRequestPayload) => {
    await editarProfesional(api, id!, payload)
    navigate(`/profesionales/${id}`)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">
        Editar profesional — {profesional.apellido}, {profesional.nombre}
      </h1>
      <ProfesionalForm
        modo="editar"
        valoresIniciales={aValoresFormulario(profesional)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
