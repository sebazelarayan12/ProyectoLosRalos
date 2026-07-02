import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TablaResultados } from './TablaResultados'
import type { ProfesionalResumen } from '../api/buscarProfesionales'

const profesionales: ProfesionalResumen[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    apellido: 'Perez',
    nombre: 'Ana',
    funcion: 'Enfermera',
    servicio: 'Guardia',
    nroExpediente: '1/2020',
    tipo: 'Asistencial',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    apellido: 'Gomez',
    nombre: 'Luis',
    funcion: 'Chofer',
    servicio: null,
    nroExpediente: null,
    tipo: 'Administrativo',
  },
]

describe('TablaResultados', () => {
  test('muestra apellido, nombre, funcion, expediente y tipo de cada profesional', () => {
    render(<TablaResultados profesionales={profesionales} onVerLegajo={vi.fn()} />)

    expect(screen.getByText('Perez, Ana')).toBeInTheDocument()
    expect(screen.getByText('Enfermera / Guardia')).toBeInTheDocument()
    expect(screen.getByText('1/2020')).toBeInTheDocument()
    expect(screen.getByText('Asistencial')).toBeInTheDocument()

    expect(screen.getByText('Gomez, Luis')).toBeInTheDocument()
    expect(screen.getByText('Chofer')).toBeInTheDocument()
    expect(screen.getByText('Administrativo')).toBeInTheDocument()
  })

  test('nunca muestra DNI ni CUIL', () => {
    render(<TablaResultados profesionales={profesionales} onVerLegajo={vi.fn()} />)

    expect(screen.queryByText(/dni/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/cuil/i)).not.toBeInTheDocument()
  })

  test('click en Ver legajo llama a onVerLegajo con el id del profesional', async () => {
    const onVerLegajo = vi.fn()
    const user = userEvent.setup()
    render(<TablaResultados profesionales={profesionales} onVerLegajo={onVerLegajo} />)

    await user.click(screen.getAllByRole('button', { name: /ver legajo/i })[0])

    expect(onVerLegajo).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
  })
})
