import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { SelectField } from '@/components/SelectField'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import type { ProfesionalRequestPayload } from '../api/crearProfesional'

const profesionalSchema = z.object({
  apellido: z.string().min(1, 'Apellido requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  dni: z.string().regex(/^\d{1,2}\.\d{3}\.\d{3}$/, 'Formato invalido. Ejemplo: 12.345.678'),
  cuil: z.string().regex(/^\d{2}-\d{8}-\d{1}$/, 'Formato invalido. Ejemplo: 20-12345678-0'),
  fechaNacimiento: z.string().min(1, 'Fecha de nacimiento requerida'),
  sexo: z.enum(['Masculino', 'Femenino', 'Otro'], { message: 'Sexo requerido' }),
  estadoCivil: z.enum(['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Otro'], {
    message: 'Estado civil requerido',
  }),
  domicilio: z.string().min(1, 'Domicilio requerido'),
  barrio: z.string(),
  localidad: z.string().min(1, 'Localidad requerida'),
  provincia: z.string().min(1, 'Provincia requerida'),
  codigoPostal: z.string(),
  telefono: z.string(),
  email: z.string().refine((v) => v === '' || z.string().email().safeParse(v).success, {
    message: 'Email invalido',
  }),
  funcion: z.string().min(1, 'Funcion requerida'),
  servicio: z.string(),
  nivel: z.enum(['Secundario', 'Terciario', 'Universitario'], { message: 'Nivel requerido' }),
  planta: z.enum(['Transitorio', 'PermanenteInterino', 'PermanenteEfectivo'], {
    message: 'Planta requerida',
  }),
  nroExpediente: z.string(),
  tipo: z.enum(['Asistencial', 'Administrativo'], { message: 'Tipo de legajo requerido' }),
})

export type ProfesionalFormValues = z.infer<typeof profesionalSchema>

const valoresPorDefecto: ProfesionalFormValues = {
  apellido: '',
  nombre: '',
  dni: '',
  cuil: '',
  fechaNacimiento: '',
  sexo: '' as never,
  estadoCivil: '' as never,
  domicilio: '',
  barrio: '',
  localidad: '',
  provincia: 'Tucuman',
  codigoPostal: '',
  telefono: '',
  email: '',
  funcion: '',
  servicio: '',
  nivel: '' as never,
  planta: '' as never,
  nroExpediente: '',
  tipo: '' as never,
}

const opcionesSexo = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino', label: 'Femenino' },
  { value: 'Otro', label: 'Otro' },
]
const opcionesEstadoCivil = [
  { value: 'Soltero', label: 'Soltero' },
  { value: 'Casado', label: 'Casado' },
  { value: 'Divorciado', label: 'Divorciado' },
  { value: 'Viudo', label: 'Viudo' },
  { value: 'Otro', label: 'Otro' },
]
const opcionesNivel = [
  { value: 'Secundario', label: 'Secundario' },
  { value: 'Terciario', label: 'Terciario' },
  { value: 'Universitario', label: 'Universitario' },
]
const opcionesPlanta = [
  { value: 'Transitorio', label: 'Transitorio' },
  { value: 'PermanenteInterino', label: 'Permanente interino' },
  { value: 'PermanenteEfectivo', label: 'Permanente efectivo' },
]
const opcionesTipo = [
  { value: 'Asistencial', label: 'Asistencial' },
  { value: 'Administrativo', label: 'Administrativo' },
]

function aNuloSiVacio(valor: string): string | null {
  return valor.trim() === '' ? null : valor
}

type ProfesionalFormProps = {
  modo: 'crear' | 'editar'
  valoresIniciales?: ProfesionalFormValues
  onSubmit: (payload: ProfesionalRequestPayload) => void
}

export function ProfesionalForm({ modo, valoresIniciales, onSubmit }: ProfesionalFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfesionalFormValues>({
    resolver: zodResolver(profesionalSchema),
    defaultValues: valoresIniciales ?? valoresPorDefecto,
  })

  useUnsavedChangesWarning(isDirty)

  const valores = watch()

  const submit = (values: ProfesionalFormValues) => {
    onSubmit({
      apellido: values.apellido,
      nombre: values.nombre,
      dni: values.dni,
      cuil: values.cuil,
      fechaNacimiento: values.fechaNacimiento,
      sexo: values.sexo,
      estadoCivil: values.estadoCivil,
      domicilio: values.domicilio,
      barrio: aNuloSiVacio(values.barrio),
      localidad: values.localidad,
      provincia: values.provincia,
      codigoPostal: aNuloSiVacio(values.codigoPostal),
      telefono: aNuloSiVacio(values.telefono),
      email: aNuloSiVacio(values.email),
      funcion: values.funcion,
      servicio: aNuloSiVacio(values.servicio),
      nivel: values.nivel,
      planta: values.planta,
      nroExpediente: aNuloSiVacio(values.nroExpediente),
      tipo: values.tipo,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <h2 className="font-heading text-base font-medium">Identificacion</h2>
        <Field data-invalid={!!errors.apellido}>
          <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
          <Input id="apellido" aria-invalid={!!errors.apellido} {...register('apellido')} />
          {errors.apellido && <FieldError>{errors.apellido.message}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.nombre}>
          <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
          <Input id="nombre" aria-invalid={!!errors.nombre} {...register('nombre')} />
          {errors.nombre && <FieldError>{errors.nombre.message}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.dni}>
          <FieldLabel htmlFor="dni">DNI</FieldLabel>
          <Input id="dni" placeholder="12.345.678" aria-invalid={!!errors.dni} {...register('dni')} />
          {errors.dni && <FieldError>{errors.dni.message}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.cuil}>
          <FieldLabel htmlFor="cuil">CUIL</FieldLabel>
          <Input id="cuil" placeholder="20-12345678-0" aria-invalid={!!errors.cuil} {...register('cuil')} />
          {errors.cuil && <FieldError>{errors.cuil.message}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.fechaNacimiento}>
          <FieldLabel htmlFor="fechaNacimiento">Fecha de nacimiento</FieldLabel>
          <Input
            id="fechaNacimiento"
            type="date"
            aria-invalid={!!errors.fechaNacimiento}
            {...register('fechaNacimiento')}
          />
          {errors.fechaNacimiento && <FieldError>{errors.fechaNacimiento.message}</FieldError>}
        </Field>
        <SelectField
          id="sexo"
          label="Sexo"
          placeholder="Elegir sexo"
          value={valores.sexo}
          onValueChange={(v) => setValue('sexo', v as ProfesionalFormValues['sexo'], { shouldValidate: true })}
          options={opcionesSexo}
          error={errors.sexo?.message}
        />
        <SelectField
          id="estadoCivil"
          label="Estado civil"
          placeholder="Elegir estado civil"
          value={valores.estadoCivil}
          onValueChange={(v) =>
            setValue('estadoCivil', v as ProfesionalFormValues['estadoCivil'], { shouldValidate: true })
          }
          options={opcionesEstadoCivil}
          error={errors.estadoCivil?.message}
        />
      </FieldGroup>

      <FieldGroup>
        <h2 className="font-heading text-base font-medium">Contacto</h2>
        <Field data-invalid={!!errors.domicilio}>
          <FieldLabel htmlFor="domicilio">Domicilio</FieldLabel>
          <Input id="domicilio" aria-invalid={!!errors.domicilio} {...register('domicilio')} />
          {errors.domicilio && <FieldError>{errors.domicilio.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="barrio">Barrio</FieldLabel>
          <Input id="barrio" {...register('barrio')} />
        </Field>
        <Field data-invalid={!!errors.localidad}>
          <FieldLabel htmlFor="localidad">Localidad</FieldLabel>
          <Input id="localidad" aria-invalid={!!errors.localidad} {...register('localidad')} />
          {errors.localidad && <FieldError>{errors.localidad.message}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.provincia}>
          <FieldLabel htmlFor="provincia">Provincia</FieldLabel>
          <Input id="provincia" aria-invalid={!!errors.provincia} {...register('provincia')} />
          {errors.provincia && <FieldError>{errors.provincia.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="codigoPostal">Codigo postal</FieldLabel>
          <Input id="codigoPostal" {...register('codigoPostal')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="telefono">Telefono</FieldLabel>
          <Input id="telefono" {...register('telefono')} />
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>
      </FieldGroup>

      <FieldGroup>
        <h2 className="font-heading text-base font-medium">Cargo</h2>
        <Field data-invalid={!!errors.funcion}>
          <FieldLabel htmlFor="funcion">Funcion</FieldLabel>
          <Input id="funcion" aria-invalid={!!errors.funcion} {...register('funcion')} />
          {errors.funcion && <FieldError>{errors.funcion.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="servicio">Servicio</FieldLabel>
          <Input id="servicio" {...register('servicio')} />
        </Field>
        <SelectField
          id="nivel"
          label="Nivel"
          placeholder="Elegir nivel"
          value={valores.nivel}
          onValueChange={(v) => setValue('nivel', v as ProfesionalFormValues['nivel'], { shouldValidate: true })}
          options={opcionesNivel}
          error={errors.nivel?.message}
        />
        <SelectField
          id="planta"
          label="Planta"
          placeholder="Elegir planta"
          value={valores.planta}
          onValueChange={(v) => setValue('planta', v as ProfesionalFormValues['planta'], { shouldValidate: true })}
          options={opcionesPlanta}
          error={errors.planta?.message}
        />
        <Field>
          <FieldLabel htmlFor="nroExpediente">N. de expediente</FieldLabel>
          <Input id="nroExpediente" {...register('nroExpediente')} />
        </Field>
        <SelectField
          id="tipo"
          label="Tipo de legajo"
          placeholder="Elegir tipo de legajo"
          value={valores.tipo}
          onValueChange={(v) => setValue('tipo', v as ProfesionalFormValues['tipo'], { shouldValidate: true })}
          options={opcionesTipo}
          error={errors.tipo?.message}
        />
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting}>
        {modo === 'crear' ? 'Crear profesional' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
