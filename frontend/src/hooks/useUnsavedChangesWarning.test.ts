import { describe, test, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning'

describe('useUnsavedChangesWarning', () => {
  test('previene el cierre de la pestania cuando hay cambios sin guardar', () => {
    renderHook(() => useUnsavedChangesWarning(true))

    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  test('no previene el cierre cuando no hay cambios sin guardar', () => {
    renderHook(() => useUnsavedChangesWarning(false))

    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })

  test('remueve el listener al desmontar', () => {
    const { unmount } = renderHook(() => useUnsavedChangesWarning(true))
    unmount()

    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })
})
