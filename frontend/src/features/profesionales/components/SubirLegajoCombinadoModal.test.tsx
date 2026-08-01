import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { SubirLegajoCombinadoModal } from './SubirLegajoCombinadoModal'
import { api } from '@/lib/api'
import { toast } from 'sonner'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../lib/pdfMiniaturas', () => ({
  cargarPdf: vi.fn().mockResolvedValue({ numPages: 4 }),
  renderizarMiniatura: vi.fn().mockResolvedValue('data:image/png;base64,FAKE'),
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

async function elegirTipo(user: ReturnType<typeof userEvent.setup>, indiceSegmento: number, texto: string) {
  const combobox = screen.getAllByRole('combobox')[indiceSegmento]
  await user.click(combobox)
  await user.type(screen.getByPlaceholderText(/buscar o crear tipo/i), texto)
  await user.click(await screen.findByText(new RegExp(`crear tipo: ${texto}`, 'i')))
}

describe('SubirLegajoCombinadoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: [] })
  })

  test('al elegir un PDF, muestra una miniatura por pagina y Guardar deshabilitado', async () => {
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })

    render(
      <SubirLegajoCombinadoModal profesionalId="prof-1" open onOpenChange={vi.fn()} onSubido={vi.fn()} />,
      { wrapper },
    )
    await user.upload(screen.getByLabelText(/seleccionar pdf combinado/i), archivo)

    expect(await screen.findAllByRole('img', { name: /pagina/i })).toHaveLength(4)
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled()
  })

  test('Guardar se habilita recien cuando todas las paginas estan en un segmento o descartadas', async () => {
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })

    render(
      <SubirLegajoCombinadoModal profesionalId="prof-1" open onOpenChange={vi.fn()} onSubido={vi.fn()} />,
      { wrapper },
    )
    await user.upload(screen.getByLabelText(/seleccionar pdf combinado/i), archivo)
    await screen.findAllByRole('img', { name: /pagina/i })

    await user.click(screen.getByRole('checkbox', { name: /pagina 1/i }))
    await user.click(screen.getByRole('checkbox', { name: /pagina 2/i }))
    await user.click(screen.getByRole('button', { name: /armar segmento/i }))
    await elegirTipo(user, 0, 'Titulo')

    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /descartar pagina 3/i }))
    await user.click(screen.getByRole('button', { name: /descartar pagina 4/i }))

    expect(screen.getByRole('button', { name: /guardar/i })).toBeEnabled()
  })

  test('al guardar, sube el archivo con los segmentos armados y notifica onSubido', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: [{ id: 'doc-1' }] })
    const onSubido = vi.fn()
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })

    render(
      <SubirLegajoCombinadoModal profesionalId="prof-1" open onOpenChange={onOpenChange} onSubido={onSubido} />,
      { wrapper },
    )
    await user.upload(screen.getByLabelText(/seleccionar pdf combinado/i), archivo)
    await screen.findAllByRole('img', { name: /pagina/i })

    for (const n of [1, 2, 3, 4]) {
      await user.click(screen.getByRole('checkbox', { name: new RegExp(`pagina ${n}`, 'i') }))
    }
    await user.click(screen.getByRole('button', { name: /armar segmento/i }))
    await elegirTipo(user, 0, 'Titulo')

    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(onSubido).toHaveBeenCalled())
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(toast.success).toHaveBeenCalled()
    expect(api.post).toHaveBeenCalledWith(
      '/profesionales/prof-1/documentos/lote',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  })

  test('muestra error si la subida falla', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('fail'))
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })

    render(
      <SubirLegajoCombinadoModal profesionalId="prof-1" open onOpenChange={vi.fn()} onSubido={vi.fn()} />,
      { wrapper },
    )
    await user.upload(screen.getByLabelText(/seleccionar pdf combinado/i), archivo)
    await screen.findAllByRole('img', { name: /pagina/i })

    for (const n of [1, 2, 3, 4]) {
      await user.click(screen.getByRole('checkbox', { name: new RegExp(`pagina ${n}`, 'i') }))
    }
    await user.click(screen.getByRole('button', { name: /armar segmento/i }))
    await elegirTipo(user, 0, 'Titulo')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No se pudo subir el legajo combinado'))
  })
})
