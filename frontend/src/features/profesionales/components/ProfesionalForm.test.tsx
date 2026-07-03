import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfesionalForm, type ProfesionalFormValues } from './ProfesionalForm'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import type { ProfesionalRequestPayload } from '../api/crearProfesional'

vi.mock('@/hooks/useUnsavedChangesWarning')

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
  funcion: 'Chofer',
  servicio: '',
  nivel: 'Secundario',
  planta: 'Transitorio',
  nroExpediente: '',
  tipo: 'Administrativo',
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
  await user.type(screen.getByLabelText(/^domicilio$/i), valoresValidos.domicilio)
  await user.type(screen.getByLabelText(/^localidad$/i), valoresValidos.localidad)
  await user.clear(screen.getByLabelText(/^provincia$/i))
  await user.type(screen.getByLabelText(/^provincia$/i), valoresValidos.provincia)
  await user.type(screen.getByLabelText(/^funcion$/i), valoresValidos.funcion)
  await user.click(screen.getByRole('combobox', { name: /^nivel$/i }))
  await user.click(await screen.findByRole('option', { name: 'Secundario' }))
  await user.click(screen.getByRole('combobox', { name: /^planta$/i }))
  await user.click(await screen.findByRole('option', { name: 'Transitorio' }))
  await user.click(screen.getByRole('combobox', { name: /tipo de legajo/i }))
  await user.click(await screen.findByRole('option', { name: 'Administrativo' }))
}

describe('ProfesionalForm', () => {
  test('muestra errores de validacion si se envia vacio', async () => {
    const user = userEvent.setup()
    render(<ProfesionalForm modo="crear" onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /crear profesional/i }))

    expect(await screen.findAllByText(/requerid/i)).not.toHaveLength(0)
  })

  test(
    'envia el payload completo con campos opcionales vacios como null',
    async () => {
      const onSubmit = vi.fn()
      const user = userEvent.setup()
      render(<ProfesionalForm modo="crear" onSubmit={onSubmit} />)

      await llenarCamposObligatorios(user)
      await user.click(screen.getByRole('button', { name: /crear profesional/i }))

      expect(onSubmit).toHaveBeenCalledTimes(1)
      const payload = onSubmit.mock.calls[0][0] as ProfesionalRequestPayload
      expect(payload.apellido).toBe('Gomez')
      expect(payload.sexo).toBe('Masculino')
      expect(payload.tipo).toBe('Administrativo')
      expect(payload.barrio).toBeNull()
      expect(payload.telefono).toBeNull()
    },
    15000,
  )

  test('avisa de cambios sin guardar cuando el usuario modifica un campo', async () => {
    const user = userEvent.setup()
    render(<ProfesionalForm modo="crear" onSubmit={vi.fn()} />)

    expect(useUnsavedChangesWarning).toHaveBeenCalledWith(false)

    await user.type(screen.getByLabelText(/^apellido$/i), 'G')

    expect(useUnsavedChangesWarning).toHaveBeenLastCalledWith(true)
  })

  test('modo editar precarga valores iniciales y dice Guardar cambios', () => {
    render(
      <ProfesionalForm
        modo="editar"
        valoresIniciales={valoresValidos}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/^apellido$/i)).toHaveValue('Gomez')
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
  })
})
