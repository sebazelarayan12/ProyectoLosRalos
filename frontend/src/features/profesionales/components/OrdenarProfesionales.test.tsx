import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrdenarProfesionales } from './OrdenarProfesionales'

describe('OrdenarProfesionales', () => {
  test('muestra Apellido (A-Z) por defecto cuando no hay orden elegido', () => {
    render(<OrdenarProfesionales ordenarPor={undefined} onOrdenarPorChange={vi.fn()} />)

    expect(screen.getByRole('combobox', { name: /ordenar/i })).toHaveTextContent(/apellido.*a.*z/i)
  })

  test('elegir DNI ascendente llama a onOrdenarPorChange con DniAsc', async () => {
    const onOrdenarPorChange = vi.fn()
    const user = userEvent.setup()
    render(<OrdenarProfesionales ordenarPor={undefined} onOrdenarPorChange={onOrdenarPorChange} />)

    await user.click(screen.getByRole('combobox', { name: /ordenar/i }))
    await user.click(await screen.findByRole('option', { name: /dni.*ascendente/i }))

    expect(onOrdenarPorChange).toHaveBeenCalledWith('DniAsc')
  })

  test('elegir DNI descendente llama a onOrdenarPorChange con DniDesc', async () => {
    const onOrdenarPorChange = vi.fn()
    const user = userEvent.setup()
    render(<OrdenarProfesionales ordenarPor={undefined} onOrdenarPorChange={onOrdenarPorChange} />)

    await user.click(screen.getByRole('combobox', { name: /ordenar/i }))
    await user.click(await screen.findByRole('option', { name: /dni.*descendente/i }))

    expect(onOrdenarPorChange).toHaveBeenCalledWith('DniDesc')
  })

  test('elegir Apellido (Z-A) llama a onOrdenarPorChange con ApellidoDesc', async () => {
    const onOrdenarPorChange = vi.fn()
    const user = userEvent.setup()
    render(<OrdenarProfesionales ordenarPor={undefined} onOrdenarPorChange={onOrdenarPorChange} />)

    await user.click(screen.getByRole('combobox', { name: /ordenar/i }))
    await user.click(await screen.findByRole('option', { name: /apellido.*z.*a/i }))

    expect(onOrdenarPorChange).toHaveBeenCalledWith('ApellidoDesc')
  })
})
