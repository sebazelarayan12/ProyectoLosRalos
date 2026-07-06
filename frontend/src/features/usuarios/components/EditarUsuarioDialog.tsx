import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { SelectField } from '@/components/SelectField'
import { api } from '@/lib/api'
import { extraerMensajeError } from '@/lib/extraerMensajeError'
import { editarUsuario } from '../api/editarUsuario'
import type { Usuario } from '../api/buscarUsuarios'

const editarUsuarioSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email invalido'),
  rol: z.enum(['Admin', 'Visor'], { message: 'Rol requerido' }),
})

type EditarUsuarioValues = z.infer<typeof editarUsuarioSchema>

const opcionesRol = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Visor', label: 'Visor' },
]

type EditarUsuarioDialogProps = {
  usuario: Usuario | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditarUsuarioDialog({ usuario, open, onOpenChange }: EditarUsuarioDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditarUsuarioValues>({
    resolver: zodResolver(editarUsuarioSchema),
    values: usuario
      ? { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
      : undefined,
  })

  const mutation = useMutation({
    mutationFn: (values: EditarUsuarioValues) => editarUsuario(api, usuario!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      reset()
      onOpenChange(false)
      toast.success('Usuario actualizado correctamente')
    },
    onError: (error) => {
      toast.error(extraerMensajeError(error, 'No se pudo guardar los cambios'))
    },
  })

  if (!usuario) return null

  const valores = watch()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {usuario.nombre} - {usuario.email}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.nombre}>
              <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
              <Input id="nombre" aria-invalid={!!errors.nombre} {...register('nombre')} />
              {errors.nombre && <FieldError>{errors.nombre.message}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </Field>
            <SelectField
              id="rol"
              label="Rol"
              placeholder="Elegir rol"
              value={valores.rol}
              onValueChange={(v) => setValue('rol', v as EditarUsuarioValues['rol'], { shouldValidate: true })}
              options={opcionesRol}
              error={errors.rol?.message}
            />
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={mutation.isPending}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
