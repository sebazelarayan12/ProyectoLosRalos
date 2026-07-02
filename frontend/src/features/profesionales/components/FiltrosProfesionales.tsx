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
import type { Planta, TipoLegajo } from '../api/buscarProfesionales'

export type Filtros = {
  tipo?: TipoLegajo
  planta?: Planta
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

export function FiltrosProfesionales({ filtros, onFiltrosChange }: FiltrosProfesionalesProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Filtros</Button>
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
          <Button variant="ghost" onClick={() => onFiltrosChange({ tipo: undefined, planta: undefined })}>
            Limpiar filtros
          </Button>
        </FieldGroup>
      </SheetContent>
    </Sheet>
  )
}
