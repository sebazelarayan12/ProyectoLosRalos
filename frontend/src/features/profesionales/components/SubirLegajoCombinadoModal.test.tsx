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

  test('muestra error si la subida falla y refresca el legajo igual (puede haber documentos creados)', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('fail'))
    const onSubido = vi.fn()
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })

    render(
      <SubirLegajoCombinadoModal profesionalId="prof-1" open onOpenChange={vi.fn()} onSubido={onSubido} />,
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

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'No se pudo completar la subida — algunos documentos pueden haberse creado, revisa el legajo antes de reintentar',
      ),
    )
    await waitFor(() => expect(onSubido).toHaveBeenCalled())
  })

  test('rechaza una seleccion no contigua con un toast y no crea el segmento', async () => {
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })

    render(
      <SubirLegajoCombinadoModal profesionalId="prof-1" open onOpenChange={vi.fn()} onSubido={vi.fn()} />,
      { wrapper },
    )
    await user.upload(screen.getByLabelText(/seleccionar pdf combinado/i), archivo)
    await screen.findAllByRole('img', { name: /pagina/i })

    await user.click(screen.getByRole('checkbox', { name: /pagina 1/i }))
    await user.click(screen.getByRole('checkbox', { name: /pagina 4/i }))
    await user.click(screen.getByRole('button', { name: /armar segmento/i }))

    expect(toast.error).toHaveBeenCalledWith('Las paginas seleccionadas deben ser consecutivas')
    expect(screen.queryByText(/paginas 1-4/i)).not.toBeInTheDocument()
    // La seleccion queda intacta para que el usuario la corrija.
    expect(screen.getByRole('checkbox', { name: /pagina 1/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /pagina 4/i })).toBeChecked()
  })

  test('quitar un segmento libera sus paginas', async () => {
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

    expect(screen.getByText(/paginas 1-2/i)).toBeInTheDocument()
    expect(screen.getByText(/pag\. 1 — asignada/i)).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /pagina 1/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /quitar segmento paginas 1-2/i }))

    expect(screen.queryByText(/paginas 1-2/i)).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /pagina 1/i })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: /pagina 2/i })).toBeEnabled()
  })

  test('muestra indicador de carga mientras se procesan las miniaturas del PDF', async () => {
    const { cargarPdf } = await import('../lib/pdfMiniaturas')
    let resolverCarga: (value: { numPages: number }) => void = () => {}
    vi.mocked(cargarPdf).mockReturnValueOnce(
      new Promise((resolve) => {
        resolverCarga = resolve as (value: { numPages: number }) => void
      }),
    )
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })

    render(
      <SubirLegajoCombinadoModal profesionalId="prof-1" open onOpenChange={vi.fn()} onSubido={vi.fn()} />,
      { wrapper },
    )
    await user.upload(screen.getByLabelText(/seleccionar pdf combinado/i), archivo)

    expect(screen.getByText(/procesando pdf/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/seleccionar pdf combinado/i)).toBeDisabled()

    resolverCarga({ numPages: 4 })
    await screen.findAllByRole('img', { name: /pagina/i })

    expect(screen.queryByText(/procesando pdf/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/seleccionar pdf combinado/i)).toBeEnabled()
  })

  test('si el PDF no se puede leer, muestra error y limpia la seleccion', async () => {
    const { cargarPdf } = await import('../lib/pdfMiniaturas')
    vi.mocked(cargarPdf).mockRejectedValueOnce(new Error('pdf invalido'))
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })

    render(
      <SubirLegajoCombinadoModal profesionalId="prof-1" open onOpenChange={vi.fn()} onSubido={vi.fn()} />,
      { wrapper },
    )
    await user.upload(screen.getByLabelText(/seleccionar pdf combinado/i), archivo)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('No se pudo leer el PDF — verifica que el archivo no este danado'),
    )
    expect(screen.queryByText(/procesando pdf/i)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('img', { name: /pagina/i })).toHaveLength(0)
  })

  test('mientras se sube, el boton Guardar muestra estado de carga y los controles se deshabilitan', async () => {
    let resolverSubida: (value: { data: unknown[] }) => void = () => {}
    vi.mocked(api.post).mockReturnValueOnce(
      new Promise((resolve) => {
        resolverSubida = resolve
      }),
    )
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

    expect(screen.getByRole('button', { name: /subiendo/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /quitar segmento/i })).toBeDisabled()

    resolverSubida({ data: [{ id: 'doc-1' }] })
    await waitFor(() => expect(screen.queryByRole('button', { name: /subiendo/i })).not.toBeInTheDocument())
  })

  test('recuperar una pagina descartada la vuelve seleccionable', async () => {
    const user = userEvent.setup()
    const archivo = new File(['contenido'], 'legajo.pdf', { type: 'application/pdf' })

    render(
      <SubirLegajoCombinadoModal profesionalId="prof-1" open onOpenChange={vi.fn()} onSubido={vi.fn()} />,
      { wrapper },
    )
    await user.upload(screen.getByLabelText(/seleccionar pdf combinado/i), archivo)
    await screen.findAllByRole('img', { name: /pagina/i })

    await user.click(screen.getByRole('button', { name: /descartar pagina 3/i }))

    expect(screen.queryByRole('checkbox', { name: /pagina 3/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /recuperar pagina 3/i }))

    const checkbox = screen.getByRole('checkbox', { name: /pagina 3/i })
    expect(checkbox).toBeEnabled()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })
})
