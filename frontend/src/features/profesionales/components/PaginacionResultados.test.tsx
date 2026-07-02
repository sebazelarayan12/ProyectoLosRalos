import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginacionResultados } from './PaginacionResultados'

describe('PaginacionResultados', () => {
  test('Anterior deshabilitado si canGoPrev es false', () => {
    render(
      <PaginacionResultados canGoPrev={false} canGoNext={true} onPrev={vi.fn()} onNext={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled()
  })

  test('Siguiente deshabilitado si canGoNext es false', () => {
    render(
      <PaginacionResultados canGoPrev={true} canGoNext={false} onPrev={vi.fn()} onNext={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled()
  })

  test('click en Siguiente llama a onNext', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(
      <PaginacionResultados canGoPrev={true} canGoNext={true} onPrev={vi.fn()} onNext={onNext} />,
    )

    await user.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(onNext).toHaveBeenCalled()
  })

  test('click en Anterior llama a onPrev', async () => {
    const onPrev = vi.fn()
    const user = userEvent.setup()
    render(
      <PaginacionResultados canGoPrev={true} canGoNext={true} onPrev={onPrev} onNext={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: /anterior/i }))

    expect(onPrev).toHaveBeenCalled()
  })
})
