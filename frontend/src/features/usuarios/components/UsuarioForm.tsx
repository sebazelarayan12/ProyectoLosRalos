import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { SelectField } from '@/components/SelectField'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import type { CrearUsuarioPayload } from '../api/crearUsuario'

const usuarioSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email invalido'),
  password: z.string().regex(/^(?=.*\d).{8,}$/, 'Minimo 8 caracteres y al menos 1 numero'),
  rol: z.enum(['Admin', 'Visor'], { message: 'Rol requerido' }),
})

export type UsuarioFormValues = z.infer<typeof usuarioSchema>

const valoresPorDefecto: UsuarioFormValues = {
  nombre: '',
  email: '',
  password: '',
  rol: '' as never,
}

const opcionesRol = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Visor', label: 'Visor' },
]

type UsuarioFormProps = {
  onSubmit: (payload: CrearUsuarioPayload) => void
}

export function UsuarioForm({ onSubmit }: UsuarioFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: valoresPorDefecto,
  })

  useUnsavedChangesWarning(isDirty)

  const valores = watch()

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
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
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password temporal</FieldLabel>
          <Input id="password" aria-invalid={!!errors.password} {...register('password')} />
          {errors.password && <FieldError>{errors.password.message}</FieldError>}
        </Field>
        <SelectField
          id="rol"
          label="Rol"
          placeholder="Elegir rol"
          value={valores.rol}
          onValueChange={(v) => setValue('rol', v as UsuarioFormValues['rol'], { shouldValidate: true })}
          options={opcionesRol}
          error={errors.rol?.message}
        />
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting}>
        Crear usuario
      </Button>
    </form>
  )
}
