import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useProfesionales } from './useProfesionales'
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

describe('useProfesionales', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('busca profesionales con los params dados y expone los resultados', async () => {
    const respuesta = {
      items: [
        {
          id: '1',
          apellido: 'Perez',
          nombre: 'Ana',
          funcion: 'Enfermera',
          servicio: 'Guardia',
          nroExpediente: '1/2020',
          tipo: 'Asistencial',
        },
      ],
      porPagina: 20,
      hasNextPage: false,
      cursor: null,
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: respuesta })

    const { result } = renderHook(() => useProfesionales({ apellido: 'Perez', porPagina: 20 }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(respuesta)
    expect(api.get).toHaveBeenCalledWith('/profesionales', {
      params: { apellido: 'Perez', porPagina: 20 },
    })
  })
})
