import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useArchivoDocumento } from './useArchivoDocumento'
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

describe('useArchivoDocumento', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('busca el blob del archivo cuando enabled es true', async () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    vi.mocked(api.get).mockResolvedValueOnce({ data: blob })

    const { result } = renderHook(() => useArchivoDocumento('doc-1', true), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBe(blob)
    expect(api.get).toHaveBeenCalledWith('/documentos/doc-1/file', { responseType: 'blob' })
  })

  test('no busca nada cuando enabled es false', () => {
    renderHook(() => useArchivoDocumento('doc-1', false), { wrapper })

    expect(api.get).not.toHaveBeenCalled()
  })

  test('no busca nada cuando id es undefined', () => {
    renderHook(() => useArchivoDocumento(undefined, true), { wrapper })

    expect(api.get).not.toHaveBeenCalled()
  })
})
