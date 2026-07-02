import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Planta, TipoLegajo } from '../api/buscarProfesionales'

export type Filtros = {
  tipo?: TipoLegajo
  planta?: Planta
}

type FiltrosProfesionalesProps = {
  filtros: Filtros
  onFiltrosChange: (filtros: Filtros) => void
}

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
          <Field>
            <FieldLabel htmlFor="filtro-tipo">Tipo de legajo</FieldLabel>
            <Select
              value={filtros.tipo}
              onValueChange={(tipo) => onFiltrosChange({ ...filtros, tipo: tipo as TipoLegajo })}
            >
              <SelectTrigger id="filtro-tipo" aria-label="Tipo de legajo">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Asistencial">Asistencial</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="filtro-planta">Planta</FieldLabel>
            <Select
              value={filtros.planta}
              onValueChange={(planta) => onFiltrosChange({ ...filtros, planta: planta as Planta })}
            >
              <SelectTrigger id="filtro-planta" aria-label="Planta">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Transitorio">Transitorio</SelectItem>
                  <SelectItem value="PermanenteInterino">Permanente Interino</SelectItem>
                  <SelectItem value="PermanenteEfectivo">Permanente Efectivo</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Button variant="ghost" onClick={() => onFiltrosChange({ tipo: undefined, planta: undefined })}>
            Limpiar filtros
          </Button>
        </FieldGroup>
      </SheetContent>
    </Sheet>
  )
}
