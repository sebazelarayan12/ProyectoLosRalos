import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { api } from '@/lib/api'
import { extraerMensajeError } from '@/lib/extraerMensajeError'
import { colorTipoLegajo } from '@/lib/tipoLegajoColor'
import { VolverBusquedaButton } from './VolverBusquedaButton'
import { desactivarProfesional } from '../api/desactivarProfesional'
import { reactivarProfesional } from '../api/reactivarProfesional'
import { eliminarProfesionalDefinitivo } from '../api/eliminarProfesionalDefinitivo'

type DesactivarReactivarProfesionalActionProps = {
  id: string
  activo: boolean
}

// Mismo patron que ActivarDesactivarAction (features/usuarios/components/TablaUsuarios.tsx):
// el dialog se controla a mano y solo se cierra en onSuccess, para poder reintentar si falla.
function DesactivarReactivarProfesionalAction({ id, activo }: DesactivarReactivarProfesionalActionProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const desactivarMutation = useMutation({
    mutationFn: () => desactivarProfesional(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesional', id] })
      queryClient.invalidateQueries({ queryKey: ['profesionales'] })
      setOpen(false)
      toast.success('Profesional desactivado')
    },
    onError: (error) => {
      toast.error(extraerMensajeError(error, 'No se pudo completar la accion'))
    },
  })

  const reactivarMutation = useMutation({
    mutationFn: () => reactivarProfesional(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesional', id] })
      queryClient.invalidateQueries({ queryKey: ['profesionales'] })
      setOpen(false)
      toast.success('Profesional reactivado')
    },
    onError: (error) => {
      toast.error(extraerMensajeError(error, 'No se pudo completar la accion'))
    },
  })

  const mutation = activo ? desactivarMutation : reactivarMutation

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Power />
          {activo ? 'Desactivar' : 'Reactivar'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{activo ? 'Desactivar profesional' : 'Reactivar profesional'}</AlertDialogTitle>
          <AlertDialogDescription>
            {activo
              ? 'El legajo queda marcado como inactivo. Se puede reactivar en cualquier momento.'
              : 'El legajo vuelve a aparecer como activo en la busqueda.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function EliminarProfesionalDefinitivoAction({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const eliminarMutation = useMutation({
    mutationFn: () => eliminarProfesionalDefinitivo(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] })
      toast.success('Profesional eliminado')
      navigate('/profesionales')
    },
    onError: (error) => {
      toast.error(extraerMensajeError(error, 'No se pudo eliminar'))
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 />
          Eliminar definitivamente
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar profesional</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. Se borra el legajo completo. Si el profesional tiene
            documentos cargados, hay que eliminarlos primero.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              eliminarMutation.mutate()
            }}
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type PerfilTopbarProps = {
  id: string
  apellido: string
  nombre: string
  nroExpediente: string | null
  puedeEscribir: boolean
  onEditar: () => void
  tipo?: string
  activo?: boolean
}

export function PerfilTopbar({
  id,
  apellido,
  nombre,
  nroExpediente,
  puedeEscribir,
  onEditar,
  tipo,
  activo,
}: PerfilTopbarProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
      <div className="flex min-w-0 flex-col gap-2">
        <VolverBusquedaButton />
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">
            {apellido}, {nombre}
          </h1>
          {activo !== undefined ? (
            <Badge className="gap-1.5 border-success/30 bg-success/10 font-normal text-success">
              <span className="size-1.5 rounded-full bg-success" />
              {activo ? 'Activo' : 'Inactivo'}
            </Badge>
          ) : null}
        </div>
        {nroExpediente || tipo ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {nroExpediente ? (
              <span className="font-medium tabular-nums text-foreground">{nroExpediente}</span>
            ) : null}
            {nroExpediente && tipo ? <span className="size-[3px] rounded-full bg-border" /> : null}
            {tipo ? (
              <Badge variant="secondary" className="gap-1.5 font-normal">
                <span className={`size-1.5 rounded-full ${colorTipoLegajo(tipo)}`} />
                {tipo}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      {puedeEscribir ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onEditar}>
            <Pencil />
            Editar
          </Button>
          {activo !== undefined ? (
            <DesactivarReactivarProfesionalAction id={id} activo={activo} />
          ) : null}
          <EliminarProfesionalDefinitivoAction id={id} />
        </div>
      ) : null}
    </div>
  )
}
