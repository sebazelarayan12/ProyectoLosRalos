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
    dni: '12.345.678',
    cuil: '27-12345678-3',
    matricula: 'MP-1234',
    cargo: 'Enfermera',
    nroExpediente: '1/2020',
    tipo: 'Asistencial',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    apellido: 'Gomez',
    nombre: 'Luis',
    dni: '23.456.789',
    cuil: null,
    matricula: null,
    cargo: 'Chofer',
    nroExpediente: null,
    tipo: null,
  },
]

describe('TablaResultados', () => {
  test('muestra apellido, nombre, cargo, expediente y tipo de cada profesional', () => {
    render(<TablaResultados profesionales={profesionales} onVerLegajo={vi.fn()} />)

    expect(screen.getByText('Perez, Ana')).toBeInTheDocument()
    expect(screen.getByText('Enfermera')).toBeInTheDocument()
    expect(screen.getByText('1/2020')).toBeInTheDocument()
    expect(screen.getByText('Asistencial')).toBeInTheDocument()

    expect(screen.getByText('Gomez, Luis')).toBeInTheDocument()
    expect(screen.getByText('Chofer')).toBeInTheDocument()
  })

  test('muestra DNI y CUIL de cada profesional', () => {
    render(<TablaResultados profesionales={profesionales} onVerLegajo={vi.fn()} />)

    expect(screen.getByText('12.345.678')).toBeInTheDocument()
    expect(screen.getByText('27-12345678-3')).toBeInTheDocument()
    expect(screen.getByText('23.456.789')).toBeInTheDocument()
  })

  test('sin tipo de legajo, no rompe', () => {
    render(<TablaResultados profesionales={profesionales} onVerLegajo={vi.fn()} />)

    expect(screen.getByText('Gomez, Luis')).toBeInTheDocument()
  })

  test('click en Ver legajo llama a onVerLegajo con el id del profesional', async () => {
    const onVerLegajo = vi.fn()
    const user = userEvent.setup()
    render(<TablaResultados profesionales={profesionales} onVerLegajo={onVerLegajo} />)

    await user.click(screen.getAllByRole('button', { name: /ver legajo/i })[0])

    expect(onVerLegajo).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
  })
})
