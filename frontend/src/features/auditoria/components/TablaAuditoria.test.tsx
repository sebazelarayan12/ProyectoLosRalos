import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TablaAuditoria } from './TablaAuditoria'
import type { AuditLogEntry } from '../api/buscarAuditoria'

const eventos: AuditLogEntry[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    usuarioId: '22222222-2222-2222-2222-222222222222',
    nombreUsuario: 'Admin Test',
    accion: 'VerLegajo',
    profesionalId: '33333333-3333-3333-3333-333333333333',
    detalleExtra: null,
    timestamp: '2026-01-15T10:00:00Z',
    ipOrigen: '1.2.3.4',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    usuarioId: null,
    nombreUsuario: null,
    accion: 'LoginFallido',
    profesionalId: null,
    detalleExtra: null,
    timestamp: '2026-01-15T09:00:00Z',
    ipOrigen: '5.6.7.8',
  },
]

describe('TablaAuditoria', () => {
  test('muestra usuario, accion e ip de cada evento', () => {
    render(<TablaAuditoria eventos={eventos} onVerProfesional={vi.fn()} />)

    expect(screen.getByText('Admin Test')).toBeInTheDocument()
    expect(screen.getByText('VerLegajo')).toBeInTheDocument()
    expect(screen.getByText(/1\.2\.3\.4/)).toBeInTheDocument()
    expect(screen.getByText('LoginFallido')).toBeInTheDocument()
  })

  test('evento sin usuario muestra guion', () => {
    render(<TablaAuditoria eventos={eventos} onVerProfesional={vi.fn()} />)

    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  test('click en Ver legajo llama a onVerProfesional con el id del profesional', async () => {
    const onVerProfesional = vi.fn()
    const user = userEvent.setup()
    render(<TablaAuditoria eventos={eventos} onVerProfesional={onVerProfesional} />)

    await user.click(screen.getAllByRole('button', { name: /ver legajo/i })[0])

    expect(onVerProfesional).toHaveBeenCalledWith('33333333-3333-3333-3333-333333333333')
  })
})
