import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsuarioForm } from './UsuarioForm'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'

vi.mock('@/hooks/useUnsavedChangesWarning')

describe('UsuarioForm', () => {
  test('muestra errores de validacion si se envia vacio', async () => {
    const user = userEvent.setup()
    render(<UsuarioForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /crear usuario/i }))

    expect(await screen.findByText(/nombre requerido/i)).toBeInTheDocument()
    expect(await screen.findByText(/email invalido/i)).toBeInTheDocument()
    expect(await screen.findByText(/minimo 8 caracteres/i)).toBeInTheDocument()
    expect(await screen.findByText(/rol requerido/i)).toBeInTheDocument()
  })

  test('conecta useUnsavedChangesWarning con isDirty del form', async () => {
    const user = userEvent.setup()
    render(<UsuarioForm onSubmit={vi.fn()} />)

    expect(useUnsavedChangesWarning).toHaveBeenCalledWith(false)

    await user.type(screen.getByLabelText(/^nombre$/i), 'Juan')

    expect(useUnsavedChangesWarning).toHaveBeenLastCalledWith(true)
  })

  test('con datos validos llama a onSubmit con el payload correcto', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<UsuarioForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/^nombre$/i), 'Juan Perez')
    await user.type(screen.getByLabelText(/^email$/i), 'juan@test.com')
    await user.type(screen.getByLabelText(/password temporal/i), 'password123')
    await user.click(screen.getByRole('combobox', { name: /^rol$/i }))
    await user.click(await screen.findByRole('option', { name: 'Administrativo' }))

    await user.click(screen.getByRole('button', { name: /crear usuario/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      {
        nombre: 'Juan Perez',
        email: 'juan@test.com',
        password: 'password123',
        rol: 'Administrativo',
      },
      expect.anything(),
    )
  })

  test('password sin numero muestra error de validacion', async () => {
    const user = userEvent.setup()
    render(<UsuarioForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/password temporal/i), 'passwordsinnumero')
    await user.click(screen.getByRole('button', { name: /crear usuario/i }))

    expect(await screen.findByText(/minimo 8 caracteres/i)).toBeInTheDocument()
  })
})
