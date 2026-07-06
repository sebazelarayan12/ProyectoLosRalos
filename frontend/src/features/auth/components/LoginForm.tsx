import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { useAuth } from '@/features/auth/context/AuthContext'
import { api } from '@/lib/api'

const loginSchema = z.object({
  email: z.string().min(1, 'Email requerido').email('Email invalido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginResponse = {
  token: string
  nombre: string
  rol: 'Admin' | 'Administrativo'
  expiraEn: string
}

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [errorApi, setErrorApi] = useState<string | null>(null)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setErrorApi(null)
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', values)
      login(data.token, { nombre: data.nombre, rol: data.rol })
      navigate(data.rol === 'Administrativo' ? '/profesionales' : '/dashboard')
    } catch {
      setErrorApi('Credenciales invalidas')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <div className="relative flex items-center">
            <Input
              id="password"
              type={mostrarPassword ? 'text' : 'password'}
              className="pr-10"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 text-muted-foreground hover:text-foreground"
              onClick={() => setMostrarPassword((v) => !v)}
              aria-label={mostrarPassword ? 'Ocultar clave ingresada' : 'Mostrar clave ingresada'}
            >
              {mostrarPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          {errors.password && <FieldError>{errors.password.message}</FieldError>}
        </Field>
        {errorApi && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong className="font-semibold">{errorApi}.</strong> Verifica tu email y contraseña e
              intenta de nuevo.
            </span>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </FieldGroup>
    </form>
  )
}
