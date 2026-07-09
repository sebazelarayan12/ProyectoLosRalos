import { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, Search, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'
import { useProfesionales } from '../hooks/useProfesionales'
import { TablaResultados } from '../components/TablaResultados'
import { FiltrosProfesionales, type Filtros } from '../components/FiltrosProfesionales'
import { OrdenarProfesionales } from '../components/OrdenarProfesionales'
import { PaginacionResultados } from '@/components/PaginacionResultados'
import type { OrdenarPor } from '../api/buscarProfesionales'

export function BusquedaProfesionalesPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtros>({})
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor | undefined>(undefined)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [historial, setHistorial] = useState<(string | undefined)[]>([])
  const debouncedBusqueda = useDebounce(busqueda, 300)
  const deferredBusqueda = useDeferredValue(debouncedBusqueda)

  const { data, isLoading } = useProfesionales({
    busqueda: deferredBusqueda || undefined,
    tipo: filtros.tipo,
    areaOperativaId: filtros.areaOperativaId,
    tipoEfector: filtros.tipoEfector,
    estado: filtros.estado,
    ordenarPor,
    cursor,
    porPagina: 20,
  })

  const handleBusquedaChange = (value: string) => {
    setBusqueda(value)
    setCursor(undefined)
    setHistorial([])
  }

  const handleFiltrosChange = (nuevosFiltros: Filtros) => {
    setFiltros(nuevosFiltros)
    setCursor(undefined)
    setHistorial([])
  }

  const handleOrdenarPorChange = (nuevoOrden: OrdenarPor) => {
    setOrdenarPor(nuevoOrden)
    setCursor(undefined)
    setHistorial([])
  }

  const handleNext = () => {
    if (!data?.cursor) return
    setHistorial((h) => [...h, cursor])
    setCursor(data.cursor ?? undefined)
  }

  const handlePrev = () => {
    if (historial.length === 0) return
    setCursor(historial[historial.length - 1])
    setHistorial((h) => h.slice(0, -1))
  }

  const handleVerLegajo = (id: string) => navigate(`/profesionales/${id}`)

  const sinResultados = !isLoading && data && data.items.length === 0

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <Field className="sm:max-w-[420px] sm:flex-1">
          <FieldLabel htmlFor="busqueda">Apellido o expediente</FieldLabel>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
            <Input
              id="busqueda"
              value={busqueda}
              onChange={(e) => handleBusquedaChange(e.target.value)}
              placeholder="Buscar por apellido o N. de expediente..."
              className="pl-8"
            />
            {isLoading ? (
              <Loader2 className="absolute right-2.5 size-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </Field>
        <div className="flex flex-wrap items-end gap-2">
          <FiltrosProfesionales filtros={filtros} onFiltrosChange={handleFiltrosChange} />
          <OrdenarProfesionales ordenarPor={ordenarPor} onOrdenarPorChange={handleOrdenarPorChange} />
          {usuario?.rol === 'Admin' || usuario?.rol === 'Administrativo' ? (
            <Button onClick={() => navigate('/profesionales/nuevo')}>
              <Plus />
              Nuevo profesional
            </Button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border">
          <div className="flex flex-col divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-3.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ) : data && data.items.length > 0 ? (
        <TablaResultados profesionales={data.items} onVerLegajo={handleVerLegajo} />
      ) : (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border py-11 text-center">
          <div className="mb-2 flex size-13 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-6" />
          </div>
          <h2 className="font-heading font-semibold">
            {busqueda ? 'Sin coincidencias' : 'Comenza tu busqueda'}
          </h2>
          <p className="max-w-[320px] text-sm text-muted-foreground">
            {sinResultados
              ? 'No se encontraron profesionales con ese apellido o expediente'
              : 'Ingresa un apellido o numero de expediente para ver los legajos disponibles. Podes afinar con los filtros.'}
          </p>
        </div>
      )}

      <PaginacionResultados
        canGoPrev={historial.length > 0}
        canGoNext={!!data?.hasNextPage}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  )
}
