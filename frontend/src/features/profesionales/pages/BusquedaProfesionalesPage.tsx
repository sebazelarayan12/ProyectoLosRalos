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

export function BusquedaProfesionalesPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [apellido, setApellido] = useState('')
  const debouncedApellido = useDebounce(apellido, 300)
  const deferredApellido = useDeferredValue(debouncedApellido)

  const { data, isLoading } = useProfesionales({
    apellido: deferredApellido || undefined,
    porPagina: 20,
  })

  const handleVerLegajo = (id: string) => navigate(`/profesionales/${id}`)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-end justify-between gap-4">
        <Field>
          <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
          <Input
            id="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Buscar por apellido"
          />
        </Field>
        {usuario?.rol === 'Admin' ? (
          <Button onClick={() => navigate('/profesionales/nuevo')}>Nuevo profesional</Button>
        ) : null}
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
    </div>
  )
}
