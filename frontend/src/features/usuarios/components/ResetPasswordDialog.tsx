import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { api } from '@/lib/api'
import { resetearPassword } from '../api/resetearPassword'
import type { Usuario } from '../api/buscarUsuarios'

const resetPasswordSchema = z.object({
  nuevaPassword: z
    .string()
    .regex(/^(?=.*\d).{8,}$/, 'Minimo 8 caracteres y al menos 1 numero'),
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

type ResetPasswordDialogProps = {
  usuario: Usuario | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog({ usuario, open, onOpenChange }: ResetPasswordDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { nuevaPassword: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordValues) =>
      resetearPassword(api, usuario!.id, values.nuevaPassword),
    onSuccess: () => {
      reset()
      onOpenChange(false)
    },
  })

  if (!usuario) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetear contrasenia</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {usuario.nombre} - {usuario.email}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
          <FieldGroup>
            <p className="rounded-lg border bg-muted p-3 text-sm leading-relaxed">
              Se va a asignar una <strong className="font-semibold">nueva contrasenia temporal</strong> a{' '}
              {usuario.nombre}. Debera cambiarla en su proximo inicio de sesion.
            </p>
            <Field data-invalid={!!errors.nuevaPassword}>
              <FieldLabel htmlFor="nuevaPassword">Nueva password temporal</FieldLabel>
              <Input
                id="nuevaPassword"
                type="text"
                aria-invalid={!!errors.nuevaPassword}
                {...register('nuevaPassword')}
              />
              {errors.nuevaPassword && <FieldError>{errors.nuevaPassword.message}</FieldError>}
            </Field>
          </FieldGroup>

          {mutation.isError && (
            <p className="mt-2 text-sm text-destructive">
              {(mutation.error as { response?: { data?: { message?: string } } }).response?.data
                ?.message ?? 'No se pudo resetear la password'}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={mutation.isPending}>
              Resetear password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
