import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pencil, Power } from 'lucide-react'
import { toast } from 'sonner'
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
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { api } from '@/lib/api'
import { extraerMensajeError } from '@/lib/extraerMensajeError'
import { activarUsuario } from '../api/activarUsuario'
import { desactivarUsuario } from '../api/desactivarUsuario'
import type { Usuario } from '../api/buscarUsuarios'

type TablaUsuariosProps = {
  usuarios: Usuario[]
  onEditar: (usuario: Usuario) => void
  onResetearPassword: (usuario: Usuario) => void
}

function RolBadge({ rol }: { rol: Usuario['rol'] }) {
  return (
    <Badge className={rol === 'Admin' ? 'gap-1.5 bg-accent font-normal text-accent-foreground' : 'gap-1.5 font-normal'} variant={rol === 'Admin' ? 'default' : 'secondary'}>
      <span className={`size-1.5 rounded-full ${rol === 'Admin' ? 'bg-primary' : 'bg-muted-foreground'}`} />
      {rol}
    </Badge>
  )
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge className="gap-1.5 border-success/30 bg-success/10 font-normal text-success">
      <span className="size-1.5 rounded-full bg-success" />
      Activo
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground" />
      Inactivo
    </Badge>
  )
}

type ActivarDesactivarActionProps = {
  usuario: Usuario
  className?: string
}

// AlertDialogAction cierra el dialog automaticamente al hacer click (comportamiento de Radix),
// asi que el dialog se controla a mano: solo se cierra en onSuccess, para que si la mutacion
// falla (ej: autodesactivacion, ultimo admin) el usuario pueda reintentar sin reabrir el dialog.
function ActivarDesactivarAction({ usuario, className }: ActivarDesactivarActionProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const activarMutation = useMutation({
    mutationFn: (id: string) => activarUsuario(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setOpen(false)
      toast.success('Usuario activado')
    },
    onError: (error) => {
      toast.error(extraerMensajeError(error, 'No se pudo completar la accion'))
    },
  })

  const desactivarMutation = useMutation({
    mutationFn: (id: string) => desactivarUsuario(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setOpen(false)
      toast.success('Usuario desactivado')
    },
    onError: (error) => {
      toast.error(extraerMensajeError(error, 'No se pudo completar la accion'))
    },
  })

  const mutation = usuario.activo ? desactivarMutation : activarMutation

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Power />
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
  const esDesktop = useMediaQuery('(min-width: 768px)')

  if (!esDesktop) {
    return (
      <div className="flex flex-col gap-2.5">
        {usuarios.map((usuario) => (
          <div key={usuario.id} className="flex flex-col gap-3 rounded-xl border bg-card p-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="font-heading font-semibold">{usuario.nombre}</span>
              <span className="text-sm break-all text-muted-foreground">{usuario.email}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RolBadge rol={usuario.rol} />
              <EstadoBadge activo={usuario.activo} />
            </div>
            <span className="text-xs text-muted-foreground">
              Ultimo acceso: {usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso).toLocaleString() : 'nunca'}
            </span>
            <div className="flex gap-2 border-t pt-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditar(usuario)}>
                <Pencil />
                Editar
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onResetearPassword(usuario)}>
                <KeyRound />
                Resetear password
              </Button>
              <ActivarDesactivarAction usuario={usuario} className="flex-1" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Ultimo acceso</TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell className="font-medium">{usuario.nombre}</TableCell>
              <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
              <TableCell>
                <RolBadge rol={usuario.rol} />
              </TableCell>
              <TableCell>
                <EstadoBadge activo={usuario.activo} />
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso).toLocaleString() : '-'}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEditar(usuario)}>
                    <Pencil />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onResetearPassword(usuario)}>
                    <KeyRound />
                    Resetear password
                  </Button>
                  <ActivarDesactivarAction usuario={usuario} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
