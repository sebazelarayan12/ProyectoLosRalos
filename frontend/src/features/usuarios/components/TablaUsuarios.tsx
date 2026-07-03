import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'
import { activarUsuario } from '../api/activarUsuario'
import { desactivarUsuario } from '../api/desactivarUsuario'
import type { Usuario } from '../api/buscarUsuarios'

type TablaUsuariosProps = {
  usuarios: Usuario[]
  onEditar: (usuario: Usuario) => void
  onResetearPassword: (usuario: Usuario) => void
}

function extraerMensajeError(error: unknown): string {
  const conRespuesta = error as { response?: { data?: { message?: string } } }
  return conRespuesta.response?.data?.message ?? 'No se pudo completar la accion'
}

type ActivarDesactivarActionProps = {
  usuario: Usuario
}

// AlertDialogAction cierra el dialog automaticamente al hacer click (comportamiento de Radix),
// asi que el dialog se controla a mano: solo se cierra en onSuccess, para poder mostrar el
// mensaje de error del backend (ej: autodesactivacion, ultimo admin) si la mutacion falla.
function ActivarDesactivarAction({ usuario }: ActivarDesactivarActionProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const activarMutation = useMutation({
    mutationFn: (id: string) => activarUsuario(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setOpen(false)
    },
  })

  const desactivarMutation = useMutation({
    mutationFn: (id: string) => desactivarUsuario(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setOpen(false)
    },
  })

  const mutation = usuario.activo ? desactivarMutation : activarMutation

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          {usuario.activo ? 'Desactivar' : 'Activar'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}</AlertDialogTitle>
          <AlertDialogDescription>
            {usuario.activo
              ? `${usuario.nombre} no va a poder iniciar sesion hasta que se reactive.`
              : `${usuario.nombre} va a poder volver a iniciar sesion.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {mutation.isError && (
          <p className="text-sm text-destructive">{extraerMensajeError(mutation.error)}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              mutation.mutate(usuario.id)
            }}
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function TablaUsuarios({ usuarios, onEditar, onResetearPassword }: TablaUsuariosProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Ultimo acceso</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {usuarios.map((usuario) => (
          <TableRow key={usuario.id}>
            <TableCell>{usuario.nombre}</TableCell>
            <TableCell>{usuario.email}</TableCell>
            <TableCell>
              <Badge variant="secondary">{usuario.rol}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={usuario.activo ? 'default' : 'outline'}>
                {usuario.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
            <TableCell>
              {usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso).toLocaleString() : '-'}
            </TableCell>
            <TableCell className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onEditar(usuario)}>
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onResetearPassword(usuario)}>
                Resetear password
              </Button>
              <ActivarDesactivarAction usuario={usuario} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
