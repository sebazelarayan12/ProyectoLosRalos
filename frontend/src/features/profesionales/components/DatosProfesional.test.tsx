import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DatosProfesional } from './DatosProfesional'
import type { ProfesionalDetalle } from '../api/obtenerProfesional'

const profesional: ProfesionalDetalle = {
  id: 'abc-1',
  apellido: 'Perez',
  nombre: 'Sara Gisela',
  dni: '12345678',
  cuil: '20-12345678-9',
  fechaNacimiento: '1980-01-01',
  sexo: 'Femenino',
  estadoCivil: 'Soltera',
  domicilio: 'Calle Falsa 123',
  barrio: 'Centro',
  localidad: 'Tucuman',
  provincia: 'Tucuman',
  codigoPostal: '4000',
  telefono: '3811234567',
  email: 'sara@example.com',
  funcion: 'Tec Estadisticas',
  servicio: 'Estadistica',
  nivel: 'Tecnico',
  planta: 'PermanenteEfectivo',
  nroExpediente: '123/2020',
  tipo: 'Administrativo',
  activo: true,
  fechaCreacion: '2026-01-01T00:00:00Z',
  fechaActualizacion: '2026-01-01T00:00:00Z',
  documentos: [],
}

describe('DatosProfesional', () => {
  test('muestra identificacion, contacto y cargo', () => {
    render(<DatosProfesional profesional={profesional} />)

    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('20-12345678-9')).toBeInTheDocument()
    expect(screen.getByText('Calle Falsa 123')).toBeInTheDocument()
    expect(screen.getByText('sara@example.com')).toBeInTheDocument()
    expect(screen.getByText('3811234567')).toBeInTheDocument()
    expect(screen.getByText('Tec Estadisticas')).toBeInTheDocument()
    expect(screen.getByText('Estadistica')).toBeInTheDocument()
  })

  test('muestra guion cuando un campo opcional es null', () => {
    render(<DatosProfesional profesional={{ ...profesional, servicio: null, telefono: null }} />)

    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })
})
