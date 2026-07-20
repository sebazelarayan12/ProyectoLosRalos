import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { extraerMensajeError } from '@/lib/extraerMensajeError'
import { useProfesionalDetalle } from '../hooks/useProfesionalDetalle'
import { ProfesionalForm, type ProfesionalFormValues } from '../components/ProfesionalForm'
import { VolverBusquedaButton } from '../components/VolverBusquedaButton'
import { editarProfesional } from '../api/editarProfesional'
import type { ProfesionalRequestPayload } from '../api/crearProfesional'
import type { ProfesionalDetalle } from '../api/obtenerProfesional'

function aValoresFormulario(detalle: ProfesionalDetalle): ProfesionalFormValues {
  return {
    apellido: detalle.apellido,
    nombre: detalle.nombre,
    dni: detalle.dni,
    cuil: detalle.cuil ?? '',
    fechaNacimiento: detalle.fechaNacimiento,
    sexo: detalle.sexo as ProfesionalFormValues['sexo'],
    estadoCivil: (detalle.estadoCivil ?? '') as ProfesionalFormValues['estadoCivil'],
    domicilio: detalle.domicilio ?? '',
    barrio: detalle.barrio ?? '',
    localidad: detalle.localidad,
    provincia: detalle.provincia,
    codigoPostal: detalle.codigoPostal ?? '',
    telefono: detalle.telefono ?? '',
    email: detalle.email ?? '',
    matricula: detalle.matricula ?? '',
    cargo: detalle.cargo,
    areaOperativa: detalle.areaOperativa,
    tipoEfector: detalle.tipoEfector as ProfesionalFormValues['tipoEfector'],
    nivel: (detalle.nivel ?? '') as ProfesionalFormValues['nivel'],
    planta: detalle.planta ?? '',
    nroExpediente: detalle.nroExpediente ?? '',
    tipo: detalle.tipo ?? '',
  }
}

export function EditarProfesionalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
    try {
      await editarProfesional(api, id!, payload)
      queryClient.invalidateQueries({ queryKey: ['profesional', id] })
      queryClient.invalidateQueries({ queryKey: ['profesionales'] })
      toast.success('Cambios guardados correctamente')
      navigate(`/profesionales/${id}`)
    } catch (error) {
      toast.error(extraerMensajeError(error, 'No se pudo guardar los cambios'))
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <VolverBusquedaButton to={`/profesionales/${id}`} label="Volver al perfil" />
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/profesionales" className="hover:text-foreground hover:underline">
            Busqueda de profesionales
          </Link>
          <ChevronRight className="size-3.5 opacity-50" />
          <Link to={`/profesionales/${id}`} className="hover:text-foreground hover:underline">
            {profesional.apellido}, {profesional.nombre}
          </Link>
          <ChevronRight className="size-3.5 opacity-50" />
          <span className="font-medium text-foreground">Editar</span>
        </div>
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Editar legajo</span>
        <h1 className="font-heading text-xl font-semibold sm:text-2xl">
          {profesional.apellido}, {profesional.nombre}
        </h1>
        <p className="max-w-lg text-sm text-muted-foreground">
          {profesional.nroExpediente ?? '-'} - Modifica los datos necesarios y guarda los cambios.
        </p>
      </div>
      <ProfesionalForm
        modo="editar"
        valoresIniciales={aValoresFormulario(profesional)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
