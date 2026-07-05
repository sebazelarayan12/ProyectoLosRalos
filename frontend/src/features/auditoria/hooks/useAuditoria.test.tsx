import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAuditoria } from './useAuditoria'
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

describe('useAuditoria', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('busca eventos de auditoria con los params dados y expone los resultados', async () => {
    const respuesta = {
      items: [
        {
          id: '1',
          usuarioId: '2',
          nombreUsuario: 'Admin Test',
          accion: 'Login',
          profesionalId: null,
          detalleExtra: null,
          timestamp: '2026-01-15T10:00:00Z',
          ipOrigen: '1.2.3.4',
        },
      ],
      porPagina: 50,
      hasNextPage: false,
      cursor: null,
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: respuesta })

    const { result } = renderHook(() => useAuditoria({ porPagina: 50 }), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(respuesta)
    expect(api.get).toHaveBeenCalledWith('/audit', { params: { porPagina: 50 } })
  })
})
