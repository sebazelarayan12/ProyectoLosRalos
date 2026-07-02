import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { useAuth } from '@/features/auth/context/AuthContext'
import { api } from '@/lib/api'

const loginSchema = z.object({
  email: z.string().min(1, 'Email requerido').email('Email invalido'),
  password: z.string().min(1, 'Contrasenia requerida'),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginResponse = {
  token: string
  nombre: string
  rol: 'Admin' | 'Visor'
  expiraEn: string
}

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [errorApi, setErrorApi] = useState<string | null>(null)

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
      navigate('/dashboard')
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
          <FieldLabel htmlFor="password">Contrasenia</FieldLabel>
          <Input id="password" type="password" aria-invalid={!!errors.password} {...register('password')} />
          {errors.password && <FieldError>{errors.password.message}</FieldError>}
        </Field>
        {errorApi && <p role="alert">{errorApi}</p>}
        <Button type="submit" disabled={isSubmitting}>
          Ingresar
        </Button>
      </FieldGroup>
    </form>
  )
}
