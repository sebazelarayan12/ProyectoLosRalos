import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { PerfilTopbar } from './PerfilTopbar'

describe('PerfilTopbar', () => {
  test('muestra nombre completo y numero de expediente', () => {
    render(
      <MemoryRouter>
        <PerfilTopbar
          apellido="Perez"
          nombre="Ana"
          nroExpediente="1/2020"
          esAdmin={false}
          onEditar={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Perez, Ana')).toBeInTheDocument()
    expect(screen.getByText('1/2020')).toBeInTheDocument()
  })

  test('muestra boton Editar solo si esAdmin es true', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PerfilTopbar
          apellido="Perez"
          nombre="Ana"
          nroExpediente="1/2020"
          esAdmin={false}
          onEditar={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <PerfilTopbar
          apellido="Perez"
          nombre="Ana"
          nroExpediente="1/2020"
          esAdmin={true}
          onEditar={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  test('click en Editar llama a onEditar', async () => {
    const onEditar = vi.fn()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <PerfilTopbar
          apellido="Perez"
          nombre="Ana"
          nroExpediente="1/2020"
          esAdmin={true}
          onEditar={onEditar}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /editar/i }))

    expect(onEditar).toHaveBeenCalled()
  })
})
