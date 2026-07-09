import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ProfesionalForm, type ProfesionalFormValues } from './ProfesionalForm'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import { api } from '@/lib/api'
import type { ProfesionalRequestPayload } from '../api/crearProfesional'

vi.mock('@/hooks/useUnsavedChangesWarning')

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const valoresValidos: ProfesionalFormValues = {
  apellido: 'Gomez',
  nombre: 'Luis',
  dni: '11.111.111',
  cuil: '20-11111111-0',
  fechaNacimiento: '1990-01-01',
  sexo: 'Masculino',
  estadoCivil: 'Soltero',
  domicilio: 'Calle Falsa 123',
  barrio: '',
  localidad: 'San Miguel de Tucuman',
  provincia: 'Tucuman',
  codigoPostal: '',
  telefono: '',
  email: '',
  matricula: '',
  cargo: 'Chofer',
  areaOperativa: 'Los Ralos',
  tipoEfector: 'Hospital',
  nivel: 'Secundario',
  planta: 'Transitorio',
  nroExpediente: '',
  tipo: 'NoAsistencial',
}

async function elegirEnCombobox(
  user: ReturnType<typeof userEvent.setup>,
  nombreCombobox: RegExp,
  texto: string,
) {
  await user.click(screen.getByRole('combobox', { name: nombreCombobox }))
  await user.type(screen.getByPlaceholderText(/buscar o crear/i), texto)
  await user.click(await screen.findByText(new RegExp(`crear: ${texto}`, 'i')))
}

async function llenarCamposObligatorios(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^apellido$/i), valoresValidos.apellido)
  await user.type(screen.getByLabelText(/^nombre$/i), valoresValidos.nombre)
  await user.type(screen.getByLabelText(/^dni$/i), valoresValidos.dni)
  await user.type(screen.getByLabelText(/^cuil$/i), valoresValidos.cuil)
  await user.type(screen.getByLabelText(/fecha de nacimiento/i), valoresValidos.fechaNacimiento)
  await user.click(screen.getByRole('combobox', { name: /^sexo$/i }))
  await user.click(await screen.findByRole('option', { name: 'Masculino' }))
  await user.click(screen.getByRole('combobox', { name: /estado civil/i }))
  await user.click(await screen.findByRole('option', { name: 'Soltero' }))
  await user.click(screen.getByRole('button', { name: /^domicilio/i }))
  await user.type(screen.getByLabelText(/^domicilio$/i), valoresValidos.domicilio)
  await user.type(screen.getByLabelText(/^localidad$/i), valoresValidos.localidad)
  await user.clear(screen.getByLabelText(/^provincia$/i))
  await user.type(screen.getByLabelText(/^provincia$/i), valoresValidos.provincia)
  await user.click(screen.getByRole('button', { name: /datos laborales/i }))
  await elegirEnCombobox(user, /^cargo$/i, valoresValidos.cargo)
  await elegirEnCombobox(user, /area operativa/i, valoresValidos.areaOperativa)
  await user.click(screen.getByRole('combobox', { name: /tipo de efector/i }))
  await user.click(await screen.findByRole('option', { name: 'Hospital' }))
  await user.click(screen.getByRole('combobox', { name: /^nivel$/i }))
  await user.click(await screen.findByRole('option', { name: 'Secundario' }))
  await user.click(screen.getByRole('combobox', { name: /^planta$/i }))
  await user.click(await screen.findByRole('option', { name: 'Transitorio' }))
  await user.click(screen.getByRole('combobox', { name: /tipo de legajo/i }))
  await user.click(await screen.findByRole('option', { name: 'No asistencial' }))
}

describe('ProfesionalForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: [] })
  })

  test('muestra errores de validacion si se envia vacio', async () => {
    const user = userEvent.setup()
    render(<ProfesionalForm modo="crear" onSubmit={vi.fn()} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /crear profesional/i }))

    expect(await screen.findAllByText(/requerid/i)).not.toHaveLength(0)
  })

  test(
    'envia el payload completo con campos opcionales vacios como null',
    async () => {
      const onSubmit = vi.fn()
      const user = userEvent.setup()
      render(<ProfesionalForm modo="crear" onSubmit={onSubmit} />, { wrapper })

      await llenarCamposObligatorios(user)
      await user.click(screen.getByRole('button', { name: /crear profesional/i }))

      expect(onSubmit).toHaveBeenCalledTimes(1)
      const payload = onSubmit.mock.calls[0][0] as ProfesionalRequestPayload
      expect(payload.apellido).toBe('Gomez')
      expect(payload.sexo).toBe('Masculino')
      expect(payload.tipo).toBe('NoAsistencial')
      expect(payload.cargo).toBe('Chofer')
      expect(payload.areaOperativa).toBe('Los Ralos')
      expect(payload.tipoEfector).toBe('Hospital')
      expect(payload.barrio).toBeNull()
      expect(payload.telefono).toBeNull()
      expect(payload.matricula).toBeNull()
    },
    15000,
  )

  test('avisa de cambios sin guardar cuando el usuario modifica un campo', async () => {
    const user = userEvent.setup()
    render(<ProfesionalForm modo="crear" onSubmit={vi.fn()} />, { wrapper })

    expect(useUnsavedChangesWarning).toHaveBeenCalledWith(false)

    await user.type(screen.getByLabelText(/^apellido$/i), 'G')

    expect(useUnsavedChangesWarning).toHaveBeenLastCalledWith(true)
  })

  test(
    'modo editar con Cuil, EstadoCivil, Domicilio, Nivel, Planta y Tipo vacios permite guardar sin completarlos',
    async () => {
      const onSubmit = vi.fn()
      const user = userEvent.setup()
      const valoresConNulls: ProfesionalFormValues = {
        ...valoresValidos,
        cuil: '',
        estadoCivil: '',
        domicilio: '',
        nivel: '',
        planta: '',
        tipo: '',
      } as ProfesionalFormValues

      render(
        <ProfesionalForm modo="editar" valoresIniciales={valoresConNulls} onSubmit={onSubmit} />,
        { wrapper },
      )

      await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

      expect(onSubmit).toHaveBeenCalledTimes(1)
      const payload = onSubmit.mock.calls[0][0] as ProfesionalRequestPayload
      expect(payload.cuil).toBeNull()
      expect(payload.estadoCivil).toBeNull()
      expect(payload.domicilio).toBeNull()
      expect(payload.nivel).toBeNull()
      expect(payload.planta).toBeNull()
      expect(payload.tipo).toBeNull()
    },
    15000,
  )

  test('modo editar precarga valores iniciales y dice Guardar cambios', () => {
    render(
      <ProfesionalForm
        modo="editar"
        valoresIniciales={valoresValidos}
        onSubmit={vi.fn()}
      />,
      { wrapper },
    )

    expect(screen.getByLabelText(/^apellido$/i)).toHaveValue('Gomez')
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
  })
})
