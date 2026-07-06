import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTiposDocumento } from './useTiposDocumento'
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

describe('useTiposDocumento', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('trae los tipos de documento existentes', async () => {
    const tipos = [
      { id: 'tipo-1', nombre: 'DNI' },
      { id: 'tipo-2', nombre: 'Titulo' },
    ]
    vi.mocked(api.get).mockResolvedValueOnce({ data: tipos })

    const { result } = renderHook(() => useTiposDocumento(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(tipos)
    expect(api.get).toHaveBeenCalledWith('/tipos-documento')
  })
})
