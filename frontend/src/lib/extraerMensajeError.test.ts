import { describe, test, expect } from 'vitest'
import { extraerMensajeError } from './extraerMensajeError'

describe('extraerMensajeError', () => {
  test('extrae el mensaje de un error de axios con response.data.message', () => {
    const error = { response: { data: { message: 'El email ya esta en uso' } } }

    expect(extraerMensajeError(error, 'fallback')).toBe('El email ya esta en uso')
  })

  test('usa el fallback si el error no tiene response.data.message', () => {
    const error = new Error('network error')

    expect(extraerMensajeError(error, 'No se pudo completar la accion')).toBe(
      'No se pudo completar la accion',
    )
  })

  test('usa el fallback si el error es undefined', () => {
    expect(extraerMensajeError(undefined, 'fallback')).toBe('fallback')
  })
})
