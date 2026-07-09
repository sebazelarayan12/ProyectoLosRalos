import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SelectField } from '@/components/SelectField'
import { useAreasOperativas } from '../hooks/useAreasOperativas'
import type { EstadoProfesionalFiltro, TipoEfector, TipoLegajo } from '../api/buscarProfesionales'

export type Filtros = {
  tipo?: TipoLegajo
  areaOperativaId?: string
  tipoEfector?: TipoEfector
  estado?: EstadoProfesionalFiltro
}

type FiltrosProfesionalesProps = {
  filtros: Filtros
  onFiltrosChange: (filtros: Filtros) => void
}

const OPCIONES_TIPO = [
  { value: 'Asistencial', label: 'Asistencial' },
  { value: 'NoAsistencial', label: 'No asistencial' },
  { value: 'CP', label: 'Cobertura de servicio (CP)' },
]

const OPCIONES_TIPO_EFECTOR = [
  { value: 'Hospital', label: 'Hospital' },
  { value: 'CAPS', label: 'CAPS' },
]

const OPCIONES_ESTADO = [
  { value: 'Activos', label: 'Activos' },
  { value: 'Inactivos', label: 'Inactivos' },
  { value: 'Todos', label: 'Todos' },
]

export function FiltrosProfesionales({ filtros, onFiltrosChange }: FiltrosProfesionalesProps) {
  const { data: areasOperativas = [] } = useAreasOperativas()
  const opcionesAreaOperativa = areasOperativas.map((a) => ({ value: a.id, label: a.nombre }))

  const cantidadActivos = [filtros.tipo, filtros.areaOperativaId, filtros.tipoEfector, filtros.estado].filter(
    Boolean,
  ).length

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          Filtros
          {cantidadActivos > 0 ? (
            <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10.5px] font-semibold text-primary-foreground">
              {cantidadActivos}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <FieldGroup className="px-4">
          <SelectField
            id="filtro-tipo"
            label="Tipo de legajo"
            placeholder="Todos"
            value={filtros.tipo}
            onValueChange={(tipo) => onFiltrosChange({ ...filtros, tipo: tipo as TipoLegajo })}
            options={OPCIONES_TIPO}
          />
          <SelectField
            id="filtro-area-operativa"
            label="Area operativa"
            placeholder="Todas"
            value={filtros.areaOperativaId}
            onValueChange={(areaOperativaId) => onFiltrosChange({ ...filtros, areaOperativaId })}
            options={opcionesAreaOperativa}
          />
          <SelectField
            id="filtro-tipo-efector"
            label="Tipo de efector"
            placeholder="Todos"
            value={filtros.tipoEfector}
            onValueChange={(tipoEfector) =>
              onFiltrosChange({ ...filtros, tipoEfector: tipoEfector as TipoEfector })
            }
            options={OPCIONES_TIPO_EFECTOR}
          />
          <SelectField
            id="filtro-estado"
            label="Estado"
            placeholder="Activos"
            value={filtros.estado}
            onValueChange={(estado) => onFiltrosChange({ ...filtros, estado: estado as EstadoProfesionalFiltro })}
            options={OPCIONES_ESTADO}
          />
          <Button
            variant="ghost"
            onClick={() =>
              onFiltrosChange({ tipo: undefined, areaOperativaId: undefined, tipoEfector: undefined, estado: undefined })
            }
          >
            Limpiar filtros
          </Button>
        </FieldGroup>
      </SheetContent>
    </Sheet>
  )
}
