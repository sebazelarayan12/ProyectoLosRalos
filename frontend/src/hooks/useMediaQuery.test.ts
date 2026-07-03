import { describe, test, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'

function createMatchMediaMock(initialMatches: boolean) {
  let matches = initialMatches
  let listener: ((e: MediaQueryListEvent) => void) | null = null

  const mql = {
    get matches() {
      return matches
    },
    media: '(max-width: 768px)',
    addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listener = cb
    }),
    removeEventListener: vi.fn(),
  }

  return {
    mql,
    triggerChange: (newMatches: boolean) => {
      matches = newMatches
      act(() => {
        listener?.({ matches: newMatches } as MediaQueryListEvent)
      })
    },
  }
}

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  test('retorna true si la query matchea de entrada', () => {
    const { mql } = createMatchMediaMock(true)
    window.matchMedia = vi.fn().mockReturnValue(mql)

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

    expect(result.current).toBe(true)
  })

  test('retorna false si la query no matchea de entrada', () => {
    const { mql } = createMatchMediaMock(false)
    window.matchMedia = vi.fn().mockReturnValue(mql)

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

    expect(result.current).toBe(false)
  })

  test('actualiza el valor cuando cambia el match', () => {
    const { mql, triggerChange } = createMatchMediaMock(false)
    window.matchMedia = vi.fn().mockReturnValue(mql)

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

    expect(result.current).toBe(false)
    triggerChange(true)
    expect(result.current).toBe(true)
  })

  test('remueve el listener al desmontar', () => {
    const { mql } = createMatchMediaMock(false)
    window.matchMedia = vi.fn().mockReturnValue(mql)

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    unmount()

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
