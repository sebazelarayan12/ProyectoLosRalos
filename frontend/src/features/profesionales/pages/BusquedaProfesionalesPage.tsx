import { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'
import { useProfesionales } from '../hooks/useProfesionales'
import { TablaResultados } from '../components/TablaResultados'
import { FiltrosProfesionales, type Filtros } from '../components/FiltrosProfesionales'
import { PaginacionResultados } from '@/components/PaginacionResultados'

export function BusquedaProfesionalesPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [apellido, setApellido] = useState('')
  const [filtros, setFiltros] = useState<Filtros>({})
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [historial, setHistorial] = useState<(string | undefined)[]>([])
  const debouncedApellido = useDebounce(apellido, 300)
  const deferredApellido = useDeferredValue(debouncedApellido)

  const { data, isLoading } = useProfesionales({
    apellido: deferredApellido || undefined,
    tipo: filtros.tipo,
    planta: filtros.planta,
    cursor,
    porPagina: 20,
  })

  const handleApellidoChange = (value: string) => {
    setApellido(value)
    setCursor(undefined)
    setHistorial([])
  }

  const handleFiltrosChange = (nuevosFiltros: Filtros) => {
    setFiltros(nuevosFiltros)
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-end justify-between gap-4">
        <Field>
          <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
          <Input
            id="apellido"
            value={apellido}
            onChange={(e) => handleApellidoChange(e.target.value)}
            placeholder="Buscar por apellido"
          />
        </Field>
        <div className="flex items-end gap-2">
          <FiltrosProfesionales filtros={filtros} onFiltrosChange={handleFiltrosChange} />
          {usuario?.rol === 'Admin' ? (
            <Button onClick={() => navigate('/profesionales/nuevo')}>Nuevo profesional</Button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data && data.items.length > 0 ? (
        <TablaResultados profesionales={data.items} onVerLegajo={handleVerLegajo} />
      ) : (
        <p className="text-muted-foreground">
          No se encontraron profesionales con ese apellido
        </p>
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
