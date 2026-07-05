import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History } from 'lucide-react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PaginacionResultados } from '@/components/PaginacionResultados'
import { useAuditoria } from '../hooks/useAuditoria'
import { TablaAuditoria } from '../components/TablaAuditoria'

export function AuditoriaPage() {
  const navigate = useNavigate()
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [historial, setHistorial] = useState<(string | undefined)[]>([])

  const { data, isLoading } = useAuditoria({
    desde: desde || undefined,
    hasta: hasta || undefined,
    cursor,
    porPagina: 50,
  })

  const resetPaginacion = () => {
    setCursor(undefined)
    setHistorial([])
  }

  const handleDesdeChange = (value: string) => {
    setDesde(value)
    resetPaginacion()
  }

  const handleHastaChange = (value: string) => {
    setHasta(value)
    resetPaginacion()
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="font-heading text-xl font-semibold sm:text-2xl">Auditoria</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Registro de acciones sobre legajos y usuarios del sistema
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Field className="max-w-[200px]">
          <FieldLabel htmlFor="desde">Desde</FieldLabel>
          <Input id="desde" type="date" value={desde} onChange={(e) => handleDesdeChange(e.target.value)} />
        </Field>
        <Field className="max-w-[200px]">
          <FieldLabel htmlFor="hasta">Hasta</FieldLabel>
          <Input id="hasta" type="date" value={hasta} onChange={(e) => handleHastaChange(e.target.value)} />
        </Field>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border">
          <div className="flex flex-col divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-3.5">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : data && data.items.length > 0 ? (
        <TablaAuditoria eventos={data.items} onVerProfesional={(id) => navigate(`/profesionales/${id}`)} />
      ) : (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border py-11 text-center">
          <div className="mb-2 flex size-13 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <History className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">No hay eventos registrados en este rango</p>
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
