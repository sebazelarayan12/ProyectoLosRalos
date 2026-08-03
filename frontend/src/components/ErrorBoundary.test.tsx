import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function ComponenteQueExplota(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renderiza a los hijos cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>Contenido normal</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Contenido normal')).toBeInTheDocument()
  })

  test('atrapa un error de render y muestra la pantalla de error en vez de quedar en blanco', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ComponenteQueExplota />
      </ErrorBoundary>,
    )

    expect(screen.getByText(/algo salio mal/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recargar/i })).toBeInTheDocument()
  })
})
