import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useProfesionalDetalle } from './useProfesionalDetalle'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useProfesionalDetalle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('busca el detalle del profesional por id y expone el resultado', async () => {
    const detalle = { id: 'abc-1', apellido: 'Perez', nombre: 'Ana', documentos: [] }
    vi.mocked(api.get).mockResolvedValueOnce({ data: detalle })

    const { result } = renderHook(() => useProfesionalDetalle('abc-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(detalle)
    expect(api.get).toHaveBeenCalledWith('/profesionales/abc-1')
  })
})
