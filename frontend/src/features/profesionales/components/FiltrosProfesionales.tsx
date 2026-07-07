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
import type { EstadoProfesionalFiltro, Planta, TipoLegajo } from '../api/buscarProfesionales'

export type Filtros = {
  tipo?: TipoLegajo
  planta?: Planta
  estado?: EstadoProfesionalFiltro
}

type FiltrosProfesionalesProps = {
  filtros: Filtros
  onFiltrosChange: (filtros: Filtros) => void
}

const OPCIONES_TIPO = [
  { value: 'Asistencial', label: 'Asistencial' },
  { value: 'Administrativo', label: 'Administrativo' },
]

const OPCIONES_PLANTA = [
  { value: 'Transitorio', label: 'Transitorio' },
  { value: 'PermanenteInterino', label: 'Permanente Interino' },
  { value: 'PermanenteEfectivo', label: 'Permanente Efectivo' },
]

const OPCIONES_ESTADO = [
  { value: 'Activos', label: 'Activos' },
  { value: 'Inactivos', label: 'Inactivos' },
  { value: 'Todos', label: 'Todos' },
]

export function FiltrosProfesionales({ filtros, onFiltrosChange }: FiltrosProfesionalesProps) {
  const cantidadActivos = [filtros.tipo, filtros.planta, filtros.estado].filter(Boolean).length

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
            id="filtro-planta"
            label="Planta"
            placeholder="Todas"
            value={filtros.planta}
            onValueChange={(planta) => onFiltrosChange({ ...filtros, planta: planta as Planta })}
            options={OPCIONES_PLANTA}
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
            onClick={() => onFiltrosChange({ tipo: undefined, planta: undefined, estado: undefined })}
          >
            Limpiar filtros
          </Button>
        </FieldGroup>
      </SheetContent>
    </Sheet>
  )
}
